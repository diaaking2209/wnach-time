require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// ============== الإعدادات (من ملف .env) ==============
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.BOT_CHANNEL_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// ========================================================

if (!DISCORD_TOKEN || !CHANNEL_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Please set all required environment variables in your .env file.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sentMessages = new Map();
const DEBOUNCE_TIME_MS = 3000;

// أيقونات الحالات
const statusConfig = {
  pending_orders: { name: 'Pending', icon: '⏳', color: 0x3498db, step: 1 },
  processing_orders: { name: 'Processing', icon: '🔄', color: 0xf1c40f, step: 2 },
  completed_orders: { name: 'Completed', icon: '✅', color: 0x2ecc71, step: 4 },
  cancelled_orders: { name: 'Cancelled', icon: '❌', color: 0xe74c3c, step: 0 }
};

// توليد شريط التقدم
function createProgressBar(step) {
  const totalSteps = 4;
  let bar = '';
  for (let i = 1; i <= totalSteps; i++) {
    bar += i <= step ? '🟢' : '⚪';
  }
  return bar;
}

// دالة لإرسال الطلب إلى ديسكورد
async function sendOrderToDiscord(order, table) {
  try {
    if (!order.display_id) {
      console.log(`[IGNORE] Order ${order.id} has no display_id.`);
      return;
    }

    const orderKey = order.display_id;
    const now = Date.now();
    const lastSent = sentMessages.get(orderKey);

    if (lastSent && now - lastSent < DEBOUNCE_TIME_MS) {
      console.log(`[DEBOUNCE] Ignoring update for order #${orderKey}.`);
      return;
    }
    sentMessages.set(orderKey, now);

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
        console.error(`Could not find channel with ID: ${CHANNEL_ID}`);
        return;
    }
    
    const status = statusConfig[table] || { name: 'Unknown', icon: '📦', color: 0x95a5a6, step: 0 };
    const progressBar = createProgressBar(status.step);

    const username = order.customer_username || 'Unknown User';
    const providerId = order.customer_provider_id;
    const mentionUser = providerId ? `<@${providerId}>` : 'N/A';
    const lastModBy = order.last_modified_by_admin_username || 'System';

    const itemsFormatted = order.items?.length
      ? order.items.map(i => `• ${i.product_emoji || '📦'} **${i.product_name}** ×${i.quantity} — **$${Number(i.price_at_purchase).toFixed(2)}**`).join('\n')
      : 'No items listed.';

    const embed = new EmbedBuilder()
      .setTitle(`${status.icon} Order ${status.name} — #${order.display_id}`)
      .setColor(status.color)
      .setThumbnail(order.items?.[0]?.product_image_url || 'https://i.postimg.cc/0KdnQQm2/image-14-1-1.webp')
      .addFields(
        { name: '📊 Order Progress', value: `${progressBar}\n*Step ${status.step} of 4*`, inline: false },
        { name: '👤 Customer', value: `**Username:** ${username}\n**Mention:** ${mentionUser}`, inline: true },
        { name: '💰 Total', value: `**$${(order.total_amount ?? 0).toFixed(2)}**`, inline: true },
        { name: '📦 Items', value: itemsFormatted, inline: false }
      )
      .setFooter({ text: `Modified by: ${lastModBy} | Table: ${table}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log(`[SUCCESS] Sent notification for order #${order.display_id}`);

  } catch (error) {
    console.error(`[ERROR] Failed to send order #${order.display_id}:`, error);
  }
}


client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const tables = Object.keys(statusConfig);

  tables.forEach(table => {
    supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        async (payload) => {
          console.log(`[CHANGE DETECTED] Event: ${payload.eventType}, Table: ${table}`);
          
          let orderData = payload.new || {};
          
          // For INSERT and UPDATE, the `new` payload is what we care about.
          // For DELETE, there is no `new`, so we ignore it to prevent errors.
          if (payload.eventType === 'DELETE') {
              console.log(`[DELETE] Ignoring delete event for order in ${table}.`);
              return;
          }
          
          if (!orderData.id) {
              console.log(`[IGNORE] Payload for ${payload.eventType} in ${table} has no data.`);
              return;
          }
          
          // Send notification only for newly inserted orders.
          if (payload.eventType === 'INSERT') {
            await sendOrderToDiscord(orderData, table);
          } else {
            console.log(`[UPDATE/OTHER] Event type is not INSERT, not sending notification for order #${orderData.display_id}`);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(`Subscription error on table ${table}:`, err);
        } else {
          console.log(`Successfully subscribed to ${table} changes with status: ${status}`);
        }
      });
  });
});

client.login(DISCORD_TOKEN);

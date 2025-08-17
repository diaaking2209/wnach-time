
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// ============== الإعدادات (من ملف .env) ==============
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1403414827686170747'; // Your Server ID
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use the SERVICE KEY for admin rights
// ========================================================

if (!DISCORD_TOKEN || !GUILD_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Please set all required environment variables in your .env file.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SYNC_INTERVAL_MS = 5000; // 5 seconds

async function syncGuildMembers() {
  console.log(`[${new Date().toISOString()}] Starting sync...`);
  try {
    // 1. Fetch all members from the Discord Guild
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      console.error(`Could not find guild with ID: ${GUILD_ID}`);
      return;
    }
    const guildMembers = await guild.members.fetch();
    const discordMemberIds = new Set(guildMembers.map(member => member.user.id));
    console.log(`Found ${discordMemberIds.size} members in Discord server.`);

    // 2. Fetch all members currently in our database table
    const { data: dbMembers, error: fetchDbError } = await supabase
      .from('guild_members')
      .select('provider_id');

    if (fetchDbError) {
      console.error("Error fetching members from DB:", fetchDbError.message);
      return;
    }
    const dbMemberIds = new Set(dbMembers.map(member => member.provider_id));
    console.log(`Found ${dbMemberIds.size} members in the database.`);

    // 3. Determine who to add and who to remove
    const membersToAdd = [...discordMemberIds].filter(id => !dbMemberIds.has(id));
    const membersToRemove = [...dbMemberIds].filter(id => !discordMemberIds.has(id));

    // 4. Add new members to the database
    if (membersToAdd.length > 0) {
      console.log(`Adding ${membersToAdd.length} new members...`);
      const rowsToAdd = membersToAdd.map(id => ({ provider_id: id }));
      const { error: insertError } = await supabase.from('guild_members').insert(rowsToAdd);
      if (insertError) {
        console.error("Error inserting new members:", insertError.message);
      } else {
        console.log("Successfully added new members.");
      }
    }

    // 5. Remove members who have left the server
    if (membersToRemove.length > 0) {
      console.log(`Removing ${membersToRemove.length} members...`);
      const { error: deleteError } = await supabase
        .from('guild_members')
        .delete()
        .in('provider_id', membersToRemove);

      if (deleteError) {
        console.error("Error deleting members:", deleteError.message);
      } else {
        console.log("Successfully removed members.");
      }
    }

    console.log("Sync completed.");

  } catch (error) {
    console.error("An unexpected error occurred during sync:", error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Syncing members for guild ${GUILD_ID} every ${SYNC_INTERVAL_MS / 1000} seconds.`);
  
  // Run the sync immediately on startup
  await syncGuildMembers();
  
  // Then run it on a schedule
  setInterval(syncGuildMembers, SYNC_INTERVAL_MS);
});

client.login(DISCORD_TOKEN);


"use client"
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  const { language } = useLanguage();
  const t = translations[language].termsPage;
  const lastUpdatedDate = new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{t.title}</CardTitle>
          <CardDescription>
            {t.lastUpdated}: {lastUpdatedDate}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {t.content.map((section, index) => (
              <div key={index} className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
                <p className="mt-2 leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

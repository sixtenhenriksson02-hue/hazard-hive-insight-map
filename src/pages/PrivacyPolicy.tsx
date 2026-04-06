import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const sv = lang === "sv";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-primary text-primary-foreground shadow-lg">
        <div className="container flex h-14 items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <h1 className="text-base font-bold">{sv ? "Integritetspolicy" : "Privacy Policy"}</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 md:py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{sv ? "Integritetspolicy" : "Privacy Policy"}</h1>
          <p className="text-sm text-muted-foreground">
            {sv ? "Senast uppdaterad: " : "Last updated: "}
            {new Date().toLocaleDateString(sv ? "sv-SE" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <Section title={sv ? "1. Inledning" : "1. Introduction"}>
          {sv
            ? "Denna integritetspolicy beskriver hur vi samlar in, använder och skyddar dina personuppgifter när du använder vår tjänst för riskrapportering och arbetsmiljöhantering. Vi värnar om din integritet och behandlar alla personuppgifter i enlighet med gällande dataskyddslagstiftning, inklusive EU:s allmänna dataskyddsförordning (GDPR)."
            : "This privacy policy describes how we collect, use, and protect your personal data when you use our risk reporting and workplace safety management service. We value your privacy and process all personal data in accordance with applicable data protection legislation, including the EU General Data Protection Regulation (GDPR)."}
        </Section>

        <Section title={sv ? "2. Vilka uppgifter vi samlar in" : "2. Data We Collect"}>
          <ul className="list-disc pl-5 space-y-2">
            <li>{sv ? "Kontouppgifter: e-postadress och visningsnamn vid registrering." : "Account information: email address and display name upon registration."}</li>
            <li>{sv ? "Riskrapporter: beskrivningar av incidenter, platsdata, kategoriseringar och bilder som du laddar upp." : "Risk reports: incident descriptions, location data, categorizations, and images you upload."}</li>
            <li>{sv ? "Projektinformation: projektnamn och kopplingar mellan användare och projekt." : "Project information: project names and user-project associations."}</li>
            <li>{sv ? "Teknisk data: enhetstyp, webbläsare och anonymiserad användningsstatistik för att förbättra tjänsten." : "Technical data: device type, browser, and anonymized usage statistics to improve the service."}</li>
          </ul>
        </Section>

        <Section title={sv ? "3. Hur vi använder dina uppgifter" : "3. How We Use Your Data"}>
          <ul className="list-disc pl-5 space-y-2">
            <li>{sv ? "Tillhandahålla och förbättra tjänsten för riskrapportering och arbetsmiljöhantering." : "Provide and improve the risk reporting and workplace safety management service."}</li>
            <li>{sv ? "Generera AI-baserade riskbedömningar och sammanställa periodrapporter." : "Generate AI-based risk assessments and compile periodic reports."}</li>
            <li>{sv ? "Skicka notifieringar om nya rapporter och statusuppdateringar." : "Send notifications about new reports and status updates."}</li>
            <li>{sv ? "Uppfylla rättsliga skyldigheter gällande systematiskt arbetsmiljöarbete (SAM)." : "Fulfill legal obligations regarding systematic work environment management."}</li>
          </ul>
        </Section>

        <Section title={sv ? "4. Lagring och säkerhet" : "4. Storage and Security"}>
          {sv
            ? "Dina uppgifter lagras säkert med kryptering både vid överföring och i vila. Vi använder branschstandardlösningar för autentisering och åtkomstkontroll. Uppgifter sparas så länge ditt konto är aktivt eller så länge det krävs för att uppfylla rättsliga skyldigheter."
            : "Your data is stored securely with encryption both in transit and at rest. We use industry-standard solutions for authentication and access control. Data is retained for as long as your account is active or as required to fulfill legal obligations."}
        </Section>

        <Section title={sv ? "5. Delning av uppgifter" : "5. Data Sharing"}>
          {sv
            ? "Vi säljer aldrig dina personuppgifter. Uppgifter kan delas med: projektadministratörer inom ditt projekt (riskrapporter och statistik), AI-tjänsteleverantörer för riskbedömning (anonymiserat när möjligt), samt myndigheter om det krävs enligt lag."
            : "We never sell your personal data. Data may be shared with: project administrators within your project (risk reports and statistics), AI service providers for risk assessment (anonymized where possible), and authorities if required by law."}
        </Section>

        <Section title={sv ? "6. Dina rättigheter" : "6. Your Rights"}>
          <ul className="list-disc pl-5 space-y-2">
            <li>{sv ? "Rätt till tillgång: begär en kopia av dina personuppgifter." : "Right of access: request a copy of your personal data."}</li>
            <li>{sv ? "Rätt till rättelse: korrigera felaktiga uppgifter." : "Right to rectification: correct inaccurate data."}</li>
            <li>{sv ? "Rätt till radering: begär att dina uppgifter tas bort." : "Right to erasure: request deletion of your data."}</li>
            <li>{sv ? "Rätt till dataportabilitet: få dina uppgifter i ett maskinläsbart format." : "Right to data portability: receive your data in a machine-readable format."}</li>
            <li>{sv ? "Rätt att invända: invända mot viss behandling av dina uppgifter." : "Right to object: object to certain processing of your data."}</li>
          </ul>
        </Section>

        <Section title={sv ? "7. Cookies" : "7. Cookies"}>
          {sv
            ? "Vi använder nödvändiga cookies för autentisering och sessionshantering. Inga tredjepartscookies för spårning eller reklam används."
            : "We use essential cookies for authentication and session management. No third-party tracking or advertising cookies are used."}
        </Section>

        <Section title={sv ? "8. Kontakt" : "8. Contact"}>
          {sv
            ? "Om du har frågor om denna integritetspolicy eller vill utöva dina rättigheter, vänligen kontakta oss via e-post eller genom appen."
            : "If you have questions about this privacy policy or wish to exercise your rights, please contact us via email or through the app."}
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

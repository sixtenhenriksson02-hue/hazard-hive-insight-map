import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Siren, Phone, ShieldAlert, Heart, Flame, AlertTriangle, ArrowRight } from "lucide-react";

export default function EmergencyGuide() {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();

  const sv = lang === "sv";

  const steps = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: sv ? "1. LARMA" : "1. CALL FOR HELP",
      color: "bg-red-600 text-white",
      borderColor: "border-red-600",
      description: sv
        ? "Ring 112 omedelbart. Berätta vad som hänt, var du befinner dig och hur många som är skadade. Stanna kvar i luren tills operatören säger att du kan lägga på."
        : "Call 112 immediately. Describe what happened, your location and how many are injured. Stay on the line until the operator says you can hang up.",
      details: sv
        ? ["Ange exakt adress och plats på arbetsplatsen", "Beskriv skadans art", "Följ operatörens instruktioner"]
        : ["Give exact address and workplace location", "Describe the nature of injury", "Follow the operator's instructions"],
    },
    {
      icon: <ShieldAlert className="h-6 w-6" />,
      title: sv ? "2. RÄDDA" : "2. RESCUE",
      color: "bg-orange-500 text-white",
      borderColor: "border-orange-500",
      description: sv
        ? "Rädda dig själv och andra från fara – men bara om det kan göras utan risk för dig själv. Flytta den skadade bort från riskområdet om det är säkert."
        : "Save yourself and others from danger – but only if it can be done without risk to yourself. Move the injured away from the risk area if safe.",
      details: sv
        ? ["Säkra olycksplatsen", "Flytta inte den skadade i onödan", "Utsätt dig aldrig för fara"]
        : ["Secure the accident site", "Don't move the injured unnecessarily", "Never put yourself in danger"],
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: sv ? "3. VARNA" : "3. WARN",
      color: "bg-amber-500 text-white",
      borderColor: "border-amber-500",
      description: sv
        ? "Varna andra på arbetsplatsen om faran. Spärra av olycksplatsen om det behövs. Se till att ingen obehörig kommer in i riskzonen."
        : "Warn others at the workplace about the danger. Cordon off the accident site if needed. Ensure no unauthorized person enters the risk zone.",
      details: sv
        ? ["Använd varningsskyltar eller avspärrningsband", "Informera arbetsledare och skyddsombud", "Säkerställ att området är säkert"]
        : ["Use warning signs or barrier tape", "Inform supervisors and safety representatives", "Ensure the area is secure"],
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: sv ? "4. GE FÖRSTA HJÄLPEN" : "4. GIVE FIRST AID",
      color: "bg-green-600 text-white",
      borderColor: "border-green-600",
      description: sv
        ? "Ge första hjälpen till den skadade. Kontrollera andning och puls. Stoppa blödningar med tryck. Håll den skadade varm och lugn tills ambulans anländer."
        : "Give first aid to the injured. Check breathing and pulse. Stop bleeding with pressure. Keep the injured warm and calm until ambulance arrives.",
      details: sv
        ? ["Kontrollera medvetande (L-ABC)", "Vid hjärtstopp – starta HLR och använd hjärtstartare", "Stoppa blödningar med tryckförband", "Lägg i framstupa sidoläge vid medvetslöshet"]
        : ["Check consciousness (DR-ABC)", "In cardiac arrest – start CPR and use defibrillator", "Stop bleeding with pressure bandage", "Place in recovery position if unconscious"],
    },
    {
      icon: <Flame className="h-6 w-6" />,
      title: sv ? "5. SLÄCK (vid brand)" : "5. EXTINGUISH (if fire)",
      color: "bg-rose-700 text-white",
      borderColor: "border-rose-700",
      description: sv
        ? "Försök bara släcka branden om den är liten och hanterbar. Använd närmaste brandsläckare. Rikta mot basen av elden. Om branden inte kan kontrolleras – utrym omedelbart."
        : "Only attempt to extinguish if the fire is small and manageable. Use the nearest fire extinguisher. Aim at the base of the fire. If the fire can't be controlled – evacuate immediately.",
      details: sv
        ? ["Använd PASS-metoden: Pull, Aim, Squeeze, Sweep", "Stäng dörrar för att begränsa spridning", "Utrym via närmaste nödutgång om branden sprids"]
        : ["Use PASS method: Pull, Aim, Squeeze, Sweep", "Close doors to limit spread", "Evacuate via nearest emergency exit if fire spreads"],
    },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-400/40 bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors font-semibold"
      >
        <Siren className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{sv ? "Nödläge" : "Emergency"}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="h-5 w-5" />
              {sv ? "Nödlägeguide – Vid olycka" : "Emergency Guide – In case of accident"}
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 mb-2">
            <p className="text-sm font-semibold text-destructive">
              {sv
                ? "Behåll lugnet. Följ stegen nedan i ordning."
                : "Stay calm. Follow the steps below in order."}
            </p>
            <p className="text-xs text-destructive/80 mt-1 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {sv ? "Nödnummer: 112" : "Emergency number: 112"}
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className={`rounded-lg border-l-4 ${step.borderColor} bg-card border border-border p-4`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center shrink-0`}>
                    {step.icon}
                  </div>
                  <h3 className="text-sm font-bold text-card-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{step.description}</p>
                <div className="space-y-1">
                  {step.details.map((detail, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted/50 border border-border p-3 mt-2">
            <p className="text-xs text-muted-foreground">
              {sv
                ? "Tips: Kolla APD-planen för att se var förstahjälpen-kit, brandsläckare och hjärtstartare finns placerade."
                : "Tip: Check the site plan to see where first aid kits, fire extinguishers and defibrillators are located."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useRef } from "react";
import { CATEGORIES, RiskReport } from "@/types/risk";
import { Camera, Send, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ReportFormProps {
  onSubmit: (report: Omit<RiskReport, "id" | "createdAt" | "riskLevel">) => void;
}

export default function ReportForm({ onSubmit }: ReportFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    category: CATEGORIES[0],
    reportedBy: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location || !form.reportedBy) {
      toast({ title: "Fyll i alla fält", variant: "destructive" });
      return;
    }
    onSubmit({
      ...form,
      status: "open",
      imageUrl: imagePreview || undefined,
    });
    setForm({ title: "", description: "", location: "", category: CATEGORIES[0], reportedBy: "" });
    setImagePreview(null);
    toast({ title: "Rapport skapad!", description: "Risken har bedömts automatiskt." });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 md:p-6 animate-fade-in">
      <h2 className="text-lg font-bold text-card-foreground mb-4">Ny riskrapport</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">Titel</label>
          <Input
            placeholder="Kort beskrivning av risken..."
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">Beskrivning</label>
          <Textarea
            placeholder="Beskriv vad som inträffade eller vilken risk som finns..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground mt-1">
            AI-modellen bedömer risknivån utifrån din beskrivning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">
              <MapPin className="inline h-3.5 w-3.5 mr-1" />
              Plats
            </label>
            <Input
              placeholder="T.ex. Lager B - Gång 3"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1 block">Kategori</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">Ditt namn</label>
          <Input
            placeholder="Förnamn Efternamn"
            value={form.reportedBy}
            onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))}
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="text-sm font-medium text-card-foreground mb-1 block">Bifoga bild (valfritt)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors w-full justify-center"
          >
            <Camera className="h-4 w-4" />
            {imagePreview ? "Byt bild" : "Ladda upp bild"}
          </button>
          {imagePreview && (
            <div className="mt-2 rounded-md overflow-hidden border border-border">
              <img src={imagePreview} alt="Förhandsvisning" className="w-full h-32 object-cover" />
            </div>
          )}
        </div>

        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Send className="h-4 w-4 mr-2" />
          Skicka rapport
        </Button>
      </div>
    </form>
  );
}

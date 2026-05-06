import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useProjectLocations } from "@/hooks/useProjectLocations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Trash2, Plus, DoorOpen, Building2, Flag, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPES = [
  { value: "gate", labelSv: "Port / Infart", labelEn: "Gate / Entrance", icon: DoorOpen },
  { value: "office", labelSv: "Platskontor", labelEn: "Site office", icon: Building2 },
  { value: "assembly", labelSv: "Återsamlingsplats", labelEn: "Assembly point", icon: Flag },
  { value: "first_aid", labelSv: "Första hjälpen", labelEn: "First aid", icon: ShieldCheck },
  { value: "other", labelSv: "Övrigt", labelEn: "Other", icon: MapPin },
];

export default function ProjectLocationsManager({ open, onClose }: Props) {
  const { lang } = useLanguage();
  const { user, activeProjectId, viewAs } = useAuth();
  const isAdmin = viewAs === "admin";
  const { locations, addLocation, removeLocation } = useProjectLocations(activeProjectId);
  const sv = lang === "sv";

  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("gate");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!user || !activeProjectId || !label.trim() || !address.trim()) return;
    setSaving(true);
    const ok = await addLocation({
      project_id: activeProjectId,
      label: label.trim(),
      address: address.trim(),
      location_type: type,
      notes: notes.trim() || null,
      created_by: user.id,
    });
    if (ok) { setLabel(""); setAddress(""); setNotes(""); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {sv ? "Adresser & viktiga platser" : "Addresses & key locations"}
          </DialogTitle>
        </DialogHeader>

        {!activeProjectId ? (
          <p className="text-sm text-muted-foreground">{sv ? "Välj ett projekt först." : "Select a project first."}</p>
        ) : (
          <div className="space-y-4">
            {isAdmin && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">{sv ? "Lägg till plats" : "Add location"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder={sv ? "Namn (t.ex. Huvudport)" : "Name (e.g. Main gate)"}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                  <select
                    className="text-sm border border-input rounded-md px-2 bg-background"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{sv ? t.labelSv : t.labelEn}</option>
                    ))}
                  </select>
                </div>
                <Input
                  placeholder={sv ? "Adress (gata, nummer, ort)" : "Address (street, number, city)"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <Textarea
                  placeholder={sv ? "Beskrivning / instruktion (valfritt)" : "Description / instruction (optional)"}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  onClick={handleAdd}
                  disabled={saving || !label.trim() || !address.trim()}
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />{sv ? "Lägg till" : "Add"}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {locations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {sv ? "Inga platser tillagda än." : "No locations added yet."}
                </p>
              )}
              {locations.map((loc) => {
                const typeMeta = TYPES.find((t) => t.value === loc.location_type) ?? TYPES[TYPES.length - 1];
                const Icon = typeMeta.icon;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`;
                return (
                  <div key={loc.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-card-foreground truncate">{loc.label}</p>
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {sv ? typeMeta.labelSv : typeMeta.labelEn}
                          </span>
                        </div>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline break-words"
                        >
                          {loc.address}
                        </a>
                        {loc.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{loc.notes}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => removeLocation(loc.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title={sv ? "Ta bort" : "Delete"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {sv
                ? "Tips: Vid nödläge – uppge närmaste port-adress till SOS 112 så ambulans/brandkår hittar rätt."
                : "Tip: In an emergency – give the nearest gate address to 112 so emergency services find the right entrance."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

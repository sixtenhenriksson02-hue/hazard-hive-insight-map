import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { QrCode, Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { inviteFromQr, projectInvitePath } from "@/lib/projectInvite";

export default function ProjectQrEntry() {
  const { lang } = useLanguage();
  const L = (sv: string, en: string) => lang === "sv" ? sv : en;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const accept = useRef((value: string) => {});
  accept.current = (value) => {
    const invite = inviteFromQr(value, window.location.origin);
    if (!invite) {
      setError(L("Det är inte en projekt-QR-kod för den här appen.", "This is not a project QR code for this app."));
      return;
    }
    setCamera(false);
    setOpen(false);
    navigate(projectInvitePath(invite));
  };

  useEffect(() => {
    if (!open || !camera || !video.current) return;
    let cancelled = false;
    let controls: IScannerControls | undefined;
    const reader = new BrowserQRCodeReader();
    void reader.decodeFromVideoDevice(undefined, video.current, (result, _error, scanner) => {
      if (cancelled || !result) return;
      scanner.stop();
      setCamera(false);
      accept.current(result.getText());
    }).then(value => {
      controls = value;
      if (cancelled) value.stop();
    }).catch(() => {
      if (cancelled) return;
      setCamera(false);
      setError(lang === "sv" ? "Kameran kunde inte öppnas. Tillåt kameraåtkomst eller välj en bild av QR-koden." : "Could not open the camera. Allow camera access or choose a QR image.");
    });
    return () => { cancelled = true; controls?.stop(); };
  }, [open, camera, lang]);

  return <>
    <Button className="w-full h-14 gap-3" onClick={() => { setError(""); setOpen(true); }}><QrCode />{L("Öppna projekt med QR", "Open project with QR")}</Button>
    <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) { setCamera(false); generation.current += 1; setReading(false); } }}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] rounded-lg">
        <DialogTitle>{L("Projektets QR-kod", "Project QR code")}</DialogTitle>
        <DialogDescription>{L("Sparad inloggning används automatiskt. Första gången behöver du logga in med mejl eller Google.", "Your saved sign-in is used automatically. The first time, sign in with email or Google.")}</DialogDescription>
        {camera && <video ref={video} autoPlay muted playsInline aria-label={L("QR-kamera", "QR camera")} className="w-full aspect-square object-cover rounded-md bg-muted" />}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button disabled={camera || reading} onClick={() => { setError(""); setCamera(true); }}><Camera />{L("Skanna QR-kod", "Scan QR code")}</Button>
        <Button variant="outline" disabled={reading} onClick={() => file.current?.click()}><ImagePlus />{reading ? L("Läser…", "Reading…") : L("Välj bild av QR-kod", "Choose QR image")}</Button>
        <input ref={file} type="file" accept="image/*" className="sr-only" aria-label={L("Bild av QR-kod", "QR image")} onChange={async event => {
          const image = event.target.files?.[0];
          event.target.value = "";
          if (!image) return;
          setCamera(false);
          setReading(true);
          setError("");
          const current = generation.current;
          const url = URL.createObjectURL(image);
          try {
            const result = await new BrowserQRCodeReader().decodeFromImageUrl(url);
            if (current === generation.current) accept.current(result.getText());
          } catch {
            if (current === generation.current) setError(L("Ingen läsbar QR-kod hittades i bilden. Välj en tydligare bild.", "No readable QR code found. Choose a clearer image."));
          } finally { URL.revokeObjectURL(url); if (current === generation.current) setReading(false); }
        }} />
      </DialogContent>
    </Dialog>
  </>;
}
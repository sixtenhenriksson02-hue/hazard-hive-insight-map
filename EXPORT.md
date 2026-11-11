# RiskRadar – använd på andra plattformar

## Rekommenderat: samma projekt på flera webbplatser

ZIP-filen innehåller webbplatsens källkod, bilder som ligger i koden, tester,
databasändringar och koden för AI-funktionerna. `.env.production` i den levererade
ZIP-filen innehåller endast den offentliga anslutningen till befintlig Lovable
Cloud. Inga privata nycklar, lösenord eller inloggningssessioner ingår.

Behåll denna anslutning när webbplatsen läggs upp på en annan plattform. Då
använder båda webbplatserna **samma aktuella projekt, rapporter, konton, roller,
ritningar och uppladdningar**. Uppgifterna kopieras inte till ZIP-filen och
synkroniseras inte mellan två databaser: båda webbplatserna läser samma databas.
Ändringar och borttagningar gäller därför på båda webbplatserna.

### Lägg upp webbplatsen

1. Packa upp ZIP-filen och importera mappen i en plattform som kan bygga Vite/React.
2. Installera paket med `npm ci`.
3. Använd byggkommandot `npm run build` och publiceringsmappen `dist`.
4. Lägg till en omskrivning så att alla sidlänkar går till `/index.html`.
   För Netlify ingår `public/_redirects`; för Vercel ingår `vercel.json`.
5. Plattformar som inte läser `.env.production` behöver dess offentliga värden
   angivna som byggmiljövariabler. Behandla aldrig dessa som administratörsnycklar.
6. Den nya webbplatsens exakta adress måste tillåtas i Lovable Clouds
   inloggningsinställningar. Kontrollera mejllänk, lösenordsåterställning och
   Google-inloggning från den nya adressen innan webbplatsen tas i bruk.

Inloggning sparas separat för varje webbplatsadress. En sparad inloggning på en
adress innebär inte automatiskt att besökaren är inloggad på en annan.
Projektets QR-koder använder adressen där de skapas; skapa nya koder på den nya
webbplatsen om de ska öppna just den adressen. Befintliga QR-koder ändras inte.

AI-funktionerna körs fortsatt i befintlig Lovable Cloud och använder dess befintliga
inställningar. Det räcker inte att kopiera deras källkod för att driftsätta dem
hos en annan leverantör. Google-inloggning och AI på en ny plattform är inte
verifierade förrän den nya webbplatsen finns och har testats.

## Om även Lovable Cloud ska ersättas

Källkoden är inte en fullständig säkerhetskopia av projektdata. För en separat
databas med befintliga konton och projekt:

1. Öppna **More → Database → Manage → Settings → Export data** i Lovable.
2. I Database-kortet, välj **Export → Start export** och hämta exporten via mejlet
   eller **More → Storage**. Exporten innehåller databasens struktur, data och
   användarkonton med lösenordshashar. Förvara den privat.
3. Ladda ned uppladdade bilder, ritningar och dokument separat från
   **More → Storage**. Dessa ingår inte i databasexporten.
4. Återställ databasen och filerna hos den nya leverantören och konfigurera
   inloggning, filbehörigheter, AI-tjänst och hemligheter där. Behåll säkerheten
   för roller och projektåtkomst. Uppdatera webbplatsens anslutning först därefter.

Databasexporten inkluderar inte lagrade filer, AI-funktionernas kod, hemligheter
eller inställningar för inloggningsleverantörer. Koden för funktionerna ingår
i denna ZIP. Två separata databaser delar inte ändringar automatiskt.
# Projektinstruktioner för Hemstyrning

Följ även riktlinjerna i `In/hemkontroll_3d_komplett/AGENTS.md`.

Läs `docs/PROJECT_MEMORY.md` i början av varje ny session. Uppdatera dokumentet när arkitektur, körsätt, verifierad Home Assistant-information eller nästa steg förändras.

## Lokal simulator

- Använd alltid en lokal utvecklingsmiljö (`localhost`) för appen och den simulerade Home Assistant-backenden.
- Starta Home Assistant-simulatorn vid utveckling och testning när den inte redan körs.
- Efter varje ändring ska `npm run dev` användas eller den redan körande gemensamma utvecklingsmiljön behållas, så både dashboard och simulator är tillgängliga.
- Utöka simulatorns entiteter, tjänster och events när frontend får funktioner som kräver dem; lägg samtidigt till relevanta tester.
- Verifiera dashboarden på `http://localhost:5173` och simulatorn på `http://localhost:8123/health` inför överlämning.
- Standardadress är `http://127.0.0.1:8123` (`localhost:8123`).
- Kontrollera `GET /health` efter start innan simulatorn betraktas som tillgänglig.
- Anslut aldrig simulatorn till verkliga enheter och lägg aldrig verkliga Home Assistant-token i repot.
- Bygg relevanta enhets-, integrations- och regressionstester löpande med funktionaliteten.

## Permanenta regler för utvecklingsuppdrag
- Arbeta i befintlig Windows-miljö med PowerShell, Node.js/npm och projektets ordinarie skript.
- Avsluta koduppgifter med git status, kontroll av att hemligheter och personlig konfiguration inte inkluderas, samt relevanta tester. Committa endast egna ändringar och pusha aktuell arbetsgren till GitHub. Använd aldrig force-push. Bekräfta pushens resultat och rapportera commit och gren; redovisa eventuella fel.
- Starta eller behåll `npm run dev` och lämna den igång. Kontrollera att localhost-adresserna faktiskt svarar. Redovisa verklig port eller varför start misslyckades och hur appen startas.
- Slutrapporten ska kort beskriva ändringar, tester och resultat, commit/push och fungerande adresser för Hemstyrning, /control och /dev/screens.

# Kontrollpanel efter surfplattereferens

Kontrollpanelen har mjukt grå bakgrund (#33343a), en sammanhängande högeryta (#393b43), kompakt vertikal lamplista, små scenkort och en separat horisontell lamprad. Båda lampraderna använder samma register, säkra kommandon och bekräftade status. Den stora högerytans rubrik är Hemmet eftersom den visar hela installationen; inga påhittade rumsplaceringar görs.

## Varför verkliga lampor inte kan styras

När backend rapporterar skrivskyddat läge blockerar controlReason knapparna innan något kommando skickas. Backend kontrollerar också behörigheten. Verklig styrning får aktiveras endast efter uttryckligt godkännande.

Nyupptäckta lampor måste också sparas genom Spara lampans koppling. Detta sparar den befintliga scenkonfigurationen med placementConfirmed false; fysisk 3D-position krävs inte. Därefter gäller fortfarande serverns styrbehörighet.

Verklig styrning har INTE aktiverats. HA_ALLOW_CONTROL=false kvarstår. Den befintliga globala inställningen HA_ALLOW_CONTROL=true skulle öppna även övriga tillåtna funktioner och ska därför inte användas som en belysningsspecifik aktivering. Separat belysningsbehörighet är ännu inte implementerad; den behöver införas innan enbart lampstyrning kan godkännas. Inga hemligheter eller Home Assistant-inställningar ändrades.

## Verifiering

Simulatorprov omfattar registrering utan 3D-position, brytare, dimmer, extern uppdatering och fokusbevarande. Ett extra prov kontrollerar högerradens tvåvägsväxling och dimmer samt synk till vänsterlistan. Visuell Chromium-granskning vid 1920x1080, 1280x800, 1024x768 och 390x844. Ingen horisontell sidöverströmning.

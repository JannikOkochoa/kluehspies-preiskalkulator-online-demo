# Klühspies Klassenfahrt-Preiskalkulator · öffentliche Demo

Live-Demo: https://jannikokochoa.github.io/kluehspies-preiskalkulator-online-demo/

Dies ist eine eigenständige, rein lesende Konzept-Demo, kein offizieller Klühspies-Buchungs- oder Endpreiskalkulator und keine Integration in TYPO3.

## Was verifiziert wurde (21.11.2026)

- 237 offiziell veröffentlichte Reisevarianten aus 135 einzigartigen Klühspies-Quellseiten; 84 Städte-, 93 Aktiv- und 60 Ski-Pakete.
- Für jede Reise: öffentlich ausgewiesener Ab-Preis, Original-Link und Prüfdatum. Letzter vollständiger Quellseitenabgleich 21.11.2026.
- Programmbausteine stehen in 89 der 237 Angebote zur Verfügung. Bei 148 Angeboten liegen keine öffentlich abrufbaren Einzelbausteine vor. Gleichnamige Preisvarianten werden getrennt und nicht ohne Prüfung summiert.
- Bedienung: Kategorie, Reiseziel, Reisevariante, Datum, Gruppe, Abfahrts-PLZ, Programme, Unterkunft, Anreise, Originalangebot, PDF-Druck, Kopierfunktion, Zurücksetzen.
- Funktionstest: alle 237 Angebote über die Benutzeroberfläche aufrufbar, alle Kategorie- und Angebotswechsel ohne JavaScript-Fehler. Ansichten für Desktop und Mobil getestet.
- Kein Schreibzugang, keine Tarifverwaltung und keine privaten Konditionen im veröffentlichten Paket.

## Was nicht vollständig ist

- Keine verbindliche gruppen-, postleitzahlen-, transport-, unterkunfts- oder tagesgenaue Klühspies-Kalkulation, da die freigegebenen Vertrags- und Staffelpreise fehlen.
- Keine Live-Verfügbarkeit, Hotelkontingente, verbindliche Zusatzprogramm-Preise oder Buchung/Anfrageübernahme.
- Aktuell nur das veröffentlichte Angebot für das Reisejahr 2027 als Preisgrundlage; Gültigkeit einzelner Angebote nach Reisezeitraum teils unbekannt.
- Die Preisdaten werden in einem automatischen GitHub-Actions-Job alle zwei Stunden, in Chargen gegen offizielle Quellen geprüft. Der Button lädt lediglich die zuletzt veröffentlichte Preisliste neu. Das ist keine Live-Buchungsschnittstelle.
- Für eine produktive Integration in Klühspies-TYPO3 sind separate Freigabe, Designsystem-Abgleich, TYPO3-Einbindung, belastbare Tarif-/Buchungs-API, Audit von Barrierefreiheit/Datenschutz (insbesondere extern geladene Fonts und Bilder) sowie fachliche Tests erforderlich.

## Verzeichnis

- docs/: öffentlich ausgelieferte, statische Demo
- docs/data/public-offers.json: nur öffentliche Pakete und Quellen
- scripts/refresh.mjs: konservativer Abgleich offizieller Quellen; behält alte Werte, wenn eine Quelle nicht verifiziert werden kann
- .github/workflows/refresh.yml: geplante Abgleichläufe

Hinweis: Die lokale macOS-Anwendung des ursprünglichen Projekts wird durch dieses Repository nicht geändert.

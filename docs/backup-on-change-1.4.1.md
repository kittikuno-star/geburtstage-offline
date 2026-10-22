# Testversion 1.4.1 – Sicherung nur nach Datenänderungen

Status: Vorbereitung, **nicht implementiert oder aktiviert**. Produktionsversion 1.4.0 bleibt unverändert.

## Anforderungen
- Nur auf dem Mac mit Rolle `mac`; iPhone bleibt Lesekopie.
- Auslöser ausschließlich nach erfolgreichem, rückgelesenem `OfflineStore.commit`, wenn sich der Inhalt von `people` gegenüber dem vorherigen Stand tatsächlich geändert hat. Reine Ansicht, Suche, Rollenwechsel und Metadatenänderungen erzeugen keine neue Sicherung.
- Änderungen innerhalb von 30 Sekunden zusammenfassen; nach dem letzten Schreibvorgang sichern. Beim nächsten App-Start ausstehende Änderungen anhand der gespeicherten Revision bzw. des geprüften Datenhashes erkennen.
- Vollständiges `OfflineCore.pack(state)` inklusive Papierkorb, SHA-256 prüfen, niemals importieren oder den aktuellen Datenbestand überschreiben.
- Export über ausdrücklich vom Benutzer gewählte und autorisierte Verzeichnisse. Browser-Dateisystemrechte können nach Neustart erneute Zustimmung verlangen. Ohne Berechtigung **keine** Erfolgsmeldung und **keine** Behauptung einer Sicherung.
- Zwei Ziele: lokaler Ordner und iCloud-Drive-Ordner. Erfolg pro Ziel getrennt nach Schreib- und Leserückprüfung protokollieren. Fehlschläge sichtbar anzeigen und später erneut versuchen; nicht unbemerkt verwerfen.
- Versionierte, unveränderliche Dateinamen mit Zeitstempel, Revision und Prüfsumme. Keine Datei überschreiben.
- Bis zu 30 bestätigte Sicherungsstände je Ziel aufbewahren; automatische Löschung nur nach erfolgreichem Schreiben und Verifizieren des neuen Standes, und erst nach ausdrücklicher Freigabe.
- Keine personenbezogenen Daten in GitHub, Logs, Issues oder Testdateien.
- Offline-Betrieb, keine Netzwerksynchronisation.

## Vor Implementierung prüfen
1. Laufzeitumgebung der installierten Mac-App (Browser/PWA/Electron) und Unterstützung von `showDirectoryPicker` und `FileSystemDirectoryHandle`.
2. Wo lokale und iCloud-Drive-Ordner auf diesem Mac tatsächlich liegen; Browserrechte und Persistenz.
3. Bestehende `downloadBlob`-Funktion und verfügbare Tests.
4. Test mit synthetischen Personen in isoliertem IndexedDB-Namensraum, nicht mit realen Datensätzen.

## Abnahmetests
- Öffnen, Suchen und Anzeigen: 0 Sicherungen.
- Person ändern, mehrere Änderungen in 30 s: genau 1 geprüfte Sicherung pro Ziel.
- Person in Papierkorb und zurück: jeweils vollständige Sicherung.
- Fenster vor Ablauf schließen: nach Neustart nachholen.
- Zielordner nicht verfügbar oder Berechtigung widerrufen: klarer Fehler, erneuter Versuch; kein Datenverlust.
- iCloud-Synchronisation ausstehend: nur lokal geschrieben melden, nicht Cloud-Upload bestätigen.
- Sicherungsdatei unabhängig mit `OfflineCore.readFile` validieren; Personenzahl und Papierkorb prüfen.

# SnapVocab – umgesetzte Audit-Korrekturen

Stand: 10.11.2026. Bezug: REVIEW.md im selben Verzeichnis.

## Umsetzung

| Auditpunkt | Änderung |
|---|---|
| Springende Lernwarteschlangen | Queue und Quizoptionen werden einmal je Sitzung aufgebaut; Fisher-Yates statt zufälligem Sortieren. Bewertungen lesen aktuelle FSRS-Werte per ID. |
| Verzögerte Ergebnisse nach Abbruch | Gemeinsamer Übergangstimer mit Cleanup; synchroner Bewertungsschutz. Falsche Schreibantworten bleiben bis „Weiter“ sichtbar. |
| Freies Üben | Explizite Wahl zwischen fälligen Karten und freiem Üben; Rundenumfang 10/20/alle. Freies Üben verändert weder FSRS noch die Kartenstatistik. |
| Fehlerwiederholung | Neue Sitzung ausschließlich mit den Fehler-IDs; Quiz verwendet das volle Deck als Distraktorenpool. |
| Schwer-Statistik | „Schwer“ zählt als noch nicht sicher gewusst und wird in der Fehlerwiederholung berücksichtigt. |
| Smart Write | NFC, Groß-/Kleinschreibung und Whitespace normalisiert; Klammernotizen und Schrägstrich-Alternativen berücksichtigt; englisches „to“ sprachabhängig optional. Kurze falsche Antworten werden nicht pauschal toleriert. |
| Hilfen und TTS | Tipps reduzieren XP und führen höchstens zu FSRS Hard; vollständig verratene Antworten geben keine XP. Audio am sichtbaren Fremdwort, kein Vorsagen der gesuchten Antwort. Stimmen werden bei Bedarf nachgeladen, ausstehende Sprachausgabe bei Navigation/Tabwechsel beendet. |
| Kleine Quizdecks | Vier unterschiedliche Antworten erforderlich; keine auswählbaren Platzhalter und keine identischen Distraktoren. |
| Scanner bleibt hängen | Ladezustand wird auch bei Fehler/Abbruch beendet; synchroner Request-Lock, AbortController, 45-Sekunden-API-Gesamtfrist, höchstens ein Wiederholungsversuch bei 503. Quota wird unmittelbar erklärt. |
| Bildkomprimierung | Dateigröße geprüft; Canvas-Fehler verwerfen die Promise; Blob-URLs werden zuverlässig freigegeben. Proportionales Hochformat-Scaling, weißer JPEG-Hintergrund und verständlicher HEIC-Hinweis. |
| Scanner-Antwortschema | Laufzeitvalidierung und Trim; optionale Nullfelder normalisiert. SDK-Fehlermeldungen mit möglichen Requestdetails werden nicht ausgegeben. |
| Scanner-Sprachen | Auswahl Englisch/Französisch/Spanisch/Italienisch/Portugiesisch für Prompt und neue Decks. |
| Staging-Datenverlust | Persistierter zentraler Entwurf; stabile Zeilen-IDs; Ersetzungs-/Navigationswarnung. Neues Zieldeck samt Karten wird in einer Store-Aktion angelegt. Leere Namen und ungültige/unvollständige Zeilen verhindern das Speichern. |
| Storage/Backup | Vollständige Laufzeitprüfung von Version, Decks, Karten, eindeutigen IDs, FSRS-Zahlen/Datumswerten und Fortschritt. Ungültige Imports verändern nichts; beschädigte lokale Originaldaten werden nicht durch leere Defaults überschrieben. Fehlerbanner und Rohdatenexport für Wiederherstellung. Backups exportieren den aktuellen Speicherstand und keine API-Schlüssel. |
| Lokale Tagesgrenzen | Lokaler Kalendertag statt UTC; gestern per Kalenderarithmetik. Tagesziel/Streak/Fälligkeiten werden bei Zeitablauf, Fokus und Rückkehr aktualisiert. |
| Word Drop | Reiner Reducer; genau eine Entscheidung pro Wort-ID/Runde. Bereinigter Deadline-Timer statt Animationsabschluss; Pause/Restzeit beim Verbergen. Abschluss nur einmal. |
| Speed Match | Reiner Reducer sperrt die gesamte Fehlpaarauflösung; Timeout-Cleanup; interner Neustart statt Seitenreload. |
| Mobile Layouts | Wortumbruch auch für ungetrennte lange Wörter; Flashcard-Höhe wächst mit dem Inhalt. Mindestens 44-px-Buttons, vorhandener 16-px-Formularschutz erhalten. |
| iOS/Keyboard/Modals | WebKit-Backfaces und kombinierte 3D-Transforms; VisualViewport-Höhe/Offset, scrollbare Dialoge, höhere Modalebene und Tastatur-Fokusführung. |
| Kontraste und Bedienbarkeit | Helle BottomNav und dunklere Light-Mode-Feedbackfarben; Modalrollen, Icon-Beschriftungen, Fokus-Rückgabe, expliziter tastaturbedienbarer Flip-Button. |
| PWA | Echte 192/512-PNGs, maskierbares Icon und Apple-Touch-Icon; deutsche Sprache, Titel, Theme-Meta und Safe-Area-Metadaten. Bestehende Service-Worker-Registrierung erhalten. |
| Schlüssel im Build | Literal-Fallback und CI-Key-Einbettung entfernt. Einstellungen laden keinen VITE-Umgebungsschlüssel mehr. Der bekannte alte gemeinsame Schlüssel wird anhand eines Fingerprints aus gespeicherten Einstellungen entfernt; persönliche andere Schlüssel bleiben erhalten. |
| Build/Hygiene | Node >=24 und native Vite-Konfigurationsladeart; Provider/Context/Hook für Fast Refresh getrennt. Seiten werden nach Bedarf geladen; initialer Hauptchunk ca. 274 kB statt über 500 kB. |

## Ausgeführte Prüfungen

- `npm test`: 10 Regressionstests erfolgreich (Antwortvarianten, Unicode/Whitespace, Quiz-Deduplizierung, FSRS-Export/Import, ungültige Backups, Schutz beschädigter Originaldaten, Quota-Fehler, lokale Tagesgrenzen, Spiel-Race-Conditions, Scanner-JSON, Canvas-Ausnahmen und fehlender Key).
- `npm run lint`: keine Warnungen oder Fehler.
- `npm run build`: TypeScript und Produktionsbuild erfolgreich; keine Chunkgrößenwarnung. PWA erzeugt 19 Precache-Einträge.
- `git diff --check`: erfolgreich unter der vorhandenen Windows-Git-Konfiguration.
- `npx cap sync android`: erfolgreich; aktuelle Webdateien in das Android-Projekt kopiert.
- Prüfung erzeugter Web- und Android-Dateien gegen die zuvor verwendeten Schlüsselwerte: keine Treffer.

## Browserbelege

- Flashcards: nach Bewertung `1 / 14` → `2 / 14`; Gesamtqueue bleibt stabil.
- Quiz: Frage und alle vier Optionen bleiben während des Bewertungsfeedbacks unverändert.
- Ein-Karten-Deck: Quiz ist deaktiviert und erklärt die Mindestanzahl.
- Write: richtige Antwort zeigt Feedback am selben Wort; falsche Antwort bleibt mit „Weiter“ sichtbar; Fehlerwiederholung startet neu.
- Scanner: neuer Text-Batch zeigt die neuen Zeilen; Speichern eines neuen Decks ohne Namen ist deaktiviert. Gültiges neues Deck wird angelegt.
- Fotoauswahl ohne Key: sichtbare Fehlermeldung, Upload bleibt bedienbar; kein hängender Spinner. Kein Aufruf von Gemini dabei.
- Langes Testwort bei 390 px: `scrollWidth === clientWidth === 390`. Screenshot: mobile-flashcard-fixed.jpg.
- Settings bei 390 × 450 px: Dialogunterkante innerhalb des Sichtbereichs; Shift+Tab vom ersten Element führt zum letzten Element „Fertig“.
- Word Drop: drei direkt nacheinander richtige Antworten ergeben 30 Punkte und weiterhin drei Leben.
- Speed Match: dritter Tile-Button während Fehlpaarauflösung deaktiviert; alle sechs Paare bis zum Ergebnis gespielt; „Nochmal“ startet unmittelbar wieder Speed Match bei 0/6 und 00:00.
- Produktions-PWA: Webserver gestoppt und Nichterreichbarkeit separat geprüft; Neuladen und Öffnen eines zuvor nicht verwendeten Lernmodus funktionieren aus dem Cache.

## Grenzen und externe Schritte

- Ein echter Gemini-Scan mit einem persönlichen Key und reale Anbieter-Quota wurden nicht ausgelöst. Die verwendeten Modelle bleiben die vorhandene Fallbackliste.
- Ein gegebenenfalls noch gültiger, früher veröffentlichter gemeinsamer Schlüssel muss beim Anbieter gesperrt/rotiert werden. Das Entfernen aus diesem Repository und den neuen Artefakten widerruft den Anbieterzugang nicht und entfernt keine Git-Historie oder früher verteilten APKs.
- Echte iOS-/Android-Geräte, native Bildschirmtastatur, HEIC/EXIF-Aufnahmen und Installation wurden nicht physisch getestet. Android-Webdateien wurden synchronisiert; eine neue APK wurde nicht gebaut.
- Der Scanner verarbeitet einzelne Fotos. Mehrere Dateien in einem Drop werden mit einem Hinweis abgelehnt; es gibt keinen Sammelimport. Ein weiterer Scan kann einen vorhandenen Entwurf nach Rückfrage ersetzen.
- Lokale Browserprüfungen haben Lernfortschritt und QA-Decks auf dem Dev-Origin erzeugt; auf dem separaten Preview-Origin wurde das Demo-Deck verwendet. Keine produktiven Daten oder externen Systeme wurden verändert.

# 1. 🚨 Kritische Bugs & Crashes (Sofort beheben)

Prüfstand: 10.11.2026, lokaler Quellcode, TypeScript, Oxlint, Produktionsbuild und Browser bei 390 × 844 px; zusätzlich kleiner Sichtbereich 390 × 450 px. Keine Anwendungscodeänderungen. Browserprüfungen haben auf dem neuen Origin 127.0.0.1:5174 Lernfortschritt und ein Deck „QA – 1 Karte“ erzeugt. Der Dev-Server läuft weiter:

```powershell
npm run dev -- --host 127.0.0.1 --configLoader native
```

Die normale Konfigurationsladeart scheiterte hier beim Bundeln nativer Abhängigkeiten und an spawn EPERM. Das ist als lokales Startproblem belegt, nicht als genereller Produktionsfehler. Native Config Loading und der Produktionsbuild funktionieren.

## P1: Laufende Lernwarteschlangen verändern sich bei jeder Bewertung

Fundstellen: `src/components/learn/FlashcardSession.tsx:19–20`, `WriteMode.tsx:21`, `QuizMode.tsx:26,36–44`.

`updateCard()` ersetzt `deck.cards`. Deshalb werden die fällige Queue beziehungsweise die zufällige Reihenfolge und die Quizoptionen neu berechnet. Der Index gehört anschließend zu einer anderen Queue. Im Browser sprang die Karteikarte nach „Gewusst“ von `1 / 15` auf `2 / 14`, von „adventure“ auf „departure“; „journey“ wurde übersprungen. Im Schreibmodus wurde während „Perfekt!“ bereits „Expedition“ statt „Abenteuer“ angezeigt. Das Quiz mischt auch die Antworten während des Feedbacks neu. Das kann falsche Antwortmarkierungen, Wiederholungen, Auslassungen und vorzeitige Sitzungsenden verursachen.

Reparatur: Queue und Antwortoptionen einmal pro Sitzungsstart erzeugen. Beispiel Flashcards:

```tsx
const [queue] = useState(() => {
  const due = deck.cards.filter(c => isDue(c.fsrs));
  return due.length ? [...due] : deck.cards.slice(0, 10);
});
```

Für Write/Quiz dieselbe Initialisierung mit einem Fisher-Yates-Shuffle verwenden. Kein zufälliger Sort-Comparator. Im Quiz Fragen einschließlich ihrer Optionen als Sitzungssnapshot speichern; die Optionen dürfen nicht mehr von dem laufend aktualisierten `deck.cards` abhängen. Beim Bewerten die aktuelle FSRS-Karte per ID aus dem Store lesen, damit Wiederholungsrunden keine alten FSRS-Werte zurückschreiben. Neue Sitzung, Deckwechsel und Fehlerwiederholung erhalten einen neuen Session-Key.

## P1: Fehler im Scanner lassen den Ladezustand hängen

Fundstellen: `src/components/scanner/ImageUpload.tsx:22–48`, `Scanner.tsx:20–23,78`.

Nur ein erfolgreicher Scan mit mindestens einem Treffer ruft `onScanComplete` auf und beendet `isScanning`. Fehlender Key, API-Fehler, leeres Ergebnis und Komprimierungsfehler setzen den Zustand nicht zurück. Ein Spinner ersetzt dauerhaft die Uploadfläche. Gleichzeitige Drops/Klicks sind ebenfalls nicht gesperrt.

Reparatur: Ein eigenes `onScanEnd`-Prop einführen und den Zustand ausschließlich in `finally` beenden:

```tsx
try {
  // Key prüfen, komprimieren, scannen und Ergebnis behandeln.
} catch (err: unknown) {
  setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
} finally {
  onScanEnd();
}
```

Im Parent `onScanEnd={() => setIsScanning(false)}` übergeben. Fehlenden Key und Dateigröße vor der Komprimierung prüfen. Ein synchrones Ref verhindert parallele Aufträge; Ergebnisübernahme nur für die aktuelle Request-ID. Abbruchsignal an den SDK-Aufruf weiterreichen und auch Retry-Wartezeiten abbrechbar machen. Der sichtbare Hinweis „max. 10 MB“ wird derzeit nicht validiert.

## P1: Canvas-Ausnahmen lassen die Komprimierung unendlich warten

Fundstelle: `src/services/imageCompressor.ts:4–24`.

`drawImage`/`toDataURL` laufen in einem späteren `onload`-Callback außerhalb eines Try/Catch. Eine Exception dort verwirft die äußere Promise nicht. Gezielte Fehlersimulation bestätigte: Callback wirft, Promise bleibt pending. Bei fehlendem Kontext wird die Blob-URL nicht freigegeben.

Den bestehenden `img.onload`-Handler durch dieses Muster ersetzen:

```ts
img.onload = () => {
  try {
    const sourceWidth = img.naturalWidth;
    const sourceHeight = img.naturalHeight;
    if (!sourceWidth || !sourceHeight) throw new Error('Ungültige Bildgröße');
    const ratio = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * ratio));
    canvas.height = Math.max(1, Math.round(sourceHeight * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/jpeg', quality));
  } catch (error) {
    reject(error);
  } finally {
    URL.revokeObjectURL(img.src);
  }
};
```

Die bestehende proportionale Skalierung funktioniert für Hochformat mathematisch korrekt. Die maximale JPEG-Ausgabegröße begrenzt allerdings nicht den Speicher zum Dekodieren eines riesigen Ursprungsbildes. Echte Smartphone-Aufnahmen einschließlich EXIF-Drehung und HEIC wurden nicht getestet.

## P1: Staging kann Daten verlieren oder alte Daten speichern

Fundstellen: `src/components/scanner/StagingTable.tsx:16,38–58`, `Scanner.tsx:20–27`.

1. `rows` übernimmt `results` ausschließlich bei der ersten Montage. Browserbeleg: zuerst `run - laufen`, dann `cat - Katze` erkannt; sichtbar blieb `run - laufen`.
2. Bei `selectedDeckId === '__new__'` und leerem Namen läuft `onSave('__new__', validRows)`. Kein Deck existiert mit dieser ID, der Reducer fügt nichts ein, der Parent löscht trotzdem die Vorschau. Im Browser bestätigt.
3. Beim Seitenwechsel wird der Scanner ungemountet; ungespeicherte Ergebnisse verschwinden ohne Warnung. Auch der zweite Import hat keine Konfliktbehandlung.

Konkrete Validierung vor dem Speichern:

```ts
if (selectedDeckId === '__new__' && !newDeckName.trim()) return;
if (selectedDeckId !== '__new__' && !decks.some(d => d.id === selectedDeckId)) return;
const validRows = rows
  .map(r => ({ ...r, term: r.term.trim(), translation: r.translation.trim() }))
  .filter(r => r.term && r.translation);
if (!validRows.length) return;
```

Zusätzlich Save-Button mit denselben Regeln deaktivieren und Validierungsfehler sichtbar ausgeben. Neue Ergebnisse explizit als neuen Staging-Batch übernehmen; beispielsweise eine inkrementierende Batch-ID als React-Key verwenden, nachdem ein vorhandener Entwurf gesichert oder seine Ersetzung bestätigt wurde. Nicht bei jedem Render einen neuen Key erzeugen. Entwurf einschließlich Zeilen-IDs und Zieldeck zentral/persistiert halten. Appinterne Navigation mit Dirty-Guard schützen; `beforeunload` allein schützt keine React-Tabwechsel.

## P1: Ungültige Backups können vorhandene Daten ersetzen und Abstürze auslösen

Fundstellen: `src/utils/storage.ts:21–33,93–97`, `src/components/dashboard/ImportExport.tsx:25–30`.

Ein JSON-Cast ist keine Laufzeitvalidierung. Der direkte Test `importAllData('{"progress":{}}')` akzeptiert leere Decks und ungültigen Fortschritt. Ein ungültiges `due` wird ebenfalls als Invalid Date akzeptiert. Ungültige Terme können später beispielsweise `.toLowerCase()` zum Absturz bringen. Beim lokalen Laden verwandelt jeder abgefangene Strukturfehler den gesamten Deckbestand in `[]`; der Speichereffekt überschreibt anschließend den ursprünglichen Inhalt.

Reparatur: JSON zunächst als `unknown` parsen; Version, Arrays, alle Pflichtfelder, eindeutige IDs, Fortschrittszahlen und sämtliche FSRS-Felder samt endlichen Datumswerten prüfen. Erst nach vollständiger Prüfung eine einzige Importaktion dispatchen. Nicht interpretierbare lokale Rohdaten unverändert aufbewahren und einen Wiederherstellungsfehler anzeigen, statt `[]` zurückzugeben und sofort zu speichern. Alle `localStorage`-Lese-/Schreiboperationen einschließlich Initialisierungsmarker gegen SecurityError/QuotaExceededError behandeln; ungespeicherten Zustand sichtbar machen. Erst erfolgreiche Demo-Persistierung markieren.

## P1: Word Drop zählt Animationsereignisse als Spielentscheidungen

Fundstellen: `src/components/games/WordDrop.tsx:55–98,147–155`, `src/main.tsx:7`.

`onAnimationComplete={handleTimeout}` verarbeitet nicht nur das Ende des Falls, sondern auch das Ende der Exit-Animation eines bereits beantworteten Wortes. Damit kann eine richtige Antwort später zusätzlich ein Leben kosten oder eine weitere Karte überspringen. Zudem rufen State-Updater weitere Setter und sogar `onComplete()` auf. Solche Updater müssen rein sein; unter dem aktivierten React StrictMode kann die wiederholte Auswertung die Seiteneffekte vervielfachen.

Reparatur: Eine reine Reducer-Transition für `ANSWER`/`TIMEOUT`, jeweils mit eindeutiger Wort-ID; bereits abgearbeitete IDs ignorieren. Deadline und genau einen Timeout pro aktuellem Wort in einem Effect verwalten und im Cleanup löschen. `onAnimationComplete` darf keine Leben verändern. Spielabschluss einmalig nach committed Game-over-Zustand melden, mit Ref gegen Doppelausführung. `visibilitychange` pausiert Deadline und Fallanimation; beim Fortsetzen Restzeit verwenden. Es gibt hier keine eigenen requestAnimationFrame-/setInterval-Loops, deren Cleanup man nachrüsten müsste.

Hintergrund zur Callback-Semantik: https://motion.dev/docs/react-motion-component ; Exit-Lifecycle: https://motion.dev/docs/react-animate-presence .

## P2: Speed Match akzeptiert weitere Klicks während eines Fehlpaares

Fundstelle: `src/components/games/SpeedMatch.tsx:56–98`.

Nach dem zweiten, falschen Klick bleibt `selected.length === 1`. Ein dritter Klick startet einen weiteren Vergleich samt weiterem Timeout. Alte Timeouts löschen dann eine inzwischen neue Auswahl. Im Browser war ein Match unmittelbar nach einem Fehlpaar während desselben Feedbackfensters möglich.

Reparatur: Beim zweiten Klick synchron ein `resolvingRef.current = true` setzen; während der Auflösung alle Tile-Klicks ignorieren. Beide IDs lokal erfassen, Fehlerzustand nach 600 ms für genau dieses Paar zurücksetzen, dann Auswahl und Ref freigeben. Timeout-Handle im Ref speichern und beim Unmount löschen. Alternativ gesamtes Match-State als reinen Reducer behandeln. Für „Nochmal“ Session-Key/Reset verwenden: `window.location.reload()` führt derzeit zum Dashboard statt zu einer neuen Spielrunde. Speed-Match-Mindestgröße ist im Arcade-Zugang korrekt auf sechs Karten begrenzt; keine Endlosschleife gefunden.

## P2: Abgebrochene Sitzungen melden später trotzdem Abschluss

Fundstellen: `QuizMode.tsx:74`, `WriteMode.tsx:59`, `FlashcardSession.tsx:64`.

Timeouts werden beim Verlassen nicht gelöscht. Browserbeleg: Bei der letzten Quizantwort sofort „Zurück zur Übersicht“ geklickt; anschließend erschien trotzdem die Ergebnisansicht.

Reparatur: Alle Übergangstimeouts über ein Timer-Ref verwalten und beim Unmount löschen:

```tsx
const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => () => {
  if (transitionTimer.current !== null) clearTimeout(transitionTimer.current);
}, []);
```

Im Schreibmodus außerdem `feedback === 'wrong'` nicht aus der alten Closure lesen: `setFeedback(result)` aktualisiert den Wert nicht synchron. `result` an `advance` übergeben und daraus `result === 'wrong' ? 2000 : 1200` bestimmen. Bei falsch beantworteten Fragen besser explizites „Weiter“ anbieten.

## P1: Zugangsdaten stehen als Workflow-Fallback im Repository

Fundstelle: `.github/workflows/build-apk.yml:27`; außerdem `src/utils/storage.ts:55–71`.

Der Workflow enthält einen literal hinterlegten API-Zugangswert als Fallback. Sein aktueller Gültigkeitsstatus wurde nicht durch API-Aufrufe geprüft. Der konkrete Wert wird hier nicht wiedergegeben. Außerdem werden `VITE_GEMINI_API_KEY`-Werte in Clientartefakte eingebettet; sie sind kein serverseitiges Secret.

Reparatur: Literal-Fallback entfernen und bei fehlendem Build-Secret explizit fehlschlagen. Falls der hinterlegte Wert gültig war, beim Anbieter sperren/rotieren. Für eine öffentlich verteilte App einen authentifizierten, quotierten Server-Endpunkt verwenden; alternativ ausschließlich bewusst eingegebene persönliche Nutzerschlüssel ohne mitgelieferten gemeinsamen Key. Den Key-Entwurf im Settings-Dialog beim Öffnen aus dem aktuellen Store laden: momentan können Header- und Sidebar-Dialoge veraltete Werte zurückspeichern.

## P2: PWA-Manifest referenziert nicht vorhandene Icons

Fundstelle: `vite.config.ts:11,23–26`, `public/`.

`public/icons/icon-192.png` und `icon-512.png` fehlen; auch nach dem erfolgreichen Build fehlen sie im dist. Installation/Icon-Darstellung ist damit nicht zuverlässig. Korrektur: echte 192×192- und 512×512-PNGs anlegen, Pfade abgleichen, zusätzlich geeignetes maskierbares Icon und Apple-Touch-Icon bereitstellen. `display: 'standalone'`, `start_url`, Theme- und Hintergrundfarbe sind vorhanden. Das Plugin injiziert die Service-Worker-Registrierung korrekt in die gebaute HTML-Datei; ein fehlender manueller registerSW-Import ist hier kein Bug. Der Build erzeugt sechs Precache-Einträge für die App-Hülle. Ein echter Offline-Neustart und eine Geräteinstallation wurden nicht geprüft. Gemini selbst ist offline nicht verfügbar und braucht einen verständlichen Offline-Zustand.

# 2. 📱 Mobile- & UI/UX-Schwachstellen

- **Lange Wörter brechen Flashcards und Quiz auf:** Im 390-px-Browser mit einem 90 Zeichen langen Wort bestätigt, inklusive horizontaler Seitenscrollbar. `Flashcard.tsx:28–61` hat feste Aspect-Ratio und absolut positionierte Seiten ohne begrenzten Inhaltsbereich; Quiz und Write fehlen Umbruchregeln. Korrektur für Textcontainer: `min-w-0 max-w-full [overflow-wrap:anywhere]`; Antworttext im Quiz in einen eigenen `span className="min-w-0 flex-1 [overflow-wrap:anywhere]"` setzen. Write-Input um `min-w-0 w-full` ergänzen. Flashcard-Flächen mit ausreichender Mindesthöhe und kontrolliertem vertikalem Scrollbereich für vollständige Wörter/Beispiele ausstatten; Antworten nicht lediglich abschneiden. Bei DeckCard den Titel-Flexbereich `min-w-0 flex-1` und die Aktionsgruppe `shrink-0` setzen. Speed-Match-Tiles ebenfalls umbrechen lassen, Mindesthöhe statt zwingender Aspect-Ratio. Lange natürliche Sätze können unabhängig von ungetrennten Wörtern die Flashcard-Höhe überschreiten.
- **WebKit-Flip-Risiko:** `Flashcard.tsx:33,47` und das erzeugte CSS enthalten keine WebKit-Backface-Deklaration. Vorderseite mit `backface-visibility:hidden; -webkit-backface-visibility:hidden; transform:translateZ(0)` versehen, Rückseite mit `transform:rotateY(180deg) translateZ(0)`. Vorhandene Rotation nicht versehentlich durch ein zweites transform überschreiben. Das ist eine Kompatibilitätsmaßnahme; Flackern wurde nicht auf echtem Safari nachgewiesen.
- **Kleine Touchziele:** Staging-Swap/Delete 32 px, Header-Settings 36 px, DeckDetail-Audio 36 px, Write-Audio 40 px, DeckCard-Settings nur ungefähr 28 px. `min-h-11 min-w-11`, bei Icon-Buttons zusätzlich `shrink-0`, verwenden. Richtungsumschalter und weitere kleine Formularaktionen ebenfalls auf 44 px bringen.
- **Tastatur/Dialoghöhe:** App verwendet `min-h-screen`; DeckDetail `90vh`, Settings-Inhalt `80vh` zusätzlich zu Header/Footer. Im kleinen Sichtbereich wurden Dialogteile abgeschnitten. App auf `min-h-dvh`, Dialoghülle auf `flex max-h-[calc(100dvh-2rem)] flex-col`, Inhaltsbereich auf `min-h-0 flex-1 overflow-y-auto`, Header/Footer auf `shrink-0` umstellen. Eingabefokus mit `scrollIntoView({block:'nearest'})` innerhalb des passenden Scrollcontainers sichtbar halten. Bei Bedarf VisualViewport-Höhe verarbeiten; `dvh` allein garantiert auf allen mobilen Tastaturen keinen Resize. Keine echte Bildschirmtastatur getestet.
- **Navigation liegt über Dialogen:** BottomNav und Modals nutzen beide `z-50`; die später gerenderte BottomNav kann den Dialog überlagern. BottomNav auf z-40 und Modals auf z-60 setzen. Modalrolle, `aria-modal`, beschriftete Schließen-/Audio-Buttons, Focus-Trap und Fokus-Rückgabe fehlen. Die Flashcard ist ein klickbares div ohne Tastatursemantik; zugängliche separate Flip-Aktion ergänzen, ohne Buttons ineinander zu verschachteln.
- **Light Mode:** BottomNav bleibt durch `bg-zinc-900/95 border-zinc-800` dunkel. Im Browser sichtbar. `bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800` verwenden, inaktive Texte z. B. `text-zinc-600 dark:text-zinc-400`. Feedback-/Ergebnisfarben `text-emerald-400`, `text-amber-400`, `text-rose-400` mit dunkleren Light-Varianten kombinieren. Weitere schwache Hilfstexte und Hoverfarben prüfen, nicht pauschal jedes `text-white` ersetzen: Weiß auf farbigen Buttons ist beabsichtigt.
- **iOS-Zoom-Schutz ist vorhanden:** Die ungelayerten globalen Regeln `input, textarea, select { font-size:16px }` gewinnen hier gegen Tailwind-Layer. Browsermessung im Scanner/Staging ergab durchgehend 16 px, trotz `text-sm`/`text-xs`. Kein belegter Auto-Zoom-Bug.
- **PWA-Metadaten:** `index.html` steht auf `lang="en"` und Titel `vokabelapp`. Auf `lang="de"`, Titel `SnapVocab`, Theme-Meta und `viewport-fit=cover` für beabsichtigte Safe-Area-Nutzung anpassen. Safe-Bottom-Padding ist bereits vorhanden. Die Standardfarbe des Manifests ist dunkel; dynamische Light/Dark-Theme-Metadaten wären sinnvoll.

Beleg: `mobile-flashcard-overflow.jpg` im selben Verzeichnis.

# 3. 🧠 Didaktik- & Feature-Feinschliff

## Freies Üben und Wiederholen

`FlashcardSession.tsx:20` erlaubt bereits ein Fallback auf die ersten zehn Karten, wenn nichts fällig ist. Der Nutzer wird also nicht vollständig ausgesperrt. Es fehlt aber eine ausdrückliche Wahl zwischen „Fällige Karten lernen“ und „Frei üben“; bei noch fälligen Karten ist kein gezieltes Üben des gesamten Decks möglich. Das Fallback bewertet Karten erneut mit FSRS, obwohl es wie freies Üben wirkt. Einen `practice`-Modus mit expliziter Auswahl und ohne FSRS-Scheduling-Update einführen. Umfang und gemischte Reihenfolge auswählbar machen.

`LearnCenter.tsx:47` löscht bei „Fehler wiederholen“ nur das Ergebnis. Die nächste Session verwendet nicht `incorrectCards`, sondern wieder die normale Deckqueue. Vorher die Fehler-IDs in einem Retry-Queue-State sichern, den gewählten Lernmodus beibehalten und eine neue Session-ID verwenden. Bei „Schwer“ erhöhen sich in Flashcards weder correct noch incorrect; deshalb stimmen die Ergebniszahlen nicht mit total überein. Eine separate Hard-Kategorie oder klar dokumentierte binäre Zuordnung verwenden.

## Smart Write lehnt gültige Teilübersetzungen ab

Direkte Tests von `checkAnswer`:

| Eingabe | Gespeicherte Antwort | Ist-Zustand |
|---|---|---|
| `run` | `to run (ran, run)` | falsch, Distanz 14 |
| `Abreise` | `Abfahrt / Abreise` | falsch, Distanz 10 |
| `  HELLO ` | `hello` | korrekt |
| `a` | `an` | fast richtig und als FSRS Good gewertet |
| `hello   world` | `hello world` | falsch |

`src/utils/levenshtein.ts:25–38` muss normalisierte Antwortvarianten vergleichen. Beispiel für die Vorverarbeitung:

```ts
const normalize = (s: string) => s.normalize('NFC').trim().toLocaleLowerCase()
  .replace(/\s+/g, ' ');

function answerVariants(value: string): string[] {
  const original = normalize(value);
  const withoutNotes = normalize(original.replace(/\([^()]*\)/g, ' '));
  return [...new Set([
    original,
    withoutNotes,
    ...withoutNotes.split(/\s*\/\s*/).map(normalize),
  ])].filter(Boolean);
}
```

Erst exakten Treffer gegen Varianten prüfen, danach minimale Levenshtein-Distanz. Klammerinhalt selbst nicht als alternative Antwort akzeptieren. Entfernen von `to ` ausschließlich für englische Zielantworten und nach ausdrücklicher Produktregel ergänzen; bedeutungstragende Artikel und Akzente nicht pauschal entfernen. Schrägstriche nur nach klarer Definition als Alternativtrenner behandeln. „Fast richtig“ bei sehr kurzen Antworten nicht automatisch als richtig werten. Nach vollständig aufgedeckten Tipps und TTS-Vorsagen nicht denselben FSRS-Good-Status vergeben wie nach selbständigem Abruf. Derzeit lassen sich alle Buchstaben aufdecken und anschließend volle 15 XP erhalten.

## Abfragerichtung und Sprachausgabe

Flashcards drehen Vorder-/Rückseite korrekt; Audio ruft immer `card.term` auf. Die Zuordnung en→en-GB, fr→fr-FR, es→es-ES stimmt. Write und Quiz vertauschen Prompt/Antwort ebenfalls korrekt. Kein belegter Fehler „deutsches Wort mit englischer Stimme“.

In `WriteMode.tsx:117` erscheint Audio allerdings bei DE→Fremdsprache und verrät die noch gesuchte Antwort. Bei Fremdsprache→DE fehlt die Aussprache des sichtbaren Fremdwortes. Bedingung auf `direction === 'term-to-translation'` ändern; Audio der Lösung erst nach Feedback oder als gekennzeichnete Hilfe anbieten. Bei Seitenwechsel laufende Sprachausgabe beenden und asynchron geladene Stimmen berücksichtigen.

## Quiz: Mindestanzahl und doppelte Antworten

`QuizMode.tsx:42` ergänzt fehlende Optionen durch auswählbare `---`. Ein Ein-Karten-Deck zeigt eine echte Antwort plus drei Platzhalter; Browserbeleg vorhanden. Keine Endlosschleife. Antwortstrings verschiedener Karten können identisch sein; `indexOf(correctAnswer)` macht dann nur einen optisch gleichen Button richtig. Nach Abfragerichtung normalisierte, eindeutige Antwortwerte bilden, die richtige Antwort aus den Distraktoren ausschließen und vier unterschiedliche Optionen verlangen. Alternativ klar deklarierte kleinere Auswahl anbieten. Keine künstlichen Platzhalter.

## Tageswechsel und Fortschritt

`src/utils/xp.ts:20–26` verwendet UTC-Datum. In Deutschland zählt die Zeit kurz nach Mitternacht noch zum Vortag. Gestern mit `setDate(getDate()-1)` im lokalen Kalender berechnen; feste 86.400.000 ms sind für lokale Sommerzeitwechsel ungeeignet. Datumsformatierung:

```ts
function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
```

Header zeigt gespeicherten `dailyProgress` auch bei altem `dailyProgressDate`. Dort bei abweichendem Datum null anzeigen; bei Fokus/Rückkehr/Mitternacht Datum aktualisieren. Fälligkeiten ebenfalls bei Zeitablauf/Fokus neu auswerten, nicht nur wenn zufällig ein React-Render stattfindet. FSRS-Fälligkeiten selbst als absolute Zeitpunkte speichern; dort keinen lokalen Datumstruncation-Fix einbauen.

## Scanner-Sprachen und API-Vertrag

`visionScanner.ts:7–8` ergänzt ausschließlich British English/RP-IPA. Das passt nicht zu französischen/spanischen Zieldecks. Zielsprache zum Scan übergeben und Prompt sowie optionale IPA daran ausrichten. Neue Decks im Staging nicht zwingend Englisch anlegen.

Data-URL-Prefix wird korrekt entfernt, JPEG-MIME passt zur Komprimierung. `responseMimeType`/`responseSchema` bestehen die Typprüfung mit dem installierten SDK. Die App verwendet aktuell eine Modell-Fallbackliste statt des im Auftrag genannten einzelnen Modells; allein diese Abweichung beweist keinen Fehler. Keine Vermutung über ungültige Modellnamen als Befund ausgeben. Model-/Key-/Quota-Funktion wurden nicht mit Live-API-Aufrufen geprüft. Google dokumentiert aktuelle Modelle unter https://ai.google.dev/gemini-api/docs/models .

Die Antwort wird nur als `ScanResult[]` gecastet. Vor `.filter` `Array.isArray` und je Eintrag `typeof term/translation === 'string'` mit Trim prüfen; optionale Nullwerte zu undefined normalisieren. Fehlender/ungültiger Key und Quota brauchen verständliche Fehlermeldungen. Die drei Modelle mit je vier Versuchen können allein 51 Sekunden Retry-Wartezeit verursachen, zusätzlich zur Netzwerkzeit. Gesamtfrist/Abbruch und Statusanzeige ergänzen, bei dauerhafter Quotaerschöpfung nicht blind alle Modelle durchprobieren.

## Code-Hygiene und Prüfergebnisse

- `npx tsc -b --pretty false`: erfolgreich.
- `npm run lint`: Exit 0, zehn Warnungen; unter anderem ungenutzte Imports/Parameter, zufällige Renderberechnung und Word-Drop-State-Effect. Der erfolgreiche Exit bedeutet nicht warnungsfrei.
- `npx vite build --configLoader native`: erfolgreich, Service Worker generiert; Warnung für Hauptchunk über 500 kB.
- FSRS-Test: `reviewCard` verändert die übergebene Karte nicht und liefert `due` als Date. Storage rehydriert `due` und `last_review` sowohl beim Laden als auch Import; Problem ist fehlende Validierung, nicht fehlende grundlegende Rehydrierung.
- Keine expliziten any-Typen im Anwendungscode gefunden. Problematisch sind ungeprüfte Type-Assertions für externe JSON-Daten.
- Staging verwendet Arrayindizes als React-Keys mit AnimatePresence; nach Löschen werden Identitäten/Fokus/Animationen neu zugeordnet. Stabile Zeilen-IDs einführen. Die meisten übrigen Listen besitzen Keys.
- Nicht getestet: echte iOS-/Android-Geräte, native Bildschirmtastatur, Kamera/HEIC, live Gemini-Anfrage, installierte PWA und echter Offline-Neustart. Browseremulation allein belegt diese Eigenschaften nicht.

# 4. 📋 Copy-Paste Reparatur-Prompt für meinen Coding-Agenten

```text
Patche SnapVocab gezielt anhand artifacts/audit-20261110/REVIEW.md; bestehende Architektur erhalten und keine unabhängigen Refactorings. Prioritäten:
1) Flashcards/Write/Quiz: stabile Sitzungssnapshots inkl. Quizoptionen, Fisher-Yates, neue Session-ID bei Neustart/Retry, aktuelle FSRS-Werte per Karten-ID lesen. Keine Queue-Neuberechnung durch updateCard. Alle Übergangstimeouts bei Unmount abbrechen; falsche Write-Feedbackdauer aus übergebenem Ergebnis bestimmen.
2) Scanner: isScanning in finally beenden, gleichzeitige Requests sperren, Request-ID/Abbruch/Gesamtfrist, verständliche Fehler für Key/Quota/Offline, 10-MB-Grenze tatsächlich prüfen. Canvas-Callbacks mit try/catch/finally und URL-Cleanup sichern. API-JSON zur Laufzeit validieren; Zielsprache statt festem Englisch verwenden.
3) Staging: neue Batches sichtbar übernehmen, persistierten Entwurf/Dirty-Guard vor Ersetzung und Navigation, stabile Zeilen-IDs, Trim, existierendes Zieldeck bzw. nichtleeren neuen Decknamen validieren. Niemals Vorschau ohne erfolgreiche Speicherung löschen. Neue Decksprache auswählbar machen.
4) Storage/Import: unknown vollständig validieren, gültige FSRS-Dates und Pflichtzahlen prüfen, ungültige Imports atomar ablehnen; beschädigte Rohdaten nicht automatisch mit [] überschreiben. Storage-/Quotafehler sichtbar behandeln. Hardcodierten Workflow-Zugangswert entfernen; keinen gemeinsamen geheimen Key in VITE-Clientbuilds verteilen. Veraltete Settings-Key-Entwürfe beim Öffnen synchronisieren.
5) WordDrop: reiner Reducer, Entscheidungen pro Wort-ID genau einmal, bereinigte Deadline-Timer statt onAnimationComplete; keine Seiteneffekte in State-Updatern; Spielabschluss einmalig, Pause/Resume bei verborgenem Tab. SpeedMatch: synchroner Resolve-Lock, genau ein bereinigter Fehlpaar-Timeout und interner Neustart statt location.reload.
6) Quiz: eindeutige Antworten, keine --- Platzhalter, Mindestanzahl sinnvoll prüfen. Fehlerwiederholung ausschließlich incorrectCards. Explizites freies Üben ohne FSRS-Änderung. Hard-Bewertung konsistent in Statistik führen. Smart Write: Unicode/Whitespace normalisieren, definierte Klammernotizen/Alternativen berücksichtigen, kurze Tippfehler nicht pauschal akzeptieren; vollständig verratene Antworten/TTS/Tipps nicht als selbständigen Good-Abruf werten. Write-TTS am sichtbaren Fremdwort ausrichten.
7) Lokale Kalendertage statt UTC-Tagesstempel; Tagesziel/Streak/Fälligkeiten bei Datum/Fokus aktualisieren. Mobile: vollständige lange Wörter/Beispiele umbrechen und zugänglich halten; min-w-0, overflow-wrap:anywhere, geeignete Kartenhöhe/Scrollbereich; Iconziele mindestens 44×44 px. WebKit-Backfaces mit Prefix und kombinierten rotateY/translateZ-Transforms absichern. dvh/VisualViewport und scrollbare Dialoge für kleine Sichtbereiche; Modal über BottomNav, Fokusführung/Labels/Tastaturbedienung. Light-Mode-Nav/Feedbackkontraste korrigieren; vorhandenen globalen 16-px-Formularschutz erhalten.
8) Tatsächliche PWA-Icons 192/512, maskable und Apple-Touch-Icon ergänzen; lang=de, Titel SnapVocab, Theme-Meta und Safe-Area-Metadaten setzen. Service-Worker-Registrierung existiert bereits; nicht doppelt registrieren. Warnungen in betroffenen Dateien bereinigen.
Gezielt verifizieren: feste Sessionreihenfolge und Optionen trotz Bewertungen, Retry nur Fehlerkarten, 1–5 Karten und identische Antworttexte, schnelle Dreifachklicks, Timeout/Navigation/StrictMode/Tabpause, Scannerfehler und neue Batches, ungültige Imports/Quota, Stringfälle, lokaler Tageswechsel und 90-Zeichen-Wörter bei 390 px. Typecheck/Lint/Build ausführen, Produktions-PWA offline prüfen und reale iOS-/Android-Restprüfungen ausdrücklich ausweisen. Keine externen API-Keys oder Fotos in Logs ausgeben.
```

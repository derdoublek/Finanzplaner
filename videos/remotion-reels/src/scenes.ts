export type Scene = {
  kicker: string;
  headline: string;
  body?: string;
};

export type ReelData = {
  id: string;
  scenes: Scene[];
};

// Jede Szene dauert 5 Sekunden, jeder Reel also 20 Sekunden.
export const SCENE_SECONDS = 5;

export const reels: ReelData[] = [
  {
    id: "01-was-ist-der-finanzplaner",
    scenes: [
      { kicker: "Der Finanzplaner", headline: "Wie viel bleibt am Monatsende?" },
      { kicker: "Was er macht", headline: "Fixkosten sortieren", body: "Auto, Versicherungen, Kredite und Verträge. Alles in einer Übersicht." },
      { kicker: "Was du siehst", headline: "Dein Rest, sofort", body: "Netto minus Fixkosten. Ohne Taschenrechner." },
      { kicker: "Probier's aus", headline: "finanzielle-ordnung.de", body: "Keine Anmeldung nötig." },
    ],
  },
  {
    id: "02-netto-und-verfuegbar",
    scenes: [
      { kicker: "Schritt 1", headline: "Netto eintragen", body: "Dein Gehalt nach Abzügen. Mehr Eingabe braucht es am Anfang nicht." },
      { kicker: "Schritt 2", headline: "Fixkosten prüfen", body: "Auto, Versicherungen, Gläubiger. Die Summe steht direkt darunter." },
      { kicker: "Ergebnis", headline: "Verfügbar", body: "Netto minus Fixkosten. Wird der Wert rot, passt der Plan noch nicht." },
      { kicker: "Tipp", headline: "Einmal im Monat prüfen", body: "Dann siehst du, ob die Zahlen noch zu deinem Alltag passen." },
    ],
  },
  {
    id: "03-vertraege-anlegen",
    scenes: [
      { kicker: "Verträge", headline: "Einmal eintragen", body: "Name, Betrag, Rhythmus, Kategorie. Fertig." },
      { kicker: "Rhythmus", headline: "Monatlich bis jährlich", body: "Jährliche Beträge rechnet die App auf den Monat um." },
      { kicker: "Kategorien", headline: "Auto, Versicherung, Gläubiger", body: "Gläubiger sind laufende Zahlungen wie Kredit, Strom oder Handy." },
      { kicker: "Suche", headline: "Schnell gefunden", body: "Filter nach Kategorie und Rhythmus, dazu eine Suche nach dem Namen." },
    ],
  },
  {
    id: "04-abbuchungen-abhaken",
    scenes: [
      { kicker: "Im Alltag", headline: "Abgebucht? Abhaken.", body: "Über „Buchung hinzufügen“ markierst du einen Vertrag als bezahlt." },
      { kicker: "Überblick", headline: "Gesamt, bezahlt, offen", body: "Du siehst jederzeit, was in diesem Monat noch ansteht." },
      { kicker: "Kontostand", headline: "Reicht das Geld?", body: "Trag deinen aktuellen Kontostand ein. Die App zeigt den Puffer nach allen offenen Abzügen." },
      { kicker: "Monatsende", headline: "Monat zurücksetzen", body: "Die Abrechnung wandert ins Archiv, die Häkchen sind wieder leer." },
    ],
  },
  {
    id: "05-daten-bleiben-bei-dir",
    scenes: [
      { kicker: "Datenschutz", headline: "Keine Anmeldung", body: "Der Finanzplaner läuft im Browser." },
      { kicker: "Wo gespeichert", headline: "Auf deinem Gerät", body: "Die Daten liegen im Browser, nicht auf einem Server." },
      { kicker: "Achtung", headline: "Browserdaten nicht löschen", body: "Sonst sind deine Einträge weg. Mach dir das bewusst." },
      { kicker: "Jetzt starten", headline: "finanzielle-ordnung.de", body: "Einkommen eintragen, Fixkosten prüfen, fertig." },
    ],
  },
];

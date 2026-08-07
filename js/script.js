document.addEventListener('DOMContentLoaded', () => {
  // Standarddaten für Gläubiger, falls noch keine im localStorage sind
  const standardGlaeubiger = [
    { name: 'Kredit 1', betrag: 300 },
    { name: 'Kredit 2', betrag: 200 }
  ];

  // Element-Referenzen
  const nettoInput = document.getElementById('netto-einkommen');
  const glaeubigerStandInput = document.getElementById('glaeubiger-stand');
  const glaeubigerBedarfEl = document.getElementById('glaeubiger-bedarf');
  const glaeubigerListe = document.getElementById('glaeubiger-liste');
  const neuerNameInput = document.getElementById('neuer-name');
  const neuerBetragInput = document.getElementById('neuer-betrag');
  const btnHinzufuegen = document.getElementById('btn-hinzufuegen');

  // Daten aus localStorage laden
  let glaeubigerListeData = JSON.parse(localStorage.getItem('glaeubigerListeData')) || standardGlaeubiger;
  if (nettoInput) nettoInput.value = localStorage.getItem('nettoEinkommen') || '';
  if (glaeubigerStandInput) glaeubigerStandInput.value = localStorage.getItem('glaeubigerStand') || '';

  // Speicher- & Rechenfunktion
  function aktualisieren() {
    // Eingaben im localStorage sichern
    if (nettoInput) localStorage.setItem('nettoEinkommen', nettoInput.value);
    if (glaeubigerStandInput) localStorage.setItem('glaeubigerStand', glaeubigerStandInput.value);
    localStorage.setItem('glaeubigerListeData', JSON.stringify(glaeubigerListeData));

    // Gesamtsumme der Gläubiger berechnen
    const gesamtBedarf = glaeubigerListeData.reduce((summe, item) => summe + Number(item.betrag || 0), 0);
    
    // Summe in der Karte anzeigen
    if (glaeubigerBedarfEl) {
      glaeubigerBedarfEl.textContent = gesamtBedarf.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' €';
    }

    // Tabelle neu rendern
    tabelleRendern();
  }

  // Tabelle zeichnen
  function tabelleRendern() {
    if (!glaeubigerListe) return;
    glaeubigerListe.innerHTML = '';

    glaeubigerListeData.forEach((item, index) => {
      const tr = document.createElement('tr');
      
      const tdName = document.createElement('td');
      tdName.textContent = item.name;
      
      const tdBetrag = document.createElement('td');
      tdBetrag.textContent = Number(item.betrag).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' €';

      const tdAktion = document.createElement('td');
      const btnLoeschen = document.createElement('button');
      btnLoeschen.textContent = '🗑️';
      btnLoeschen.className = 'btn-delete';
      btnLoeschen.onclick = () => {
        glaeubigerListeData.splice(index, 1);
        aktualisieren();
      };
      tdAktion.appendChild(btnLoeschen);

      tr.appendChild(tdName);
      tr.appendChild(tdBetrag);
      tr.appendChild(tdAktion);
      glaeubigerListe.appendChild(tr);
    });
  }

  // Neuer Gläubiger hinzufügen
  if (btnHinzufuegen) {
    btnHinzufuegen.addEventListener('click', () => {
      const name = neuerNameInput.value.trim();
      const betrag = parseFloat(neuerBetragInput.value);

      if (name && !isNaN(betrag) && betrag > 0) {
        glaeubigerListeData.push({ name, betrag });
        neuerNameInput.value = '';
        neuerBetragInput.value = '';
        aktualisieren();
      }
    });
  }

  // Event-Listener für Eingabefelder
  if (nettoInput) nettoInput.addEventListener('input', aktualisieren);
  if (glaeubigerStandInput) glaeubigerStandInput.addEventListener('input', aktualisieren);

  // Initialer Aufruf
  aktualisieren();
});
function initApp() {
  // --- 1. BERECHNUNG EINKOMMEN & KONTOSTAND ---
  const nettoInput = document.getElementById('netto');
  const kontostandInput = document.getElementById('kontostand');
  const restDisplay = document.getElementById('rest');
  const ueberschussDisplay = document.getElementById('ueberschuss');
  const pufferStatusDisplay = document.getElementById('pufferStatus');

  const fixkostenGesamt = 2305;
  const zielpuffer = 750;

  function berechneFinanzen() {
    if (nettoInput && restDisplay) {
      const netto = parseFloat(nettoInput.value) || 0;
      const verfuegbar = netto - fixkostenGesamt;
      restDisplay.textContent = verfuegbar.toLocaleString('de-DE') + ' €';
    }

    if (kontostandInput && ueberschussDisplay && pufferStatusDisplay) {
      const kontostand = parseFloat(kontostandInput.value) || 0;
      const ueberschuss = kontostand - zielpuffer;

      if (ueberschuss >= 0) {
        ueberschussDisplay.textContent = ueberschuss.toLocaleString('de-DE') + ' €';
        pufferStatusDisplay.className = 'green';
        pufferStatusDisplay.textContent = '🟢 Du kannst ' + ueberschuss.toLocaleString('de-DE') + ' € entnehmen.';
      } else {
        const fehlbetrag = Math.abs(ueberschuss);
        ueberschussDisplay.textContent = '-' + fehlbetrag.toLocaleString('de-DE') + ' €';
        pufferStatusDisplay.className = 'red';
        pufferStatusDisplay.textContent = '🔴 Es fehlen ' + fehlbetrag.toLocaleString('de-DE') + ' € zum Zielpuffer.';
      }
    }
  }

  if (nettoInput) nettoInput.addEventListener('input', berechneFinanzen);
  if (kontostandInput) kontostandInput.addEventListener('input', berechneFinanzen);
  berechneFinanzen();

  // --- 2. VERTRAGSTABELLE MIT BEARBEITUNGSFUNKTION ---
  const tableBody = document.querySelector('#vertragstabelle tbody');
  const gesamtVertraegeEl = document.getElementById('gesamtVertraege');
  const sucheInput = document.getElementById('sucheVertrag');
  const filterKategorie = document.getElementById('filterKategorie');

  const vertragsDaten = (typeof vertraege !== 'undefined') ? vertraege : [];
  let currentEditIndex = null;

  function initKategorienFilter() {
    if (!filterKategorie) return;
    const kategorien = [...new Set(vertragsDaten.map(v => v.kategorie))];
    filterKategorie.innerHTML = '<option value="">Alle Kategorien</option>';
    kategorien.forEach(kat => {
      const option = document.createElement('option');
      option.value = kat;
      option.textContent = kat;
      filterKategorie.appendChild(option);
    });
  }

  function renderVertraege() {
    if (!tableBody) return;

    const suche = sucheInput ? sucheInput.value.toLowerCase() : '';
    const katFilter = filterKategorie ? filterKategorie.value : '';

    const gefiltert = vertragsDaten.filter(v => {
      const passtSuche = v.name.toLowerCase().includes(suche) || v.kategorie.toLowerCase().includes(suche);
      const passtKategorie = katFilter === '' || v.kategorie === katFilter;
      return passtSuche && passtKategorie;
    });

    tableBody.innerHTML = '';
    let gesamtMonatlich = 0;

    gefiltert.forEach((v) => {
      const globalIndex = vertragsDaten.indexOf(v);
      gesamtMonatlich += v.monatlich;

      const tr = document.createElement('tr');

      if (currentEditIndex === globalIndex) {
        // Bearbeitungsmodus für diese Zeile
        tr.innerHTML = `
          <td style="padding: 6px;">
            <input type="text" id="editKat" value="${v.kategorie}" style="width: 100%; padding: 4px;">
          </td>
          <td style="padding: 6px;">
            <input type="text" id="editName" value="${v.name}" style="width: 100%; padding: 4px;">
          </td>
          <td style="padding: 6px;" colspan="2">
            Monatlich: <input type="number" step="0.01" id="editMonatlich" value="${v.monatlich}" style="width: 80px; padding: 4px;"> €
          </td>
          <td style="padding: 6px; text-align: right;">
            <button onclick="speichereBearbeitung(${globalIndex})" style="background:none; border:none; cursor:pointer;">💾</button>
            <button onclick="abbrechenBearbeitung()" style="background:none; border:none; cursor:pointer;">❌</button>
          </td>
        `;
      } else {
        // Normale Ansicht
        tr.innerHTML = `
          <td style="padding: 10px;"><b>${v.kategorie}</b></td>
          <td style="padding: 10px;">${v.name}</td>
          <td style="padding: 10px;">${v.jaehrlich.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</td>
          <td style="padding: 10px; font-weight: bold;">${v.monatlich.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</td>
          <td style="padding: 10px; text-align: right; white-space: nowrap;">
            <button onclick="starteBearbeitung(${globalIndex})" style="background:none; border:none; cursor:pointer; margin-right: 4px;" title="Bearbeiten">✏️</button>
            <button onclick="loescheVertrag(${globalIndex})" style="background:none; border:none; cursor:pointer; color:#dc3545;" title="Löschen">🗑️</button>
          </td>
        `;
      }
      tableBody.appendChild(tr);
    });

    if (gesamtVertraegeEl) {
      gesamtVertraegeEl.textContent = gesamtMonatlich.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }
  }

  // Aktionen: Bearbeiten / Speichern / Abbrechen / Löschen
  window.starteBearbeitung = function(index) {
    currentEditIndex = index;
    renderVertraege();
  };

  window.abbrechenBearbeitung = function() {
    currentEditIndex = null;
    renderVertraege();
  };

  window.speichereBearbeitung = function(index) {
    const neueKat = document.getElementById('editKat').value.trim();
    const neuerName = document.getElementById('editName').value.trim();
    const neuerMonatsbetrag = parseFloat(document.getElementById('editMonatlich').value) || 0;

    if (!neuerName || neuerMonatsbetrag <= 0) {
      alert('Bitte fülle Name und Betrag gültig aus.');
      return;
    }

    vertragsDaten[index].kategorie = neueKat;
    vertragsDaten[index].name = neuerName;
    vertragsDaten[index].monatlich = neuerMonatsbetrag;
    vertragsDaten[index].jaehrlich = neuerMonatsbetrag * 12;

    currentEditIndex = null;
    initKategorienFilter();
    renderVertraege();
  };

  window.loescheVertrag = function(index) {
    vertragsDaten.splice(index, 1);
    initKategorienFilter();
    renderVertraege();
  };

  // Neuer Vertrag hinzufügen
  const btnSpeichern = document.getElementById('vertragSpeichern');
  if (btnSpeichern) {
    btnSpeichern.addEventListener('click', function() {
      const name = document.getElementById('vertragName').value.trim();
      const betrag = parseFloat(document.getElementById('vertragBetrag').value) || 0;
      const rhythmus = parseInt(document.getElementById('vertragRhythmus').value) || 1;
      const kategorie = document.getElementById('vertragKategorie').value;

      if (!name || betrag <= 0) {
        alert('Bitte gib einen gültigen Namen und Betrag ein.');
        return;
      }

      const monatlich = (betrag * (12 / rhythmus)) / 12;
      const jaehrlich = monatlich * 12;

      vertragsDaten.push({ kategorie, name, jaehrlich, monatlich });

      document.getElementById('vertragName').value = '';
      document.getElementById('vertragBetrag').value = '';

      initKategorienFilter();
      renderVertraege();
    });
  }

  if (sucheInput) sucheInput.addEventListener('input', renderVertraege);
  if (filterKategorie) filterKategorie.addEventListener('change', renderVertraege);

  initKategorienFilter();
  renderVertraege();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
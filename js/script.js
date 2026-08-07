function initApp() {
  const STORAGE_KEY_VERTRAEGE = 'family_finance_vertraege';
  const STORAGE_KEY_NETTO = 'family_finance_netto';
  const STORAGE_KEY_KONTOSTAND = 'family_finance_kontostand';
  const STORAGE_KEY_DATUM = 'family_finance_datum';

  const nettoInput = document.getElementById('netto');
  const kontostandInput = document.getElementById('kontostand');
  const datumInput = document.querySelector('input[type="date"]');
  const restDisplay = document.getElementById('rest');
  const ueberschussDisplay = document.getElementById('ueberschuss');
  const pufferStatusDisplay = document.getElementById('pufferStatus');

  const fixAutoDisplay = document.getElementById('fixAuto');
  const bedarfVersicherungenDisplay = document.getElementById('bedarfVersicherungen');
  const fixGlaeubigerDisplay = document.getElementById('fixGlaeubiger');
  const bedarfGlaeubigerDisplay = document.getElementById('bedarfGlaeubiger');
  const gesamtFixkostenDisplay = document.getElementById('gesamtFixkosten');

  const fixAutoWert = 350;
  const fixVersicherungenStarr = 250;
  const fixGlaeubigerStarr = 1900; // Fester Betrag laut Einkommensverteiler
  const zielpuffer = 750;

  if (nettoInput && localStorage.getItem(STORAGE_KEY_NETTO) !== null) {
    nettoInput.value = localStorage.getItem(STORAGE_KEY_NETTO);
  }
  if (kontostandInput && localStorage.getItem(STORAGE_KEY_KONTOSTAND) !== null) {
    kontostandInput.value = localStorage.getItem(STORAGE_KEY_KONTOSTAND);
  }
  if (datumInput && localStorage.getItem(STORAGE_KEY_DATUM) !== null) {
    datumInput.value = localStorage.getItem(STORAGE_KEY_DATUM);
  }

  const tableBody = document.querySelector('#vertragstabelle tbody');
  const gesamtVertraegeEl = document.getElementById('gesamtVertraege');
  const sucheInput = document.getElementById('sucheVertrag');
  const filterKategorie = document.getElementById('filterKategorie');

  let vertragsDaten = [];
  const gespeicherteVertraege = localStorage.getItem(STORAGE_KEY_VERTRAEGE);
  if (gespeicherteVertraege) {
    try {
      vertragsDaten = JSON.parse(gespeicherteVertraege);
    } catch (e) {
      vertragsDaten = (typeof vertraege !== 'undefined') ? vertraege : [];
    }
  } else {
    vertragsDaten = (typeof vertraege !== 'undefined') ? vertraege : [];
  }

  let currentEditIndex = null;

  function speichereInLocalStorage() {
    localStorage.setItem(STORAGE_KEY_VERTRAEGE, JSON.stringify(vertragsDaten));
  }

  function berechneFinanzen() {
    let versicherungBedarfSumme = 0;
    let glaeubigerKontoSumme = 0;

    // Exakte Trennung nach Kategorien
    vertragsDaten.forEach(v => {
      const kat = (v.kategorie || '').toLowerCase();
      if (kat.includes('versicherung')) {
        versicherungBedarfSumme += v.monatlich;
      } else if (kat.includes('gläubiger') || kat.includes('glaeubiger')) {
        glaeubigerKontoSumme += v.monatlich;
      }
    });

    // 1. Tatsächlicher Bedarf bei Versicherungen anzeigen
    if (bedarfVersicherungenDisplay) {
      bedarfVersicherungenDisplay.textContent = versicherungBedarfSumme.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }

    // 2. Gläubigerkonto: Anzeigewert starr auf 1.900 €, tatsächlicher Bedarf darunter
    if (fixGlaeubigerDisplay) {
      fixGlaeubigerDisplay.textContent = fixGlaeubigerStarr.toLocaleString('de-DE') + ' €';
    }
    if (bedarfGlaeubigerDisplay) {
      bedarfGlaeubigerDisplay.textContent = glaeubigerKontoSumme.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }

    if (fixAutoDisplay) {
      fixAutoDisplay.textContent = fixAutoWert.toLocaleString('de-DE') + ' €';
    }

    // 3. Gesamte Fixkosten (Auto [350 €] + Versicherungen [250 €] + Gläubigerkonto [1.900 €] = 2.500 €)
    const fixkostenGesamt = fixAutoWert + fixVersicherungenStarr + fixGlaeubigerStarr;

    if (gesamtFixkostenDisplay) {
      gesamtFixkostenDisplay.textContent = 'Gesamt: ' + fixkostenGesamt.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }

    // 4. Verfügbares Netto berechnen
    if (nettoInput && restDisplay) {
      const netto = parseFloat(nettoInput.value) || 0;
      const verfuegbar = netto - fixkostenGesamt;
      restDisplay.textContent = verfuegbar.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
      localStorage.setItem(STORAGE_KEY_NETTO, nettoInput.value);
    }

    // 5. Gläubigerkonto Puffer / Entnahme berechnen
    if (kontostandInput && ueberschussDisplay && pufferStatusDisplay) {
      const kontostand = parseFloat(kontostandInput.value) || 0;
      const ueberschuss = kontostand - zielpuffer;
      localStorage.setItem(STORAGE_KEY_KONTOSTAND, kontostandInput.value);

      if (ueberschuss >= 0) {
        ueberschussDisplay.textContent = ueberschuss.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
        pufferStatusDisplay.className = 'green';
        pufferStatusDisplay.textContent = '🟢 Du kannst ' + ueberschuss.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' € entnehmen.';
      } else {
        const fehlbetrag = Math.abs(ueberschuss);
        ueberschussDisplay.textContent = '-' + fehlbetrag.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
        pufferStatusDisplay.className = 'red';
        pufferStatusDisplay.textContent = '🔴 Es fehlen ' + fehlbetrag.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' € zum Zielpuffer.';
      }
    }
  }

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

    // Höchster monatlicher Betrag oben
    vertragsDaten.sort((a, b) => b.monatlich - a.monatlich);

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
        tr.innerHTML = `
          <td style="padding: 6px;"><input type="text" id="editKat" value="${v.kategorie}" style="width: 100%; padding: 4px;"></td>
          <td style="padding: 6px;"><input type="text" id="editName" value="${v.name}" style="width: 100%; padding: 4px;"></td>
          <td style="padding: 6px;" colspan="2">Monatlich: <input type="number" step="0.01" id="editMonatlich" value="${v.monatlich}" style="width: 80px; padding: 4px;"> €</td>
          <td style="padding: 6px; text-align: right;">
            <button onclick="speichereBearbeitung(${globalIndex})" style="background:none; border:none; cursor:pointer;">💾</button>
            <button onclick="abbrechenBearbeitung()" style="background:none; border:none; cursor:pointer;">❌</button>
          </td>
        `;
      } else {
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

    berechneFinanzen();
  }

  if (nettoInput) nettoInput.addEventListener('input', berechneFinanzen);
  if (kontostandInput) kontostandInput.addEventListener('input', berechneFinanzen);
  if (datumInput) {
    datumInput.addEventListener('change', () => {
      localStorage.setItem(STORAGE_KEY_DATUM, datumInput.value);
    });
  }

  window.starteBearbeitung = function(index) { currentEditIndex = index; renderVertraege(); };
  window.abbrechenBearbeitung = function() { currentEditIndex = null; renderVertraege(); };

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
    speichereInLocalStorage();
    initKategorienFilter();
    renderVertraege();
  };

  window.loescheVertrag = function(index) {
    vertragsDaten.splice(index, 1);
    speichereInLocalStorage();
    initKategorienFilter();
    renderVertraege();
  };

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

      speichereInLocalStorage();
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
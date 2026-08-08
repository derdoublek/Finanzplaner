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
  const nochOffenBedarfDisplay = document.getElementById('nochOffenBedarf');

  const fixAutoDisplay = document.getElementById('fixAuto');
  const bedarfVersicherungenDisplay = document.getElementById('bedarfVersicherungen');
  const fixGlaeubigerDisplay = document.getElementById('fixGlaeubiger');
  const bedarfGlaeubigerDisplay = document.getElementById('bedarfGlaeubiger');
  const gesamtFixkostenDisplay = document.getElementById('gesamtFixkosten');

  const bereitsAbgebuchtDisplay = document.getElementById('bereitsAbgebuchtDisplay');
  const offenDisplay = document.getElementById('offenDisplay');
  const btnResetAbgebucht = document.getElementById('btnResetAbgebucht');
  const monatsHinweis = document.getElementById('monatsHinweis');

  // Prüfen, ob heute zwischen dem 15. und 20. des Monats ist -> Hinweis einblenden
  const aktuellerTag = new Date().getDate();
  if (monatsHinweis) {
    if (aktuellerTag >= 15 && aktuellerTag <= 20) {
      monatsHinweis.style.display = 'inline-block';
    } else {
      monatsHinweis.style.display = 'none';
    }
  }

  const fixAutoWert = 350;
  const fixVersicherungenStarr = 250;
  const fixGlaeubigerStarr = 1900; 

  if (nettoInput) {
    const gespeicherterNettoWert = localStorage.getItem(STORAGE_KEY_NETTO);
    if (gespeicherterNettoWert !== null && gespeicherterNettoWert !== '') {
      nettoInput.value = gespeicherterNettoWert;
    } else {
      nettoInput.value = '3500';
    }
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

  // Daten abgleichen: Basis aus daten.js laden und mit gespeichertem Status (abgebucht) abgleichen
  let basisVertraege = (typeof vertraege !== 'undefined') ? vertraege : [];
  let vertragsDaten = [];
  
  const gespeicherteVertraege = localStorage.getItem(STORAGE_KEY_VERTRAEGE);
  let gespeicherteMap = new Map();
  
  if (gespeicherteVertraege) {
    try {
      const parsedStored = JSON.parse(gespeicherteVertraege);
      parsedStored.forEach(v => {
        gespeicherteMap.set(v.name, v);
      });
    } catch (e) {
      // Fallback
    }
  }

  // Abgleich: Nimm die Verträge aus der daten.js und behalte den Abgebucht-Status oder manuelle Anpassungen bei
  vertragsDaten = basisVertraege.map(basisV => {
    const gespeichert = gespeicherteMap.get(basisV.name);
    if (gespeichert) {
      return {
        ...basisV,
        abgebucht: gespeichert.abgebucht !== undefined ? gespeichert.abgebucht : false,
        abgebuchtDatum: gespeichert.abgebuchtDatum || null
      };
    } else {
      return {
        ...basisV,
        abgebucht: false,
        abgebuchtDatum: null
      };
    }
  });

  // Falls manuell hinzugefügte Verträge im LocalStorage existieren, die nicht in daten.js stehen, behalten wir sie bei
  if (gespeicherteVertraege) {
    try {
      const parsedStored = JSON.parse(gespeicherteVertraege);
      parsedStored.forEach(storedV => {
        const existsInBasis = basisVertraege.some(b => b.name === storedV.name);
        if (!existsInBasis) {
          vertragsDaten.push(storedV);
        }
      });
    } catch (e) {}
  }

  let currentEditIndex = null;

  function speichereInLocalStorage() {
    localStorage.setItem(STORAGE_KEY_VERTRAEGE, JSON.stringify(vertragsDaten));
  }

  function berechneFinanzen() {
    let versicherungBedarfSumme = 0;
    let glaeubigerKontoSumme = 0;
    let nochOffenGläubigerBedarf = 0;

    vertragsDaten.forEach(v => {
      const kat = (v.kategorie || '').toLowerCase();
      if (kat.includes('versicherung')) {
        versicherungBedarfSumme += v.monatlich;
      } else if (kat.includes('gläubiger') || kat.includes('glaeubiger')) {
        glaeubigerKontoSumme += v.monatlich;
        if (!v.abgebucht) {
          nochOffenGläubigerBedarf += v.monatlich;
        }
      }
    });

    if (bedarfVersicherungenDisplay) {
      bedarfVersicherungenDisplay.textContent = versicherungBedarfSumme.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }

    if (fixGlaeubigerDisplay) {
      fixGlaeubigerDisplay.textContent = fixGlaeubigerStarr.toLocaleString('de-DE') + ' €';
    }
    if (bedarfGlaeubigerDisplay) {
      bedarfGlaeubigerDisplay.textContent = glaeubigerKontoSumme.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }

    if (fixAutoDisplay) {
      fixAutoDisplay.textContent = fixAutoWert.toLocaleString('de-DE') + ' €';
    }

    const fixkostenGesamt = fixAutoWert + fixVersicherungenStarr + fixGlaeubigerStarr;

    if (gesamtFixkostenDisplay) {
      gesamtFixkostenDisplay.textContent = 'Gesamt: ' + fixkostenGesamt.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }

    if (nettoInput && restDisplay) {
      const netto = parseFloat(nettoInput.value) || 0;
      const verfuegbar = netto - fixkostenGesamt;
      restDisplay.textContent = verfuegbar.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
      
      if (verfuegbar < 0) {
        restDisplay.className = 'total red';
      } else {
        restDisplay.className = 'total';
      }

      localStorage.setItem(STORAGE_KEY_NETTO, nettoInput.value);
    }

    if (kontostandInput && ueberschussDisplay && pufferStatusDisplay) {
      const kontostand = parseFloat(kontostandInput.value) || 0;
      const differenz = kontostand - nochOffenGläubigerBedarf;
      localStorage.setItem(STORAGE_KEY_KONTOSTAND, kontostandInput.value);

      if (nochOffenBedarfDisplay) {
        nochOffenBedarfDisplay.textContent = nochOffenGläubigerBedarf.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
      }

      if (differenz >= 0) {
        ueberschussDisplay.textContent = '+' + differenz.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
        pufferStatusDisplay.className = 'status-box-green';
        pufferStatusDisplay.textContent = '🟢 Kontostand deckt alle restlichen Abzüge.';
      } else {
        const fehlbetrag = Math.abs(differenz);
        ueberschussDisplay.textContent = '-' + fehlbetrag.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
        pufferStatusDisplay.className = 'status-box-red';
        pufferStatusDisplay.textContent = '🔴 Es fehlen ' + fehlbetrag.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' € für offene Verträge.';
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

    // Sortierung: 1. Nicht abgebucht oben, 2. Abgebucht unten, innerhalb nach Betrag absteigend
    vertragsDaten.sort((a, b) => {
      if (a.abgebucht !== b.abgebucht) {
        return a.abgebucht ? 1 : -1;
      }
      return b.monatlich - a.monatlich;
    });

    const suche = sucheInput ? sucheInput.value.toLowerCase() : '';
    const katFilter = filterKategorie ? filterKategorie.value : '';

    const gefiltert = vertragsDaten.filter(v => {
      const passtSuche = v.name.toLowerCase().includes(suche) || v.kategorie.toLowerCase().includes(suche);
      const passtKategorie = katFilter === '' || v.kategorie === katFilter;
      return passtSuche && passtKategorie;
    });

    tableBody.innerHTML = '';
    let gesamtMonatlich = 0;
    let bereitsAbgebuchtSumme = 0;
    let offenSumme = 0;

    gefiltert.forEach((v) => {
      const globalIndex = vertragsDaten.indexOf(v);
      gesamtMonatlich += v.monatlich;

      if (v.abgebucht) {
        bereitsAbgebuchtSumme += v.monatlich;
      } else {
        offenSumme += v.monatlich;
      }

      const tr = document.createElement('tr');
      if (v.abgebucht && currentEditIndex !== globalIndex) {
        tr.classList.add('abgebucht-row');
      }

      if (currentEditIndex === globalIndex) {
        tr.innerHTML = `
          <td></td>
          <td style="padding: 6px;"><input type="text" id="editKat" value="${v.kategorie}" style="width: 100%; padding: 4px;"></td>
          <td style="padding: 6px;"><input type="text" id="editName" value="${v.name}" style="width: 100%; padding: 4px;"></td>
          <td style="padding: 6px;" colspan="2">Monatlich: <input type="number" step="0.01" id="editMonatlich" value="${v.monatlich}" style="width: 80px; padding: 4px;"> €</td>
          <td style="padding: 6px; text-align: right;">
            <button onclick="speichereBearbeitung(${globalIndex})" style="background:none; border:none; cursor:pointer;">💾</button>
            <button onclick="abbrechenBearbeitung()" style="background:none; border:none; cursor:pointer;">❌</button>
          </td>
        `;
      } else {
        const datumAnzeige = v.abgebuchtDatum ? `<br><small style="color: #6b7280; font-weight: normal;">Abgebucht am: ${v.abgebuchtDatum}</small>` : '';
        tr.innerHTML = `
          <td style="text-align: center; padding: 10px;">
            <input type="checkbox" class="check-abgebucht" ${v.abgebucht ? 'checked' : ''} onchange="toggleAbgebucht(${globalIndex}, this)">
          </td>
          <td style="padding: 10px;"><b>${v.kategorie}</b></td>
          <td style="padding: 10px;">${v.name}${datumAnzeige}</td>
          <td style="padding: 10px;">${v.jaehrlich.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</td>
          <td style="padding: 10px; font-weight: bold;">${v.monatlich.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</td>
          <td style="padding: 10px; text-align: right; white-space: nowrap;">
            <button onclick="loescheVertrag(${globalIndex})" style="background:none; border:none; cursor:pointer; color:#dc3545; margin-right: 6px;" title="Löschen">🗑️</button>
            <button onclick="starteBearbeitung(${globalIndex})" style="background:none; border:none; cursor:pointer;" title="Bearbeiten">✏️</button>
          </td>
        `;
      }
      tableBody.appendChild(tr);
    });

    if (gesamtVertraegeEl) {
      gesamtVertraegeEl.textContent = gesamtMonatlich.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }
    if (bereitsAbgebuchtDisplay) {
      bereitsAbgebuchtDisplay.textContent = bereitsAbgebuchtSumme.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }
    if (offenDisplay) {
      offenDisplay.textContent = offenSumme.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €';
    }

    berechneFinanzen();
  }

  window.toggleAbgebucht = function(index, checkboxEl) {
    const istAbgebucht = checkboxEl.checked;
    
    if (istAbgebucht) {
      // Datum abfragen mit Standardwert heute (YYYY-MM-DD umwandeln für deutsches Format)
      const heuteISO = new Date().toISOString().split('T')[0];
      const gewaehltesDatum = prompt("An welchem Datum wurde dieser Betrag abgebucht?", heuteISO);
      
      if (gewaehltesDatum) {
        // Datum formatiern von YYYY-MM-DD zu DD.MM.YYYY
        constteile = gewaehltesDatum.split('-');
        let formatiertesDatum = gewaehltesDatum;
        if (componet = part = dateParts = gewaehltesDatum.split('-')) {
          if (dateParts.length === 3) {
            formatiertesDatum = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
          }
        }
        vertragsDaten[index].abgebucht = true;
        vertragsDaten[index].abgebuchtDatum = formatiertesDatum;
      } else {
        // Wenn abgebrochen wird, Checkbox zurücksetzen
        checkboxEl.checked = false;
        return;
      }
    } else {
      vertragsDaten[index].abgebucht = false;
      vertragsDaten[index].abgebuchtDatum = null;
    }

    speichereInLocalStorage();
    renderVertraege();
  };

  if (btnResetAbgebucht) {
    btnResetAbgebucht.addEventListener('click', () => {
      if (confirm('Möchtest du alle Haken für den neuen Abrechnungszeitraum (15. bis 15.) zurücksetzen?')) {
        vertragsDaten.forEach(v => {
          v.abgebucht = false;
          v.abgebuchtDatum = null;
        });
        speichereInLocalStorage();
        renderVertraege();
      }
    });
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
    btnSpeichern.addEventListener('click', function(e) {
      e.preventDefault();

      const nameInput = document.getElementById('vertragName');
      const betragInput = document.getElementById('vertragBetrag');
      const rhythmusSelect = document.getElementById('vertragRhythmus');
      const kategorieSelect = document.getElementById('vertragKategorie');

      const name = nameInput.value.trim();
      const betrag = parseFloat(betragInput.value) || 0;
      const rhythmus = parseInt(rhythmusSelect.value) || 1;
      const kategorie = kategorieSelect.value;

      if (!name || betrag <= 0) {
        alert('Bitte gib einen gültigen Namen und Betrag ein.');
        return;
      }

      const monatlich = (betrag * (12 / rhythmus)) / 12;
      const jaehrlich = monatlich * 12;

      vertragsDaten.push({ kategorie, name, jaehrlich, monatlich, abgebucht: false, abgebuchtDatum: null });

      nameInput.value = '';
      betragInput.value = '';

      speichereInLocalStorage();
      initKategorienFilter();
      renderVertraege();

      const addModal = document.getElementById('addModal');
      if (addModal) addModal.close();
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
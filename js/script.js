function initApp() {
  const STORAGE_KEY_VERTRAEGE = 'family_finance_vertraege';
  const STORAGE_KEY_NETTO = 'family_finance_netto';
  const STORAGE_KEY_KONTOSTAND = 'family_finance_kontostand';
  const STORAGE_KEY_DATUM = 'family_finance_datum';
  const STORAGE_KEY_HISTORIE = 'family_finance_historie';

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

  const tabelleEl = document.getElementById('vertragstabelle');
  const tableBody = tabelleEl ? tabelleEl.querySelector('tbody') : null;
  const gesamtVertraegeEl = document.getElementById('gesamtVertraege');
  const sucheInput = document.getElementById('sucheVertrag');
  const filterKategorie = document.getElementById('filterKategorie');
  const filterRhythmus = document.getElementById('filterRhythmus');

  // Automatische Absicherung des Tabellenkopfes direkt im Code, damit HTML unangetastet bleibt
  if (tabelleEl) {
    let thead = tabelleEl.querySelector('thead');
    if (!thead) {
      thead = document.createElement('thead');
      tabelleEl.insertBefore(thead, tableBody);
    }
    thead.innerHTML = `
      <tr>
        <th>Kategorie</th>
        <th>Vertrag</th>
        <th>Betrag (Rhythmus)</th>
        <th>Umrechnung (Monat)</th>
        <th style="width: 110px; text-align: right;">Aktion</th>
      </tr>
    `;
  }

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
    } catch (e) {}
  }

  vertragsDaten = basisVertraege.map(basisV => {
    const gespeichert = gespeicherteMap.get(basisV.name);
    if (gespeichert) {
      return {
        ...basisV,
        abgebucht: gespeichert.abgebucht !== undefined ? gespeichert.abgebucht : false,
        abgebuchtDatum: gespeichert.abgebuchtDatum || null,
        rhythmus: gespeichert.rhythmus !== undefined ? gespeichert.rhythmus : (basisV.rhythmus || 1),
        eingabeBetrag: gespeichert.eingabeBetrag !== undefined ? gespeichert.eingabeBetrag : (basisV.monatlich * (basisV.rhythmus || 1)),
        aktuelleRate: gespeichert.aktuelleRate !== undefined ? gespeichert.aktuelleRate : 1
      };
    } else {
      return {
        ...basisV,
        abgebucht: false,
        abgebuchtDatum: null,
        rhythmus: basisV.rhythmus || 1,
        eingabeBetrag: basisV.monatlich * (basisV.rhythmus || 1),
        aktuelleRate: 1
      };
    }
  });

  if (gespeicherteVertraege) {
    try {
      const parsedStored = JSON.parse(gespeicherteVertraege);
      parsedStored.forEach(storedV => {
        const existsInBasis = basisVertraege.some(b => b.name === storedV.name);
        if (!existsInBasis) {
          if (storedV.eingabeBetrag === undefined) {
            storedV.eingabeBetrag = storedV.monatlich * (storedV.rhythmus || 1);
          }
          if (storedV.aktuelleRate === undefined) {
            storedV.aktuelleRate = 1;
          }
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

  function initSchnellAbbuchungDropdown() {
    const selectEl = document.getElementById('schnellAbbuchungSelect');
    if (!selectEl) return;

    const offeneVertraege = vertragsDaten.filter(v => !v.abgebucht);
    const sortierteVertraege = [...offeneVertraege].sort((a, b) => a.name.localeCompare(b.name, 'de'));

    selectEl.innerHTML = '';

    if (sortierteVertraege.length === 0) {
      const option = document.createElement('option');
      option.value = "";
      option.textContent = "Alle Verträge für diesen Monat bereits abgehakt! 🎉";
      selectEl.appendChild(option);
      return;
    }

    sortierteVertraege.forEach(v => {
      const realIndex = vertragsDaten.findIndex(item => item.name === v.name);
      const anzeigeEingabeBetrag = v.eingabeBetrag !== undefined ? v.eingabeBetrag : (v.monatlich * (v.rhythmus || 1));
      const option = document.createElement('option');
      option.value = realIndex;
      option.textContent = `${v.name} (${anzeigeEingabeBetrag.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} € - ${rhythmuskanon(v.rhythmus)})`;
      selectEl.appendChild(option);
    });
  }

  function renderHistorie() {
    const historieTbody = document.querySelector('#historieTabelle tbody');
    if (!historieTbody) return;

    let historieEintraege = [];
    try {
      const gespeicherteHistorie = localStorage.getItem(STORAGE_KEY_HISTORIE);
      if (gespeicherteHistorie) {
        historieEintraege = JSON.parse(gespeicherteHistorie);
      }
    } catch (e) {}

    historieTbody.innerHTML = '';

    if (historieEintraege.length === 0) {
      historieTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #6b7280; padding: 15px;">Bisher noch keine archivierten Monate vorhanden.</td></tr>`;
      return;
    }

    historieEintraege.forEach(eintrag => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 10px;"><b>${eintrag.zeitraum}</b></td>
        <td style="padding: 10px;">${eintrag.gesamt} €</td>
        <td style="padding: 10px;">${eintrag.abgebucht} €</td>
        <td style="padding: 10px; color: #16a34a; font-weight: bold;">${eintrag.status}</td>
      `;
      historieTbody.appendChild(tr);
    });
  }

  function renderVertraege() {
    if (!tableBody) return;

    vertragsDaten.sort((a, b) => {
      if (a.abgebucht !== b.abgebucht) {
        return a.abgebucht ? 1 : -1;
      }
      return b.monatlich - a.monatlich;
    });

    const suche = sucheInput ? sucheInput.value.toLowerCase() : '';
    const katFilter = filterKategorie ? filterKategorie.value : '';
    const rhythmusFilter = filterRhythmus ? filterRhythmus.value : '';

    const gefiltert = vertragsDaten.filter(v => {
      const passtSuche = v.name.toLowerCase().includes(suche) || v.kategorie.toLowerCase().includes(suche);
      const passtKategorie = katFilter === '' || v.kategorie === katFilter;
      const passtRhythmus = rhythmusFilter === '' || String(v.rhythmus || 1) === rhythmusFilter;
      return passtSuche && passtKategorie && passtRhythmus;
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
          <td style="padding: 6px;"><input type="text" id="editKat" value="${v.kategorie}" style="width: 100%; padding: 4px;"></td>
          <td style="padding: 6px;"><input type="text" id="editName" value="${v.name}" style="width: 100%; padding: 4px;"></td>
          <td style="padding: 6px;">
            Betrag: <input type="number" step="0.01" id="editBetrag" value="${v.eingabeBetrag !== undefined ? v.eingabeBetrag.toFixed(2) : (v.monatlich * v.rhythmus).toFixed(2)}" style="width: 90px; padding: 4px;"><br>
            Rhythmus: <select id="editRhythmus" style="width: 110px; padding: 4px; margin-top: 4px;">
              <option value="1" ${v.rhythmus === 1 ? 'selected' : ''}>Monatlich</option>
              <option value="3" ${v.rhythmus === 3 ? 'selected' : ''}>Vierteljährlich</option>
              <option value="6" ${v.rhythmus === 6 ? 'selected' : ''}>Halbjährlich</option>
              <option value="12" ${v.rhythmus === 12 ? 'selected' : ''}>Jährlich</option>
            </select>
          </td>
          <td style="padding: 6px;"><b>${v.monatlich.toFixed(2)} € / mtl.</b></td>
          <td style="padding: 6px; text-align: right;">
            <button onclick="speichereBearbeitung(${globalIndex})" style="background:none; border:none; cursor:pointer;" title="Speichern">💾</button>
            <button onclick="abbrechenBearbeitung()" style="background:none; border:none; cursor:pointer;" title="Abbrechen">❌</button>
          </td>
        `;
      } else {
        const datumAnzeige = v.abgebuchtDatum ? `<br><small style="color: #6b7280; font-weight: normal;">Abgebucht am: ${v.abgebuchtDatum}</small>` : '';
        const anzeigeEingabeBetrag = v.eingabeBetrag !== undefined ? v.eingabeBetrag : (v.monatlich * (v.rhythmus || 1));
        const originalBetragStr = anzeigeEingabeBetrag.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const monatlichStr = v.monatlich.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const rhythmusDetailText = rhythmuskanon(v.rhythmus);

        tr.innerHTML = `
          <td style="padding: 10px;"><b>${v.kategorie}</b></td>
          <td style="padding: 10px;">${v.name}${datumAnzeige}</td>
          <td style="padding: 10px;"><b>${originalBetragStr} €</b></td>
          <td style="padding: 10px;">
            ${monatlichStr} €<br>
            <small style="color: #6b7280;">(${rhythmusDetailText})</small>
          </td>
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
    initSchnellAbbuchungDropdown();
  }

  function rhythmuskanon(r) {
    if (r === 3) return 'Vierteljährlich';
    if (r === 6) return 'Halbjährlich';
    if (r === 12) return 'Jährlich';
    return 'Monatlich';
  }

  if (btnResetAbgebucht) {
    btnResetAbgebucht.addEventListener('click', () => {
      if (confirm('Möchtest du den aktuellen Monat abschließen, die Daten in der Historie archivieren und alle Haken zurücksetzen?')) {
        let gesamtBedarf = 0;
        let abgebuchtSumme = 0;
        vertragsDaten.forEach(v => {
          gesamtBedarf += v.monatlich;
          if (v.abgebucht) {
            abgebuchtSumme += v.monatlich;
          }
        });

        const heuteFormatiert = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        
        let historieEintraege = [];
        try {
          const gespeicherteHistorie = localStorage.getItem(STORAGE_KEY_HISTORIE);
          if (gespeicherteHistorie) {
            historieEintraege = JSON.parse(gespeicherteHistorie);
          }
        } catch (e) {}

        historieEintraege.unshift({
          zeitraum: heuteFormatiert,
          gesamt: gesamtBedarf.toFixed(2),
          abgebucht: abgebuchtSumme.toFixed(2),
          status: 'Erfolgreich abgeschlossen'
        });

        localStorage.setItem(STORAGE_KEY_HISTORIE, JSON.stringify(historieEintraege));

        vertragsDaten.forEach(v => {
          v.abgebucht = false;
          v.abgebuchtDatum = null;
        });

        speichereInLocalStorage();
        renderVertraege();
        renderHistorie();
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
    const eingegebenerBetrag = parseFloat(document.getElementById('editBetrag').value) || 0;
    const neuerRhythmus = parseInt(document.getElementById('editRhythmus').value) || 1;

    if (!neuerName || eingegebenerBetrag <= 0) {
      alert('Bitte fülle Name und Betrag gültig aus.');
      return;
    }

    const monatlich = (eingegebenerBetrag * (12 / neuerRhythmus)) / 12;
    const jaehrlich = monatlich * 12;

    vertragsDaten[index].kategorie = neueKat;
    vertragsDaten[index].name = neuerName;
    vertragsDaten[index].rhythmus = neuerRhythmus;
    vertragsDaten[index].eingabeBetrag = eingegebenerBetrag;
    vertragsDaten[index].monatlich = monatlich;
    vertragsDaten[index].jaehrlich = jaehrlich;

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

      vertragsDaten.push({ 
        kategorie, 
        name, 
        jaehrlich, 
        monatlich, 
        rhythmus, 
        eingabeBetrag: betrag, 
        abgebucht: false, 
        abgebuchtDatum: null,
        aktuelleRate: 1
      });

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
  if (filterRhythmus) filterRhythmus.addEventListener('change', renderVertraege);

  initKategorienFilter();
  renderVertraege();
  renderHistorie();
  initSchnellAbbuchungDropdown();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
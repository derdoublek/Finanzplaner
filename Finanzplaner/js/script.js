// ==========================================
// Family Finance OS - Hauptsteuerung
// ==========================================

let vertragsDaten = [];
let editIndex = null;

// --- HILFSFUNKTIONEN ---
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatWaehrung(betrag) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(betrag);
}

// --- INITIALISIERUNG ---
document.addEventListener("DOMContentLoaded", () => {
  initDaten();
  setupEventListeners();
  renderAll();
});

function initDaten() {
  const gespeicherteVertraege = localStorage.getItem("ffos_vertraege");

  if (gespeicherteVertraege) {
    try {
      vertragsDaten = JSON.parse(gespeicherteVertraege);
    } catch (e) {
      vertragsDaten = typeof vertraege !== "undefined" ? [...vertraege] : [];
    }
  } else {
    vertragsDaten = typeof vertraege !== "undefined" ? [...vertraege] : [];
    speichereInLocalStorage();
  }

  // Korrektur: Falls Daten im LocalStorage noch keine Kategorie besitzen
  if (typeof vertraege !== "undefined") {
    vertragsDaten.forEach(v => {
      if (!v.kategorie) {
        const original = vertraege.find(o => o.name === v.name);
        if (original && original.kategorie) {
          v.kategorie = original.kategorie;
        } else {
          v.kategorie = "Gläubigerkonto";
        }
      }
    });
    speichereInLocalStorage();
  }
}

function speichereInLocalStorage() {
  localStorage.setItem("ffos_vertraege", JSON.stringify(vertragsDaten));
}

// --- EVENT LISTENER ---
function setupEventListeners() {
  const sucheInput = document.getElementById("sucheVertrag");
  if (sucheInput) {
    sucheInput.addEventListener("input", renderVertragstabelle);
  }

  const filterKategorie = document.getElementById("filterKategorie");
  if (filterKategorie) {
    filterKategorie.addEventListener("change", renderVertragstabelle);
  }

  const speicherBtn = document.getElementById("vertragSpeichern");
  if (speicherBtn) {
    speicherBtn.addEventListener("click", speichereVertragHandler);
  }

  const nettoInput = document.getElementById("netto");
  if (nettoInput) {
    nettoInput.addEventListener("input", berechneFinanzen);
  }

  const konto = document.querySelectorAll("input[type='number']")[1];
  if (konto) {
    konto.addEventListener("input", updatePuffer);
  }
}

// --- RENDERING ---
function renderAll() {
  befuelleKategorieFilter();
  renderVertragstabelle();
  berechneFinanzen();
  updatePuffer();
}

function befuelleKategorieFilter() {
  const filterSelect = document.getElementById("filterKategorie");
  if (!filterSelect) return;

  const aktuelleAuswahl = filterSelect.value;
  const kategorien = [...new Set(vertragsDaten.map(v => v.kategorie || "Gläubigerkonto"))].sort();

  filterSelect.innerHTML = '<option value="">Alle Kategorien</option>';
  kategorien.forEach(kat => {
    const option = document.createElement("option");
    option.value = kat;
    option.textContent = kat;
    if (kat === aktuelleAuswahl) option.selected = true;
    filterSelect.appendChild(option);
  });
}

function renderVertragstabelle() {
  const tabelle = document.getElementById("vertragstabelle");
  if (!tabelle) return;

  const targetElement = tabelle.querySelector("tbody") || tabelle;
  const sucheInput = document.getElementById("sucheVertrag");
  const suchBegriff = sucheInput ? sucheInput.value.toLowerCase().trim() : "";

  const filterSelect = document.getElementById("filterKategorie");
  const gewaehlteKategorie = filterSelect ? filterSelect.value : "";

  targetElement.innerHTML = "";

  vertragsDaten.forEach((v, index) => {
    const kat = v.kategorie || "Gläubigerkonto";
    const nameMatch = v.name && v.name.toLowerCase().includes(suchBegriff);
    const katMatch = kat.toLowerCase().includes(suchBegriff);

    const suchePassend = suchBegriff === "" || nameMatch || katMatch;
    const kategoriePassend = gewaehlteKategorie === "" || kat.toLowerCase() === gewaehlteKategorie.toLowerCase();

    if (suchePassend && kategoriePassend) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHtml(kat)}</td>
        <td><strong>${escapeHtml(v.name || "-")}</strong></td>
        <td>${formatWaehrung(v.jaehrlich || 0)}</td>
        <td>${formatWaehrung(v.monatlich || 0)}</td>
        <td style="text-align:center;">
          <button class="btn-icon" onclick="bearbeiteVertrag(${index})">✏️</button>
          <button class="btn-icon" onclick="loescheVertrag(${index})">🗑️</button>
        </td>
      `;

      targetElement.appendChild(row);
    }
  });

  berechneVertragssumme();
}

// --- CRUD FUNKTIONEN ---
function speichereVertragHandler(e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById("vertragName");
  const betragInput = document.getElementById("vertragBetrag");
  const rhythmusSelect = document.getElementById("vertragRhythmus");

  if (!nameInput || !betragInput) return;

  const name = nameInput.value.trim();
  const rawBetrag = parseFloat(betragInput.value.replace(",", "."));
  const rhythmus = rhythmusSelect ? rhythmusSelect.value : "1";

  if (!name || isNaN(rawBetrag) || rawBetrag <= 0) {
    alert("Bitte gib einen gültigen Namen und Betrag ein.");
    return;
  }

  let monatlich = 0;
  let jaehrlich = 0;

  if (rhythmus === "12") {
    jaehrlich = rawBetrag;
    monatlich = rawBetrag / 12;
  } else {
    monatlich = rawBetrag;
    jaehrlich = rawBetrag * 12;
  }

  const filterSelect = document.getElementById("filterKategorie");
  const aktuelleKategorie = (filterSelect && filterSelect.value) ? filterSelect.value : "Manuell";

  if (editIndex !== null) {
    vertragsDaten[editIndex].name = name;
    vertragsDaten[editIndex].jaehrlich = jaehrlich;
    vertragsDaten[editIndex].monatlich = monatlich;
    editIndex = null;
    document.getElementById("vertragSpeichern").textContent = "Vertrag hinzufügen";
  } else {
    vertragsDaten.push({
      kategorie: aktuelleKategorie,
      name,
      jaehrlich,
      monatlich
    });
  }

  speichereInLocalStorage();
  renderAll();

  nameInput.value = "";
  betragInput.value = "";
}

window.bearbeiteVertrag = function(index) {
  const v = vertragsDaten[index];
  if (!v) return;

  document.getElementById("vertragName").value = v.name || "";
  document.getElementById("vertragBetrag").value = v.monatlich || "";

  editIndex = index;
  document.getElementById("vertragSpeichern").textContent = "Änderung speichern";
};

window.loescheVertrag = function(index) {
  if (confirm(`Möchtest du "${vertragsDaten[index].name}" wirklich löschen?`)) {
    vertragsDaten.splice(index, 1);
    speichereInLocalStorage();
    renderAll();
  }
};

// --- DYNAMISCHE SUMMENBERECHUNG ---
function berechneVertragssumme() {
  const sucheInput = document.getElementById("sucheVertrag");
  const suchBegriff = sucheInput ? sucheInput.value.toLowerCase().trim() : "";

  const filterSelect = document.getElementById("filterKategorie");
  const gewaehlteKategorie = filterSelect ? filterSelect.value : "";

  const gefilterteVertraege = vertragsDaten.filter(v => {
    const kat = v.kategorie || "Gläubigerkonto";
    const nameMatch = v.name && v.name.toLowerCase().includes(suchBegriff);
    const katMatch = kat.toLowerCase().includes(suchBegriff);

    const suchePassend = suchBegriff === "" || nameMatch || katMatch;
    const kategoriePassend = gewaehlteKategorie === "" || kat.toLowerCase() === gewaehlteKategorie.toLowerCase();

    return suchePassend && kategoriePassend;
  });

  const gefilterteSumme = gefilterteVertraege.reduce(
    (summe, v) => summe + (v.monatlich || 0),
    0
  );

  const gesamtAnzeige = document.getElementById("gesamtVertraege");
  if (gesamtAnzeige) {
    const titelText = gewaehlteKategorie 
      ? `Monatlicher Bedarf (${escapeHtml(gewaehlteKategorie)}): ` 
      : "Monatlicher Bedarf: ";
    
    gesamtAnzeige.innerHTML = `${titelText}<strong>${formatWaehrung(gefilterteSumme)}</strong>`;
  }

  return gefilterteSumme;
}

function berechneKategorienBedarf() {
  const autoFix = 350;

  const versicherungenIst = vertragsDaten
    .filter(v => (v.kategorie || "").toLowerCase() === "versicherungen")
    .reduce((sum, v) => sum + (v.monatlich || 0), 0);

  const glaubigerIst = vertragsDaten
    .filter(v => (v.kategorie || "").toLowerCase() !== "versicherungen")
    .reduce((sum, v) => sum + (v.monatlich || 0), 0);

  const gesamtFixkosten = autoFix + versicherungenIst + glaubigerIst;

  return { autoFix, versicherungenIst, glaubigerIst, gesamtFixkosten };
}

function berechneFinanzen() {
  const nettoInput = document.getElementById("netto");
  const restAnzeige = document.getElementById("rest");

  if (!nettoInput || !restAnzeige) return;

  const netto = parseFloat(nettoInput.value.replace(",", ".")) || 0;
  const { gesamtFixkosten } = berechneKategorienBedarf();

  const verfuegbar = netto - gesamtFixkosten;
  restAnzeige.textContent = formatWaehrung(verfuegbar);
}

function updatePuffer() {
  const konto = document.querySelectorAll("input[type='number']")[1];
  const u = document.getElementById("ueberschuss");
  const s = document.getElementById("pufferStatus");

  if (!konto || !u || !s) return;

  const ziel = 750;
  const stand = Number(konto.value) || 0;
  const diff = Math.round(stand - ziel);

  if (diff >= 0) {
    u.textContent = formatWaehrung(diff);
    s.className = "green";
    s.textContent = "🟢 Du kannst " + formatWaehrung(diff) + " entnehmen.";
  } else {
    u.textContent = "-" + formatWaehrung(Math.abs(diff));
    s.className = "";
    s.style.color = "#dc2626";
    s.textContent = "🔴 Es fehlen " + formatWaehrung(Math.abs(diff)) + " bis zum Zielpuffer.";
  }
}
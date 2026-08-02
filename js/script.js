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

  // Korrektur: Feste ID statt querySelectorAll
  const kontoInput = document.getElementById("kontostand") || document.querySelectorAll("input[type='number']")[1];
  if (kontoInput) {
    kontoInput.addEventListener("input", updatePuffer);
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
  const kategorien = [...new Set(vertragsDaten.map(v => v.kategorie || "Allgemein"))].sort();

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
    const kat = v.kategorie || "Allgemein";
    const nameMatch = v.name && v.name.toLowerCase().includes(suchBegriff);
    const katMatch = kat.toLowerCase().includes(suchBegriff);

    const suchePassend = suchBegriff === "" || nameMatch || katMatch;
    const kategoriePassend = gewaehlteKategorie === "" || kat === gewaehlteKategorie;

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
  const rhythmus = rhythmusSelect ? rhythmusSelect.value : "monatlich";

  if (!name || isNaN(rawBetrag) || rawBetrag <= 0) {
    alert("Bitte gib einen gültigen Namen und Betrag ein.");
    return;
  }

  let monatlich = 0;
  let jaehrlich = 0;

  if (rhythmus === "jaehrlich" || rhythmus === "jährlich" || rhythmus === "12") {
    jaehrlich = rawBetrag;
    monatlich = rawBetrag / 12;
  } else {
    monatlich = rawBetrag;
    jaehrlich = rawBetrag * 12;
  }

  // Korrektur: Bestehende Kategorie beim Bearbeiten erhalten
  const kategorie = editIndex !== null ? (vertragsDaten[editIndex].kategorie || "Manuell") : "Manuell";

  const neuerVertrag = {
    kategorie,
    name,
    jaehrlich,
    monatlich
  };

  if (editIndex !== null) {
    vertragsDaten[editIndex] = neuerVertrag;
    editIndex = null;
    document.getElementById("vertragSpeichern").textContent = "Vertrag speichern";
  } else {
    vertragsDaten.push(neuerVertrag);
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
    
    if (editIndex === index) {
      editIndex = null;
      document.getElementById("vertragSpeichern").textContent = "Vertrag speichern";
    }
    
    speichereInLocalStorage();
    renderAll();
  }
};

// --- BERECHNUNGEN ---
function berechneVertragssumme() {
  const gesamtMonatlich = vertragsDaten.reduce(
    (summe, v) => summe + (v.monatlich || 0),
    0
  );

  const gesamtAnzeige = document.getElementById("gesamtVertraege");
  if (gesamtAnzeige) {
    gesamtAnzeige.textContent = formatWaehrung(gesamtMonatlich);
  }

  return gesamtMonatlich;
}

function berechneFinanzen() {
  const nettoInput = document.getElementById("netto");
  const restAnzeige = document.getElementById("rest");

  if (!nettoInput || !restAnzeige) return;

  const netto = parseFloat(nettoInput.value.replace(",", ".")) || 0;
  const vertragsSumme = berechneVertragssumme();
  const fixkosten = Math.max(2305, vertragsSumme);

  const verfuegbar = netto - fixkosten;
  restAnzeige.textContent = formatWaehrung(verfuegbar);
}

function updatePuffer() {
  const konto = document.getElementById("kontostand") || document.querySelectorAll("input[type='number']")[1];
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
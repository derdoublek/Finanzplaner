// ==========================
// Einkommen
// ==========================

const netto = document.getElementById("netto");
const rest = document.getElementById("rest");

let fixkostenGesamt = 2305;

function calc() {
    const frei = (Number(netto.value) || 0) - fixkostenGesamt;

    rest.textContent =
        frei.toLocaleString("de-DE", {
            maximumFractionDigits: 0
        }) + " €";
}

if (netto) {
    netto.addEventListener("input", calc);
}



// ==========================
// Gläubigerkonto
// ==========================

const konto = document.querySelectorAll('input[type="number"]')[1];
const u = document.getElementById("ueberschuss");
const s = document.getElementById("pufferStatus");

function updatePuffer() {

    const ziel = 750;
    const stand = Number(konto.value) || 0;
    const diff = Math.round(stand - ziel);

    if (diff >= 0) {

        u.textContent = diff + " €";
        s.style.color = "#16a34a";
        s.textContent = "🟢 Du kannst " + diff + " € entnehmen.";

    } else {

        u.textContent = "-" + Math.abs(diff) + " €";
        s.style.color = "#dc2626";
        s.textContent = "🔴 Es fehlen " + Math.abs(diff) + " € bis zum Zielpuffer.";

    }

}

konto.addEventListener("input", updatePuffer);



// ==========================
// Vertragsverwaltung
// ==========================

const vertragName = document.getElementById("vertragName");
const vertragBetrag = document.getElementById("vertragBetrag");
const vertragRhythmus = document.getElementById("vertragRhythmus");
const vertragButton = document.getElementById("vertragSpeichern");

const tabelle = document.querySelector("#vertragstabelle tbody");
const gesamtAnzeige = document.getElementById("gesamtVertraege");

let gesamtVertraege = 0;

vertragButton.addEventListener("click", () => {

    const name = vertragName.value.trim();
    const betrag = Number(vertragBetrag.value);

    if (name === "" || betrag <= 0) {
        alert("Bitte Vertrag und Betrag eingeben.");
        return;
    }

    const rhythmus = Number(vertragRhythmus.value);

    const monat = betrag / rhythmus;

    gesamtVertraege += monat;

    const zeile = document.createElement("tr");

    zeile.innerHTML = `
        <td>${name}</td>
        <td>${betrag.toFixed(2)} €</td>
        <td>${vertragRhythmus.options[vertragRhythmus.selectedIndex].text}</td>
        <td>${monat.toFixed(2)} €</td>
        <td>🗑️</td>
    `;

    tabelle.appendChild(zeile);

    gesamtAnzeige.textContent =
        gesamtVertraege.toFixed(2) + " €";

    fixkostenGesamt = 2305 + gesamtVertraege;

    calc();

    vertragName.value = "";
    vertragBetrag.value = "";
    vertragRhythmus.selectedIndex = 0;

});



// ==========================
// Start
// ==========================

updatePuffer();
calc();
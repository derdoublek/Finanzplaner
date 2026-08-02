// Hauptfunktion zur Darstellung der Vertragsverwaltung
function renderVertragsverwaltungView() {
  const root = document.getElementById('view-root');
  if (!root) return;

  root.innerHTML = `
    <div style="max-width:900px; margin:0 auto; display:flex; flex-direction:column; gap:20px;">
      
      <!-- Top Bar / Action Buttons -->
      <div class="card" style="padding:16px; display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn btn-secondary" onclick="exportContractsJSON()">JSON Export</button>
          <label class="btn btn-secondary" style="margin:0; cursor:pointer;">
            JSON Import
            <input type="file" accept=".json" onchange="importContractsJSON(event)" style="display:none;" />
          </label>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn btn-primary" onclick="openContractModal()">+ Neuer Vertrag</button>
        </div>
      </div>

      <!-- KPI Overview Cards -->
      <div id="vertrag-kpi-container"></div>

      <!-- Main Accordion Section -->
      <div class="card" style="padding:16px;">
        <!-- WICHTIG: Kein "open" Attribut im details-Tag -> bleibt standardmäßig zugeklappt -->
        <details id="details-vertragsverwaltung" style="border:1px solid var(--border); border-radius:8px; padding:12px;">
          <summary style="font-weight:600; cursor:pointer; font-size:1.1rem; user-select:none;">
            Allgemeine Vertragsverwaltung
          </summary>
          
          <div style="margin-top:16px; display:flex; flex-direction:column; gap:16px;">
            <!-- Filter Bar -->
            <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
              <input 
                type="text" 
                id="contract-search-input" 
                placeholder="Vertrag oder Anbieter suchen..." 
                class="form-control" 
                style="flex:1; min-width:200px;"
                oninput="renderVertragsListe()"
              />
              <select id="contract-category-filter" class="form-control" style="width:auto;" onchange="renderVertragsListe()">
                <option value="ALL">Alle Kategorien</option>
                <option value="VERSICHERUNG">Versicherungen</option>
                <option value="ABONNEMENT">Abonnements</option>
                <option value="MIETE_NEBENKOSTEN">Miete & Nebenkosten</option>
                <option value="SONSTIGES">Sonstiges</option>
              </select>
              <select id="contract-status-filter" class="form-control" style="width:auto;" onchange="renderVertragsListe()">
                <option value="ALL">Alle Status</option>
                <option value="AKTIV">Aktiv</option>
                <option value="GEKUENDIGT">Gekündigt</option>
                <option value="PAUSIERT">Pausiert</option>
              </select>
            </div>

            <!-- Table Container -->
            <div id="vertrags-liste-container" style="overflow-x:auto;"></div>
          </div>
        </details>
      </div>

    </div>
  `;

  // Explizit sicherstellen, dass das 'open'-Attribut nach dem Rendern entfernt ist
  const detailsEl = document.getElementById('details-vertragsverwaltung');
  if (detailsEl) {
    detailsEl.removeAttribute('open');
  }

  renderVertragKPIs();
  renderVertragsListe();
}

// Hilfsfunktion: Rendert die KPI-Karten
function renderVertragKPIs() {
  const container = document.getElementById('vertrag-kpi-container');
  if (!container) return;

  const contracts = typeof state !== 'undefined' && state.contracts ? state.contracts : [];
  
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'AKTIV').length;
  const monthlyCosts = contracts
    .filter(c => c.status === 'AKTIV')
    .reduce((sum, c) => sum + (Number(c.monthlyCost) || 0), 0);

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
      <div class="card" style="padding:12px; text-align:center;">
        <div style="font-size:0.85rem; color:var(--text-muted);">Verträge Gesamt</div>
        <div style="font-size:1.4rem; font-weight:bold;">${totalContracts}</div>
      </div>
      <div class="card" style="padding:12px; text-align:center;">
        <div style="font-size:0.85rem; color:var(--text-muted);">Aktive Verträge</div>
        <div style="font-size:1.4rem; font-weight:bold; color:var(--success, #28a745);">${activeContracts}</div>
      </div>
      <div class="card" style="padding:12px; text-align:center;">
        <div style="font-size:0.85rem; color:var(--text-muted);">Monatliche Kosten (Aktiv)</div>
        <div style="font-size:1.4rem; font-weight:bold;">${monthlyCosts.toFixed(2)} €</div>
      </div>
    </div>
  `;
}

// Hilfsfunktion: Gefilterte Vertragsliste rendern
function renderVertragsListe() {
  const container = document.getElementById('vertrags-liste-container');
  if (!container) return;

  const searchInput = document.getElementById('contract-search-input');
  const categoryFilter = document.getElementById('contract-category-filter');
  const statusFilter = document.getElementById('contract-status-filter');

  const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
  const categoryValue = categoryFilter ? categoryFilter.value : 'ALL';
  const statusValue = statusFilter ? statusFilter.value : 'ALL';

  const contracts = typeof state !== 'undefined' && state.contracts ? state.contracts : [];

  const filtered = contracts.filter(c => {
    const matchesSearch = !searchValue || 
      (c.name && c.name.toLowerCase().includes(searchValue)) ||
      (c.provider && c.provider.toLowerCase().includes(searchValue));
    const matchesCategory = categoryValue === 'ALL' || c.category === categoryValue;
    const matchesStatus = statusValue === 'ALL' || c.status === statusValue;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">Keine Verträge gefunden.</div>`;
    return;
  }

  let html = `
    <table class="table" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid var(--border); text-align:left;">
          <th style="padding:8px;">Name / Anbieter</th>
          <th style="padding:8px;">Kategorie</th>
          <th style="padding:8px;">Kosten (mtl.)</th>
          <th style="padding:8px;">Status</th>
          <th style="padding:8px; text-align:right;">Aktionen</th>
        </tr>
      </thead>
      <tbody>
  `;

  filtered.forEach(c => {
    html += `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:8px;">
          <div style="font-weight:600;">${c.name || 'Unbenannt'}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${c.provider || ''}</div>
        </td>
        <td style="padding:8px;">${c.category || '-'}</td>
        <td style="padding:8px;">${(Number(c.monthlyCost) || 0).toFixed(2)} €</td>
        <td style="padding:8px;"><span class="badge">${c.status || 'AKTIV'}</span></td>
        <td style="padding:8px; text-align:right;">
          <button class="btn btn-sm btn-secondary" onclick="editContract('${c.id}')">Bearbeiten</button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
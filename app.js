const STORAGE_KEYS = {
  savedKeywords: "tender-pulse-saved-keywords",
  trackedBids: "tender-pulse-tracked-bids",
  selectedHistoryBid: "tender-pulse-selected-history-bid"
};

const STAGES = [
  "Identified",
  "Reviewing Tender",
  "Documents Pending",
  "EMD / Fee Pending",
  "Technical Bid Ready",
  "Financial Bid Ready",
  "Submitted",
  "Awarded",
  "Lost",
  "On Hold"
];

const PRIORITIES = ["High", "Medium", "Low"];

const state = {
  results: [],
  trackedBids: loadStorage(STORAGE_KEYS.trackedBids, {}),
  savedKeywords: loadStorage(STORAGE_KEYS.savedKeywords, []),
  selectedHistoryBid: localStorage.getItem(STORAGE_KEYS.selectedHistoryBid) || "",
  searchTerms: []
};

const elements = {
  savedKeywordCount: document.querySelector("#savedKeywordCount"),
  trackedBidCount: document.querySelector("#trackedBidCount"),
  resultCount: document.querySelector("#resultCount"),
  keywordInput: document.querySelector("#keywordInput"),
  pageCountSelect: document.querySelector("#pageCountSelect"),
  closingSoonOnly: document.querySelector("#closingSoonOnly"),
  trackedOnly: document.querySelector("#trackedOnly"),
  keywordChips: document.querySelector("#keywordChips"),
  searchStatus: document.querySelector("#searchStatus"),
  resultsBody: document.querySelector("#resultsBody"),
  trackerCards: document.querySelector("#trackerCards"),
  stageFilter: document.querySelector("#stageFilter"),
  trackerSearchInput: document.querySelector("#trackerSearchInput"),
  historyBidList: document.querySelector("#historyBidList"),
  historyLog: document.querySelector("#historyLog"),
  trackerCardTemplate: document.querySelector("#trackerCardTemplate")
};

setup();

function setup() {
  hydrateControls();
  bindEvents();
  renderAll();
}

function hydrateControls() {
  elements.keywordInput.value = state.savedKeywords.join(", ");

  STAGES.forEach((stage) => {
    const option = document.createElement("option");
    option.value = stage;
    option.textContent = stage;
    elements.stageFilter.append(option);
  });
}

function bindEvents() {
  document.querySelector("#searchForm").addEventListener("submit", handleSearch);
  document.querySelector("#saveKeywordsBtn").addEventListener("click", saveKeywords);
  document.querySelector("#loadKeywordsBtn").addEventListener("click", loadSavedKeywords);
  document.querySelector("#exportResultsBtn").addEventListener("click", exportResults);
  document.querySelector("#exportTrackerBtn").addEventListener("click", exportTracker);
  document.querySelector("#downloadBackupBtn").addEventListener("click", downloadBackupJson);
  elements.closingSoonOnly.addEventListener("change", renderResults);
  elements.trackedOnly.addEventListener("change", renderResults);
  elements.stageFilter.addEventListener("change", renderTracker);
  elements.trackerSearchInput.addEventListener("input", renderTracker);
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(button.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

async function handleSearch(event) {
  event.preventDefault();
  const keywords = uniqueTerms(elements.keywordInput.value);

  if (!keywords.length) {
    updateStatus("Kam se kam ek keyword dijiye.");
    return;
  }

  state.searchTerms = keywords;
  renderKeywordChips(keywords);
  updateStatus("Live tender data fetch ho rahi hai...");

  const pageCount = Number(elements.pageCountSelect.value) || 1;

  try {
    const batches = await Promise.all(
      keywords.map(async (keyword) => {
        const response = await fetch(`./api/tenders?q=${encodeURIComponent(keyword)}&pages=${pageCount}`);
        if (!response.ok) {
          throw new Error(`Search failed for ${keyword}`);
        }

        const payload = await response.json();
        return payload.results.map((item) => ({ ...item, matchedKeyword: keyword }));
      })
    );

    state.results = dedupeResults(batches.flat());
    updateStatus(`${state.results.length} live tenders mil gaye.`);
  } catch (error) {
    console.error(error);
    state.results = [];
    updateStatus("Tender data fetch nahi ho payi. Thodi der baad dubara try kijiye.");
  }

  renderAll();
}

function saveKeywords() {
  const keywords = uniqueTerms(elements.keywordInput.value);
  state.savedKeywords = keywords;
  persistStorage(STORAGE_KEYS.savedKeywords, keywords);
  renderStats();
  renderKeywordChips(keywords);
  updateStatus("Keywords save ho gaye.");
}

function loadSavedKeywords() {
  elements.keywordInput.value = state.savedKeywords.join(", ");
  renderKeywordChips(state.savedKeywords);
  updateStatus("Saved keywords load kar diye gaye.");
}

function renderAll() {
  renderStats();
  renderKeywordChips(state.searchTerms.length ? state.searchTerms : state.savedKeywords);
  renderResults();
  renderTracker();
  renderHistory();
}

function renderStats() {
  elements.savedKeywordCount.textContent = String(state.savedKeywords.length);
  elements.trackedBidCount.textContent = String(Object.keys(state.trackedBids).length);
  elements.resultCount.textContent = String(filteredResults().length);
}

function renderKeywordChips(keywords) {
  elements.keywordChips.innerHTML = "";
  keywords.forEach((keyword) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = keyword;
    elements.keywordChips.append(chip);
  });
}

function renderResults() {
  const rows = filteredResults();
  elements.resultsBody.innerHTML = "";

  if (!rows.length) {
    elements.resultsBody.innerHTML = '<tr><td colspan="6" class="empty-state">Is filter ke liye koi tender nahi mila.</td></tr>';
    renderStats();
    return;
  }

  rows.forEach((result) => {
    const tracked = Boolean(state.trackedBids[result.id]);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="chip">${escapeHtml(result.matchedKeyword || "-")}</span></td>
      <td>
        <p class="result-title">${escapeHtml(result.title)}</p>
        <p class="result-subtext">${escapeHtml(result.referenceNo)} | ${escapeHtml(result.tenderId)}</p>
      </td>
      <td>${escapeHtml(result.organisation)}</td>
      <td>${escapeHtml(result.closingDate)}</td>
      <td>${escapeHtml(result.openingDate)}</td>
      <td>
        <div class="action-stack">
          <button class="secondary-button" type="button" data-track-id="${escapeHtml(result.id)}">${tracked ? "Tracked" : "Add to Tracker"}</button>
          <a class="link-button" href="${result.detailsUrl}" target="_blank" rel="noreferrer">Open source</a>
        </div>
      </td>
    `;

    tr.querySelector("[data-track-id]").addEventListener("click", () => addTrackedBid(result));
    elements.resultsBody.append(tr);
  });

  renderStats();
}

function renderTracker() {
  const entries = filteredTrackedEntries();
  elements.trackerCards.innerHTML = "";

  if (!entries.length) {
    elements.trackerCards.innerHTML = '<article class="tracker-empty">Filter ke hisab se koi tracked bid nahi hai.</article>';
    renderStats();
    return;
  }

  entries.forEach((entry) => {
    const card = elements.trackerCardTemplate.content.firstElementChild.cloneNode(true);
    const stageSelect = card.querySelector(".stage-select");
    STAGES.forEach((stage) => {
      const option = document.createElement("option");
      option.value = stage;
      option.textContent = stage;
      stageSelect.append(option);
    });

    card.querySelector(".tracker-title").textContent = entry.title;
    card.querySelector(".tracker-meta").textContent = `${entry.referenceNo} | ${entry.organisation}`;
    stageSelect.value = entry.stage;
    card.querySelector(".priority-select").value = entry.priority;
    card.querySelector(".owner-input").value = entry.owner || "";
    card.querySelector(".due-date-input").value = entry.internalDueDate || "";
    card.querySelector(".notes-input").value = entry.notes || "";

    card.querySelector(".save-track").addEventListener("click", () => {
      updateTrackedBid(entry.id, {
        stage: stageSelect.value,
        priority: card.querySelector(".priority-select").value,
        owner: card.querySelector(".owner-input").value.trim(),
        internalDueDate: card.querySelector(".due-date-input").value,
        notes: card.querySelector(".notes-input").value.trim()
      });
    });

    card.querySelector(".delete-track").addEventListener("click", () => removeTrackedBid(entry.id));
    card.querySelector(".view-history").addEventListener("click", () => selectHistoryBid(entry.id));
    elements.trackerCards.append(card);
  });

  renderStats();
}

function renderHistory() {
  const entries = Object.values(state.trackedBids).sort(sortByLatestUpdate);
  elements.historyBidList.innerHTML = "";

  if (!entries.length) {
    elements.historyBidList.innerHTML = '<article class="tracker-empty">Track record dekhne ke liye pehle koi bid add kijiye.</article>';
    elements.historyLog.innerHTML = '<p class="empty-state">Kisi tracked bid ko select kijiye.</p>';
    return;
  }

  const selectedId = state.selectedHistoryBid && state.trackedBids[state.selectedHistoryBid] ? state.selectedHistoryBid : entries[0].id;
  state.selectedHistoryBid = selectedId;
  localStorage.setItem(STORAGE_KEYS.selectedHistoryBid, selectedId);

  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = entry.id === selectedId ? "active" : "";
    button.innerHTML = `<strong>${escapeHtml(entry.title)}</strong><br><small>${escapeHtml(entry.stage)} | ${escapeHtml(entry.referenceNo)}</small>`;
    button.addEventListener("click", () => selectHistoryBid(entry.id));
    elements.historyBidList.append(button);
  });

  const selected = state.trackedBids[selectedId];
  const history = [...selected.history].sort((a, b) => new Date(b.at) - new Date(a.at));

  elements.historyLog.innerHTML = `
    <h3>${escapeHtml(selected.title)}</h3>
    <p class="result-subtext">${escapeHtml(selected.referenceNo)} | ${escapeHtml(selected.organisation)}</p>
    ${history.map((item) => `
      <div class="timeline-item">
        <h4>${escapeHtml(item.label)}</h4>
        <p>${escapeHtml(item.detail)}</p>
        <small>${formatDateTime(item.at)}</small>
      </div>
    `).join("")}
  `;
}

function addTrackedBid(result) {
  if (state.trackedBids[result.id]) {
    selectHistoryBid(result.id);
    updateStatus("Yeh bid pehle se tracker mein hai.");
    renderAll();
    return;
  }

  state.trackedBids[result.id] = {
    ...result,
    stage: "Identified",
    priority: "Medium",
    owner: "",
    internalDueDate: "",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [{
      at: new Date().toISOString(),
      label: "Bid added",
      detail: "Bid ko tracker mein shortlist kiya gaya."
    }]
  };

  persistTracked();
  selectHistoryBid(result.id);
  updateStatus("Bid tracker mein add ho gayi.");
}

function updateTrackedBid(id, updates) {
  const record = state.trackedBids[id];
  if (!record) {
    return;
  }

  const changedFields = [];
  Object.entries(updates).forEach(([key, value]) => {
    if ((record[key] || "") !== value) {
      changedFields.push(`${humanizeKey(key)}: ${value || "-"}`);
    }
  });

  state.trackedBids[id] = { ...record, ...updates, updatedAt: new Date().toISOString() };
  if (changedFields.length) {
    state.trackedBids[id].history.push({
      at: new Date().toISOString(),
      label: "Bid updated",
      detail: changedFields.join(" | ")
    });
  }

  persistTracked();
  updateStatus("Bid update save ho gayi.");
}

function removeTrackedBid(id) {
  const title = state.trackedBids[id]?.title || "Bid";
  delete state.trackedBids[id];
  persistTracked();
  updateStatus(`${title} tracker se remove kar di gayi.`);
}

function selectHistoryBid(id) {
  state.selectedHistoryBid = id;
  localStorage.setItem(STORAGE_KEYS.selectedHistoryBid, id);
  renderHistory();
  document.querySelector("#history-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function filteredResults() {
  return state.results.filter((result) => {
    const trackedMatch = !elements.trackedOnly.checked || Boolean(state.trackedBids[result.id]);
    const days = daysUntil(result.closingDate);
    const closingMatch = !elements.closingSoonOnly.checked || (days >= 0 && days <= 14);
    return trackedMatch && closingMatch;
  });
}

function filteredTrackedEntries() {
  const stage = elements.stageFilter.value;
  const query = elements.trackerSearchInput.value.trim().toLowerCase();

  return Object.values(state.trackedBids)
    .filter((entry) => stage === "all" || entry.stage === stage)
    .filter((entry) => !query || `${entry.title} ${entry.referenceNo} ${entry.organisation}`.toLowerCase().includes(query))
    .sort(sortByLatestUpdate);
}

function exportResults() {
  const rows = filteredResults();
  if (!rows.length) {
    updateStatus("Export karne ke liye search results nahi hain.");
    return;
  }

  downloadCsv("tender-search-results.csv", rows.map((row) => ({
    Keyword: row.matchedKeyword,
    Title: row.title,
    ReferenceNo: row.referenceNo,
    TenderId: row.tenderId,
    Organisation: row.organisation,
    PublishedDate: row.publishedDate,
    ClosingDate: row.closingDate,
    OpeningDate: row.openingDate,
    DetailsUrl: row.detailsUrl
  })));
}

function exportTracker() {
  const rows = Object.values(state.trackedBids);
  if (!rows.length) {
    updateStatus("Export karne ke liye tracked bids nahi hain.");
    return;
  }

  downloadCsv("tracked-bids.csv", rows.map((row) => ({
    Title: row.title,
    ReferenceNo: row.referenceNo,
    TenderId: row.tenderId,
    Organisation: row.organisation,
    Stage: row.stage,
    Priority: row.priority,
    Owner: row.owner,
    InternalDueDate: row.internalDueDate,
    Notes: row.notes,
    ClosingDate: row.closingDate,
    DetailsUrl: row.detailsUrl,
    LastUpdated: formatDateTime(row.updatedAt)
  })));
}

function downloadBackupJson() {
  const blob = new Blob([JSON.stringify({
    exportedAt: new Date().toISOString(),
    trackedBids: state.trackedBids,
    savedKeywords: state.savedKeywords
  }, null, 2)], { type: "application/json" });

  downloadBlob("tender-pulse-backup.json", blob);
}

function persistTracked() {
  persistStorage(STORAGE_KEYS.trackedBids, state.trackedBids);
  renderAll();
}

function updateStatus(message) {
  elements.searchStatus.textContent = message;
}

function uniqueTerms(rawInput) {
  return [...new Set(rawInput.split(/[\n,]+/).map((item) => item.trim()).filter((item) => item.length >= 3))];
}

function dedupeResults(results) {
  const map = new Map();
  results.forEach((item) => {
    if (!map.has(item.id)) {
      map.set(item.id, item);
      return;
    }

    const existing = map.get(item.id);
    existing.matchedKeyword = [existing.matchedKeyword, item.matchedKeyword].filter(Boolean).join(", ");
  });

  return [...map.values()];
}

function downloadCsv(filename, rows) {
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
  downloadBlob(filename, new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

function persistStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function daysUntil(dateString) {
  const parsed = parseIndianDate(dateString);
  if (!parsed) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.round((parsed - new Date()) / (1000 * 60 * 60 * 24));
}

function parseIndianDate(value) {
  const match = String(value).match(/(\d{2})-([A-Za-z]{3})-(\d{4})(?: (\d{2}):(\d{2}) (AM|PM))?/);
  if (!match) {
    return null;
  }

  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(match[2]);
  let hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const meridiem = match[6];
  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  }
  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return new Date(Number(match[3]), monthIndex, Number(match[1]), hour, minute);
}

function sortByLatestUpdate(a, b) {
  return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function humanizeKey(key) {
  return {
    stage: "Stage",
    priority: "Priority",
    owner: "Owner",
    internalDueDate: "Internal due date",
    notes: "Notes"
  }[key] || key;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

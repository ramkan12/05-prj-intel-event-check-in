// ----- Intel Summit Check-In -----
// Core goal (you can change this)
const GOAL = 50;

// DOM refs
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const greeting = document.getElementById("greeting");
const totalEl = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");
const counts = {
  water: document.getElementById("waterCount"),
  zero: document.getElementById("zeroCount"),
  power: document.getElementById("powerCount"),
};

// Optional containers if present
const attendeeList = document.getElementById("attendeeList"); // may be null
const celebrationEl = document.getElementById("celebration"); // may be null

// Labels for display
const TEAM_LABELS = {
  water: "Team Water Wise",
  zero: "Team Net Zero",
  power: "Team Renewables",
};

// --- State (persisted) ---
const STORAGE_KEY = "intelSummitCheckin.v1";
let state = {
  total: 0,
  teams: { water: 0, zero: 0, power: 0 },
  attendees: [], // {name, team}
};

// Load persisted state
(function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}
  updateUI();
})();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// --- Helpers ---
function titleCase(str) {
  return str
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function percentOfGoal(total) {
  const pct = Math.min(100, Math.round((total / GOAL) * 100));
  return isFinite(pct) ? pct : 0;
}

function updateProgress(total) {
  const pct = percentOfGoal(total);
  progressBar.style.width = pct + "%";
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", String(GOAL));
  progressBar.setAttribute("aria-valuenow", String(total));
  progressBar.setAttribute("role", "progressbar");
  progressBar.title = `Progress: ${pct}%`;
}

function showGreeting(name, teamKey) {
  greeting.classList.remove("error-message");
  greeting.classList.add("success-message");
  greeting.style.display = "block";
  greeting.textContent = `Welcome, ${name}! You’re checked in for ${TEAM_LABELS[teamKey]}.`;
}

function renderCounts() {
  totalEl.textContent = state.total;
  counts.water.textContent = state.teams.water;
  counts.zero.textContent = state.teams.zero;
  counts.power.textContent = state.teams.power;
}

function renderAttendees() {
  if (!attendeeList) return;
  if (!state.attendees.length) {
    attendeeList.innerHTML = `<li class="muted">No attendees yet.</li>`;
    return;
  }
  attendeeList.innerHTML = state.attendees
    .map(
      (a) =>
        `<li><span class="attendee-name">${a.name}</span><span class="chip">${TEAM_LABELS[a.team]}</span></li>`
    )
    .join("");
}

function winnerTeamKey() {
  const entries = Object.entries(state.teams); // [key,count]
  const max = Math.max(...entries.map(([, v]) => v), 0);
  const top = entries.filter(([, v]) => v === max).map(([k]) => k);
  return { max, top }; // support ties
}

function maybeCelebrate() {
  if (!celebrationEl) return;
  if (state.total < GOAL) {
    celebrationEl.classList.add("hidden");
    return;
  }
  const { max, top } = winnerTeamKey();
  if (max === 0) return;
  const teams = top.map((k) => TEAM_LABELS[k]).join(" & ");
  celebrationEl.innerHTML = `🎉 Goal reached! ${teams} leading with <b>${max}</b> check-ins.`;
  celebrationEl.classList.remove("hidden");
}

function updateUI() {
  renderCounts();
  updateProgress(state.total);
  renderAttendees();
  maybeCelebrate();
}

// --- Form submit ---
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const rawName = nameInput.value;
  const teamKey = teamSelect.value;

  const name = titleCase(rawName || "");
  if (!name || !TEAM_LABELS[teamKey]) {
    greeting.style.display = "block";
    greeting.classList.remove("success-message");
    greeting.classList.add("error-message");
    greeting.textContent = "Please enter a name and select a team.";
    return;
  }

  // Update state
  state.total += 1;
  state.teams[teamKey] += 1;
  state.attendees.push({ name, team: teamKey });
  save();

  // Update UI
  showGreeting(name, teamKey);
  updateUI();

  // Reset form and focus name for next attendee
  form.reset();
  nameInput.focus();
});

// --- (Nice to have) Quick-fill via URL params ?attendeeName=Riham+Khan&team=water ---
(function quickFillFromQuery() {
  const params = new URLSearchParams(location.search);
  const n = params.get("attendeeName");
  const t = params.get("team");
  if (n) nameInput.value = n;
  if (t) teamSelect.value = t;
})();

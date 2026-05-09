const STORAGE_KEY = "habitos_data";

// --- State ---
let state = loadState();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { habits: [] };
  } catch {
    return { habits: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Date helpers ---
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// --- Streak logic ---
function computeStreak(habit) {
  if (!habit.completedDays || habit.completedDays.length === 0) return 0;
  const days = [...habit.completedDays].sort().reverse();
  const today = todayKey();
  const yesterday = yesterdayKey();

  // Streak starts only if completed today or yesterday
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + "T12:00:00");
    const curr = new Date(days[i] + "T12:00:00");
    const diff = Math.round((prev - curr) / 86400000);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// --- Habit CRUD ---
function addHabit(name, emoji) {
  state.habits.push({
    id: Date.now().toString(),
    name,
    emoji,
    completedDays: [],
    createdAt: todayKey(),
  });
  saveState();
  render();
}

function deleteHabit(id) {
  state.habits = state.habits.filter((h) => h.id !== id);
  saveState();
  render();
}

function toggleHabit(id) {
  const habit = state.habits.find((h) => h.id === id);
  if (!habit) return;
  const today = todayKey();
  const idx = habit.completedDays.indexOf(today);
  if (idx === -1) {
    habit.completedDays.push(today);
  } else {
    habit.completedDays.splice(idx, 1);
  }
  saveState();
  render();
}

// --- Render ---
function render() {
  const today = todayKey();
  const habits = state.habits;

  // Empty state
  document.getElementById("empty-state").style.display =
    habits.length === 0 ? "block" : "none";

  // Progress
  const progressSection = document.getElementById("progress-section");
  const statsSection = document.getElementById("stats-section");
  if (habits.length > 0) {
    progressSection.style.display = "block";
    statsSection.style.display = "block";
  } else {
    progressSection.style.display = "none";
    statsSection.style.display = "none";
  }

  const doneToday = habits.filter((h) => h.completedDays.includes(today)).length;
  const total = habits.length;
  const pct = total > 0 ? Math.round((doneToday / total) * 100) : 0;

  document.getElementById("progress-text").textContent = `${doneToday} / ${total} hoy`;
  document.getElementById("progress-pct").textContent = `${pct}%`;
  document.getElementById("progress-fill").style.width = pct + "%";

  // Habits list
  const list = document.getElementById("habits-list");
  list.innerHTML = "";

  habits.forEach((habit) => {
    const isDone = habit.completedDays.includes(today);
    const streak = computeStreak(habit);
    const streakText =
      streak === 0
        ? "Sin racha"
        : streak === 1
        ? "🔥 1 día seguido"
        : `🔥 ${streak} días seguidos`;
    const isHot = streak >= 3;

    const li = document.createElement("li");
    li.className = "habit-item" + (isDone ? " done" : "");
    li.innerHTML = `
      <input type="checkbox" class="habit-check" ${isDone ? "checked" : ""} data-id="${habit.id}" />
      <span class="habit-emoji">${habit.emoji}</span>
      <div class="habit-info">
        <div class="habit-name">${escapeHtml(habit.name)}</div>
        <div class="habit-streak${isHot ? " hot" : ""}">${streakText}</div>
      </div>
      <div class="habit-actions">
        <button data-delete="${habit.id}" title="Eliminar">✕</button>
      </div>
    `;
    list.appendChild(li);
  });

  // Stats
  renderStats(habits, today);
}

function renderStats(habits, today) {
  const grid = document.getElementById("stats-grid");
  const total = habits.length;
  const doneToday = habits.filter((h) => h.completedDays.includes(today)).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, computeStreak(h)), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDays.length, 0);

  grid.innerHTML = [
    { value: total, label: "Hábitos totales" },
    { value: doneToday, label: "Completados hoy" },
    { value: bestStreak, label: "Mejor racha actual" },
    { value: totalCompletions, label: "Completaciones totales" },
  ]
    .map(
      ({ value, label }) => `
    <div class="stat-card">
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `
    )
    .join("");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Event listeners ---
document.getElementById("add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("habit-input");
  const emoji = document.getElementById("habit-emoji").value;
  const name = input.value.trim();
  if (!name) return;
  addHabit(name, emoji);
  input.value = "";
  input.focus();
});

document.getElementById("habits-list").addEventListener("change", (e) => {
  if (e.target.classList.contains("habit-check")) {
    toggleHabit(e.target.dataset.id);
  }
});

document.getElementById("habits-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-delete]");
  if (btn) {
    deleteHabit(btn.dataset.delete);
  }
});

// --- Init ---
document.getElementById("date-display").textContent = formatDate(todayKey());
render();

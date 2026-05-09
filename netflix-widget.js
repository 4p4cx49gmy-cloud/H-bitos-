(() => {
  // Evita duplicados
  if (document.getElementById("habitos-widget")) {
    document.getElementById("habitos-widget").remove();
    return;
  }

  /* ── Lógica de datos (mismo localStorage que la app) ── */
  const KEY = "habitos_data";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { habits: [] }; } catch { return { habits: [] }; } };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  let state = load();

  const todayKey = () => new Date().toISOString().slice(0, 10);
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); };

  function streak(habit) {
    if (!habit.completedDays?.length) return 0;
    const days = [...habit.completedDays].sort().reverse();
    if (days[0] !== todayKey() && days[0] !== yesterdayKey()) return 0;
    let s = 1;
    for (let i = 1; i < days.length; i++) {
      const a = new Date(days[i-1]+"T12:00:00"), b = new Date(days[i]+"T12:00:00");
      if (Math.round((a-b)/86400000) === 1) s++; else break;
    }
    return s;
  }

  /* ── Estilos ── */
  const style = document.createElement("style");
  style.textContent = `
    #habitos-widget {
      position: fixed; top: 70px; right: 16px; z-index: 99999;
      width: 280px; font-family: "Netflix Sans", "Helvetica Neue", sans-serif;
      background: #141414; border: 1px solid #333; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.8); color: #e5e5e5;
      transition: all .25s ease; user-select: none;
    }
    #habitos-widget.minimized { width: 46px; height: 46px; overflow: hidden; border-radius: 50%; }
    #hw-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px 8px; border-bottom: 1px solid #2a2a2a; cursor: pointer;
    }
    #hw-title { font-size: .95rem; font-weight: 700; color: #e50914; letter-spacing: -.3px; }
    #hw-toggle {
      background: none; border: none; color: #999; font-size: 1rem; cursor: pointer;
      line-height: 1; padding: 0;
    }
    #hw-body { padding: 10px 14px 14px; }
    #hw-progress-track {
      background: #2a2a2a; border-radius: 99px; height: 5px; margin-bottom: 12px; overflow: hidden;
    }
    #hw-progress-fill { height: 100%; background: #e50914; border-radius: 99px; transition: width .4s; width: 0%; }
    #hw-form { display: flex; gap: 6px; margin-bottom: 10px; }
    #hw-input {
      flex: 1; background: #222; border: 1px solid #444; border-radius: 8px; color: #e5e5e5;
      font-size: .82rem; padding: 7px 10px; outline: none;
    }
    #hw-input:focus { border-color: #e50914; }
    #hw-input::placeholder { color: #666; }
    #hw-add {
      background: #e50914; border: none; border-radius: 8px; color: #fff;
      cursor: pointer; font-size: .8rem; font-weight: 700; padding: 7px 10px;
    }
    #hw-list { list-style: none; display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
    #hw-list::-webkit-scrollbar { width: 4px; }
    #hw-list::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
    .hw-item {
      background: #1f1f1f; border: 1px solid #2e2e2e; border-radius: 9px;
      display: flex; align-items: center; gap: 8px; padding: 8px 10px;
    }
    .hw-item.done { border-color: #46d369; }
    .hw-cb {
      appearance: none; -webkit-appearance: none; width: 18px; height: 18px;
      border: 2px solid #444; border-radius: 50%; cursor: pointer; flex-shrink: 0;
      position: relative; transition: background .2s, border-color .2s;
    }
    .hw-cb:checked { background: #46d369; border-color: #46d369; }
    .hw-cb:checked::after {
      content: "✓"; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      color: #000; font-size: 10px; font-weight: 900;
    }
    .hw-emoji { font-size: 1rem; }
    .hw-info { flex: 1; min-width: 0; }
    .hw-name { font-size: .82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hw-item.done .hw-name { text-decoration: line-through; color: #555; }
    .hw-streak { font-size: .7rem; color: #666; }
    .hw-streak.hot { color: #ffb347; }
    .hw-del {
      background: none; border: none; color: #555; cursor: pointer; font-size: .75rem;
      padding: 2px 4px; border-radius: 4px;
    }
    .hw-del:hover { color: #e50914; }
    #hw-empty { text-align: center; color: #555; font-size: .82rem; padding: 16px 0; }
    #hw-stats { display: flex; justify-content: space-around; margin-top: 12px; border-top: 1px solid #2a2a2a; padding-top: 10px; }
    .hw-stat { text-align: center; }
    .hw-stat-val { font-size: 1.1rem; font-weight: 800; color: #e50914; }
    .hw-stat-lbl { font-size: .65rem; color: #666; }
  `;
  document.head.appendChild(style);

  /* ── HTML del widget ── */
  const widget = document.createElement("div");
  widget.id = "habitos-widget";
  widget.innerHTML = `
    <div id="hw-header">
      <span id="hw-title">H-bitos 🎯</span>
      <button id="hw-toggle" title="Minimizar">−</button>
    </div>
    <div id="hw-body">
      <div id="hw-progress-track"><div id="hw-progress-fill"></div></div>
      <form id="hw-form">
        <input id="hw-input" placeholder="Nuevo hábito…" maxlength="40" autocomplete="off" />
        <button id="hw-add" type="submit">+</button>
      </form>
      <ul id="hw-list"></ul>
      <div id="hw-empty" style="display:none">Sin hábitos todavía</div>
      <div id="hw-stats"></div>
    </div>
  `;
  document.body.appendChild(widget);

  /* ── Render ── */
  function render() {
    const today = todayKey();
    const habits = state.habits;
    const list = document.getElementById("hw-list");
    const empty = document.getElementById("hw-empty");
    const stats = document.getElementById("hw-stats");
    const fill = document.getElementById("hw-progress-fill");

    const done = habits.filter(h => h.completedDays.includes(today)).length;
    const pct = habits.length ? Math.round(done / habits.length * 100) : 0;
    fill.style.width = pct + "%";

    list.innerHTML = "";
    empty.style.display = habits.length ? "none" : "block";

    habits.forEach(h => {
      const isDone = h.completedDays.includes(today);
      const s = streak(h);
      const hot = s >= 3;
      const li = document.createElement("li");
      li.className = "hw-item" + (isDone ? " done" : "");
      li.innerHTML = `
        <input type="checkbox" class="hw-cb" ${isDone ? "checked" : ""} data-id="${h.id}" />
        <span class="hw-emoji">${h.emoji}</span>
        <div class="hw-info">
          <div class="hw-name">${esc(h.name)}</div>
          <div class="hw-streak${hot ? " hot" : ""}">${s ? "🔥 "+s+"d" : "—"}</div>
        </div>
        <button class="hw-del" data-del="${h.id}">✕</button>
      `;
      list.appendChild(li);
    });

    const best = habits.reduce((m, h) => Math.max(m, streak(h)), 0);
    stats.innerHTML = habits.length ? `
      <div class="hw-stat"><div class="hw-stat-val">${done}/${habits.length}</div><div class="hw-stat-lbl">Hoy</div></div>
      <div class="hw-stat"><div class="hw-stat-val">${pct}%</div><div class="hw-stat-lbl">Progreso</div></div>
      <div class="hw-stat"><div class="hw-stat-val">${best}</div><div class="hw-stat-lbl">🔥 Mejor</div></div>
    ` : "";
  }

  function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  /* ── Eventos ── */
  let minimized = false;
  document.getElementById("hw-header").addEventListener("click", () => {
    minimized = !minimized;
    widget.classList.toggle("minimized", minimized);
    document.getElementById("hw-toggle").textContent = minimized ? "+" : "−";
  });

  // Evita que el click en el botón toggle propague al header dos veces
  document.getElementById("hw-toggle").addEventListener("click", e => e.stopPropagation());

  document.getElementById("hw-form").addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("hw-input");
    const name = input.value.trim();
    if (!name) return;
    const emojis = ["✅","💪","📚","🏃","🧘","💧","🍎","😴","🎯","🌱"];
    state.habits.push({ id: Date.now().toString(), name, emoji: emojis[Math.floor(Math.random()*emojis.length)], completedDays: [], createdAt: todayKey() });
    save(state);
    input.value = "";
    render();
  });

  document.getElementById("hw-list").addEventListener("change", e => {
    if (!e.target.classList.contains("hw-cb")) return;
    const h = state.habits.find(x => x.id === e.target.dataset.id);
    if (!h) return;
    const today = todayKey();
    const idx = h.completedDays.indexOf(today);
    idx === -1 ? h.completedDays.push(today) : h.completedDays.splice(idx, 1);
    save(state); render();
  });

  document.getElementById("hw-list").addEventListener("click", e => {
    const btn = e.target.closest("[data-del]");
    if (!btn) return;
    state.habits = state.habits.filter(h => h.id !== btn.dataset.del);
    save(state); render();
  });

  render();
  console.log("✅ H-bitos cargado. Vuelve a pegar el script para cerrarlo.");
})();

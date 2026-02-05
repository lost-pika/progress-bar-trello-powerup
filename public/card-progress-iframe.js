const t = TrelloPowerUp.iframe();

let state = {
  progress: 0,
  elapsed: 0,
  estimated: 8 * 3600,
  running: false,
  startTime: null,
  focusMode: false,
};

let timer = null;

function format(s) {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

window.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "PROGRESS_UPDATED") {
    state.progress = event.data.progress;
    render();
  }
});

async function load() {
  const card = (await t.get("card", "shared")) || {};
  state.progress = card.progress || 0;
  state.elapsed = card.elapsed || 0;
  state.estimated = card.estimated || 8 * 3600;
  state.running = card.running || false;
  state.startTime = card.startTime || null;
  state.focusMode = card.focusMode || false;

  render();
  if (state.running) startTick();
  setTimeout(() => t.sizeTo(document.body).done(), 40);
}

load().then(() => {
  t.get("board", "shared", "autoTrackMode").then(async (mode) => {
    const card = await t.get("card", "shared");
    if (
      (mode === "open" || mode === "both") &&
      card?.estimated > 0 &&
      !state.running
    ) {
      state.running = true;
      state.startTime = Date.now();
      state.elapsed = card?.elapsed || 0;
      startTick();
      save();

      t.get("board", "shared", "autoFocus").then((f) => {
        if (f) {
          state.focusMode = true;
          t.set("card", "shared", "focusMode", true);
        }
      });

      render();
    }
  });
});

function save() {
  t.set("card", "shared", state);
}

function startTick() {
  if (timer) return;
  timer = setInterval(() => {
    if (state.running) {
      const now = Date.now();
      const live =
        state.elapsed + Math.floor((now - state.startTime) / 1000);
      const el = document.getElementById("elapsed");
      if (el) el.textContent = format(live);
    }
  }, 1000);
}

function toggleTimer() {
  if (state.running) {
    const now = Date.now();
    state.elapsed += Math.floor((now - state.startTime) / 1000);
    state.running = false;
    state.startTime = null;

    state.focusMode = false;
    t.set("card", "shared", "focusMode", false);
  } else {
    state.running = true;
    state.startTime = Date.now();
    startTick();

    t.get("board", "shared", "autoFocus").then((f) => {
      if (f) {
        state.focusMode = true;
        t.set("card", "shared", "focusMode", true);
      }
    });
  }
  save();
  render();
}

function resetTimer() {
  state.elapsed = 0;
  state.running = false;
  state.startTime = null;

  state.focusMode = false;
  t.set("card", "shared", "focusMode", false);

  save();
  render();
}

function render() {
  const live = state.running
    ? state.elapsed + Math.floor((Date.now() - state.startTime) / 1000)
    : state.elapsed;
  const behind = live > state.estimated;

  const iconReset = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;

  document.getElementById("root").innerHTML = `
    <div class="compact-container">
      <div class="time-panel">
        <div class="stats-row">
          <div class="stat-group">
            <span class="label">Elapsed</span>
            <div id="elapsed" class="elapsed-time">${format(live)}</div>
          </div>
          <div class="stat-group" style="align-items: flex-end;">
            <span class="label">Estimate</span>
            <input id="estimatedInput" class="estimated-input" value="${format(state.estimated)}" />
          </div>
        </div>

        ${behind ? `<div class="status-warning">⚠ Overtime</div>` : ""}

        <div class="controls-row">
          <button id="trackToggle" class="btn-toggle ${state.running ? "active" : ""}">
            <div class="toggle-switch"></div>
            <span>${state.running ? "STOP TRACKING" : "START TRACKING"}</span>
          </button>
          <button id="resetBtn" class="btn-reset" title="Reset">
            ${iconReset}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("resetBtn").onclick = resetTimer;
  document.getElementById("trackToggle").onclick = toggleTimer;

  const estInput = document.getElementById("estimatedInput");
  estInput.onchange = (e) => {
    const val = e.target.value.trim();
    const parts = val.split(":").map(Number);
    let h = 0,
      m = 0,
      s = 0;
    if (parts.length === 3) [h, m, s] = parts;
    else if (parts.length === 2) {
      m = parts[0];
      s = parts[1];
    } else if (parts.length === 1) {
      s = parts[0];
    }
    const total = h * 3600 + m * 60 + s;
    if (!isNaN(total) && total > 0) {
      state.estimated = total;
      save();
      render();
    } else {
      e.target.value = format(state.estimated);
    }
  };
}

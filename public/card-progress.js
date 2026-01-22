const t = TrelloPowerUp.iframe();

let state = {
  progress: 0,
  elapsed: 0,
  estimated: 8 * 3600,
  running: false,
  startTime: null,
  auto: false,
  hideProgressBars: false,
};

let timer = null;

function format(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

async function load() {
  const card = (await t.get("card", "shared")) || {};
  const hideBars = await t.get("board", "shared", "hideProgressBars");

  state.elapsed = card.elapsed || 0;
  state.estimated = card.estimated || 8 * 3600;
  state.running = card.running || false;
  state.startTime = card.startTime || null;
  state.hideProgressBars = hideBars || false;

  // 🔥 NEW — sync progress with checklist
  state.progress = await computeProgressFromChecklists(t);

  render();
  if (state.running) startTick();

  setTimeout(() => t.sizeTo(document.body).done(), 40);
}

function save() {
  t.set("card", "shared", state);
}

function startTick() {
  if (timer) return;

  timer = setInterval(() => {
    if (state.running) {
      const live =
        state.elapsed + Math.floor((Date.now() - state.startTime) / 1000);
      document.getElementById("elapsed").textContent = format(live);
    }
  }, 1000);
}

function toggleTimer() {
  if (state.running) {
    state.elapsed += Math.floor((Date.now() - state.startTime) / 1000);
    state.running = false;
    state.startTime = null;
  } else {
    state.running = true;
    state.startTime = Date.now();
    startTick();
  }

  save();
  render();
}

function resetTimer() {
  state.elapsed = 0;
  state.running = false;
  state.startTime = null;
  save();
  render();
}

function render() {
  const live = state.running
    ? state.elapsed + Math.floor((Date.now() - state.startTime) / 1000)
    : state.elapsed;

  const behind = live > state.estimated;

  const progressSection = state.hideProgressBars
    ? ""
    : `
      <div class="progress-section">
        <div class="bar-bg">
          <div class="bar-fill" style="width:${state.progress}%"></div>
        </div>
        <div class="manual-progress">Progress: ${state.progress}%</div>
      </div>
    `;

  document.getElementById("root").innerHTML = `
    <div class="container">
      <div class="header">
        <div class="title">⚡ Progress</div>
        <div class="percent">${state.progress}%</div>
      </div>

      ${progressSection}

      <div class="time-box">
        <div class="time-row">
          <div>
            <div style="opacity:.6;font-size:12px">Elapsed</div>
            <div id="elapsed" class="elapsed">${format(live)}</div>
          </div>

          <div>
            <div style="opacity:.6;font-size:12px;text-align:right;">Estimated</div>
            <div class="estimated">${format(state.estimated)}</div>
          </div>
        </div>

        ${behind ? `<div class="status-warning">⚠ Behind schedule</div>` : ""}

        <button id="trackBtn" class="track-btn">
          ${state.running ? "⏸ Stop Tracking" : "▶ Start Tracking"}
        </button>

        <button id="resetBtn" class="reset-btn">Reset</button>

        <div class="auto-row">
          <span>Enable automatic tracking</span>
          <label class="toggle">
            <input type="checkbox" id="autoToggle" ${state.auto ? "checked" : ""}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;

  document.getElementById("trackBtn").onclick = toggleTimer;
  document.getElementById("resetBtn").onclick = resetTimer;
  document.getElementById("autoToggle").onchange = (e) => {
    state.auto = e.target.checked;
    save();
  };

  // 🔥 Sync checklist progress on every render
  computeProgressFromChecklists(t).then((pct) => {
    if (pct !== state.progress) {
      state.progress = pct;
      render();
    }
  });
}

load();

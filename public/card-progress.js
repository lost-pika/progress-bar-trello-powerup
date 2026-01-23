const t = TrelloPowerUp.iframe();

/* ----------------------------------------
   STATE
---------------------------------------- */
let state = {
  progress: 0,
  elapsed: 0,
  estimated: 8 * 3600,
  running: false,
  startTime: null,
  hideProgressBars: false,
};

let timer = null;

/* ----------------------------------------
   HELPERS
---------------------------------------- */
function format(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

async function computeProgress() {
  const card = await t.card("checklists");

  let total = 0;
  let done = 0;

  card.checklists.forEach((cl) => {
    cl.checkItems.forEach((item) => {
      total++;
      if (item.state === "complete") done++;
    });
  });

  if (total === 0) return 0;

  return Math.round((done / total) * 100);
}

function save() {
  return t.set("card", "shared", state);
}

/* ----------------------------------------
   LOAD
---------------------------------------- */
async function load() {
  const card = (await t.get("card", "shared")) || {};
  const hideBars = await t.get("board", "shared", "hideProgressBars");

  state.elapsed = card.elapsed || 0;
  state.estimated = card.estimated || 8 * 3600;
  state.running = card.running || false;
  state.startTime = card.startTime || null;
  state.hideProgressBars = hideBars || false;

  // Always sync progress with checklist
  state.progress = await computeProgress();
  await save();
  t.refresh(); // 🔥 forces card-badges to re-render immediately
  render();

  if (state.running) startTick();

  setTimeout(() => t.sizeTo(document.body).done(), 40);
}

/* ----------------------------------------
   TIMER
---------------------------------------- */
function startTick() {
  if (timer) return;

  timer = setInterval(() => {
    if (!state.running) return;

    const live =
      state.elapsed + Math.floor((Date.now() - state.startTime) / 1000);

    const el = document.getElementById("elapsed");
    if (el) el.textContent = format(live);
  }, 1000);
}

function toggleTimer() {
  if (state.running) {
    // STOP
    const now = Date.now();
    state.elapsed += Math.floor((now - state.startTime) / 1000);
    state.running = false;
    state.startTime = null;

    // REMOVE focusMode on stop
    t.set("card", "shared", "focusMode", false).then(() => t.refresh());

  } else {
    // START
    state.running = true;
    state.startTime = Date.now();
    startTick();

    // auto focus mode
    t.get("board", "shared", "autoFocus").then((f) => {
      if (f) t.set("card", "shared", "focusMode", true);
    });

    t.refresh(); // update badges immediately
  }

  save();
  render();
}

function resetTimer() {
  state.elapsed = 0;
  state.running = false;
  state.startTime = null;

  // also remove focus
t.set("card", "shared", "focusMode", false).then(() => t.refresh());


  save();
  render();
}

/* ----------------------------------------
   RENDER
---------------------------------------- */
function render() {
  const live = state.running
    ? state.elapsed + Math.floor((Date.now() - state.startTime) / 1000)
    : state.elapsed;

  const behind = live > state.estimated;

  document.getElementById("root").innerHTML = `
    <div class="container">

      <div class="header">
        <div class="title">⚡ Progress</div>
        <div class="percent">${state.progress}%</div>
      </div>

      <div class="progress-section ${state.hideProgressBars ? "hidden" : ""}">
        <div class="bar-bg">
          <div class="bar-fill" style="width:${state.progress}%"></div>
        </div>
        <div class="manual-progress">Progress: ${state.progress}%</div>
      </div>

      <div class="time-box">
        <div class="time-row">
          <div>
            <div style="opacity:.6;font-size:12px">Elapsed</div>
            <div id="elapsed" class="elapsed">${format(live)}</div>
          </div>

          <div>
            <div style="opacity:.6;font-size:12px;text-align:right;">Estimated</div>
            <input id="estimatedInput"
              class="estimated"
              value="${format(state.estimated)}"
              style="
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 6px;
                padding: 4px 6px;
                font-size: 15px;
                width: 90px;
                color: #fff;
                text-align: center;">
          </div>
        </div>

        ${behind ? `<div class="status-warning">⚠ Behind schedule</div>` : ""}

        <button id="trackBtn" class="track-btn">
          ${state.running ? "⏸ Stop Tracking" : "▶ Start Tracking"}
        </button>

        <button id="resetBtn" class="reset-btn">Reset</button>
      </div>

    </div>
  `;

  document.getElementById("trackBtn").onclick = toggleTimer;
  document.getElementById("resetBtn").onclick = resetTimer;

  document.getElementById("estimatedInput").onchange = (e) => {
    const parts = e.target.value.split(":").map(Number);

    let h = 0,
      m = 0,
      s = 0;
    if (parts.length === 3) [h, m, s] = parts;
    else if (parts.length === 2) {
      m = parts[0];
      s = parts[1];
    } else if (parts.length === 1) s = parts[0];

    const total = h * 3600 + m * 60 + s;

    if (isNaN(total) || total <= 0) {
      e.target.value = format(state.estimated);
      return;
    }

    state.estimated = total;
    save();
    render();
  };
}

/* ----------------------------------------
   AUTO REFRESH OF PROGRESS ON CHECKLIST CHANGE
---------------------------------------- */
t.render(async function () {
  const pct = await computeProgress();

  if (pct !== state.progress) {
    state.progress = pct;

    await save(); // ← required!
    t.refresh(); // ← force Trello to re-render badges

    render();
  }
});

/* INIT */
load();

// Prevent timer stop when card is closed
window.addEventListener("beforeunload", () => {
  if (running) {
    const now = Date.now();
    elapsed += Math.floor((now - startTime) / 1000);
    startTime = Date.now();
    saveCard();
  }
});


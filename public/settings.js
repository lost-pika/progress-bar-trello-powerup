const t = TrelloPowerUp.iframe();

/* INTERNAL STATE */
let elapsed = 0;
let estimated = 8 * 3600;
let running = false;
let startTime = null;
let auto = false;
let interval = null;

function format(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

(async function load() {
  const card = (await t.get("card", "shared")) || {};
  const board = (await t.get("board", "shared")) || {};

  elapsed = card.elapsed || 0;
  estimated = card.estimated || 8 * 3600;
  running = card.running || false;
  startTime = card.startTime || null;
  auto = card.auto || false;

  document.getElementById("elapsed").textContent = format(elapsed);
  document.getElementById("trackerElapsed").textContent = format(elapsed);
  document.getElementById("estimatedDisplay").textContent = format(estimated) + " ✏️";
  document.getElementById("autoTrack").checked = auto;

  // BOARD SETTINGS
  document.getElementById("hideBadges").checked = board.hideBadges || false;
  document.getElementById("hideDetail").checked = board.hideDetailBadges || false;
  document.getElementById("hideBars").checked = board.hideProgressBars || false;
  document.getElementById("focusMode").checked = board.autoFocus || false;
  document.getElementById("autoTrackMode").value = board.autoTrackMode || "off";

  if (running) startTick();

  setTimeout(() => t.sizeTo(document.body).done(), 80);
})();

/* SAVE FUNCTIONS */
function saveCard() {
  return t.set("card", "shared", { elapsed, estimated, running, startTime, auto });
}
function saveBoard(key, val) {
  return t.set("board", "shared", key, val);
}

/* TIMER */
function startTick() {
  if (interval) return;
  interval = setInterval(() => {
    if (running) {
      const now = Date.now();
      const live = elapsed + Math.floor((now - startTime) / 1000);
      document.getElementById("elapsed").textContent = format(live);
      document.getElementById("trackerElapsed").textContent = format(live);
    }
  }, 1000);
}

/* COLLAPSIBLE */
document.getElementById("trackerHeader").onclick = () => {
  const box = document.getElementById("trackerBox");
  const arrow = document.getElementById("arrow");

  const open = box.style.display === "block";
  box.style.display = open ? "none" : "block";
  arrow.textContent = open ? "⯈" : "⯆";

  setTimeout(() => t.sizeTo(document.body).done(), 80);
};

/* TRACK BUTTON */
document.getElementById("trackBtn").onclick = () => {
  if (running) {
    const now = Date.now();
    elapsed += Math.floor((now - startTime) / 1000);
    running = false;
    startTime = null;
    t.set("card", "shared", "focusMode", false);
  } else {
    running = true;
    startTime = Date.now();
    startTick();

    t.get("board", "shared", "autoFocus").then((enabled) => {
      if (enabled) t.set("card", "shared", "focusMode", true);
    });
  }

  saveCard();
  document.getElementById("trackBtn").textContent = running
    ? "⏸ Stop Tracking"
    : "▶ Start Tracking";
};

/* RESET BUTTON */
document.getElementById("resetBtn").onclick = () => {
  elapsed = 0;
  running = false;
  startTime = null;

  saveCard();

  document.getElementById("elapsed").textContent = "00:00:00";
  document.getElementById("trackerElapsed").textContent = "00:00:00";
  document.getElementById("trackBtn").textContent = "▶ Start Tracking";
};

/* EDIT ESTIMATED TIME */
document.getElementById("estimatedDisplay").onclick = () => {
  const inp = document.getElementById("estimatedInput");
  const disp = document.getElementById("estimatedDisplay");

  disp.style.display = "none";
  inp.style.display = "block";
  inp.value = format(estimated);
  inp.focus();
};

document.getElementById("estimatedInput").onblur = () => {
  const inp = document.getElementById("estimatedInput");
  const disp = document.getElementById("estimatedDisplay");
  const [h, m, s] = inp.value.split(":").map(Number);

  estimated = (h * 3600) + (m * 60) + (s || 0);
  saveCard();

  disp.textContent = inp.value + " ✏️";
  disp.style.display = "block";
  inp.style.display = "none";
};

/* BOARD TOGGLES */
document.getElementById("hideBadges").onchange = (e) =>
  saveBoard("hideBadges", e.target.checked);

document.getElementById("hideDetail").onchange = (e) =>
  saveBoard("hideDetailBadges", e.target.checked);

document.getElementById("hideBars").onchange = (e) =>
  saveBoard("hideProgressBars", e.target.checked);

document.getElementById("focusMode").onchange = (e) =>
  saveBoard("autoFocus", e.target.checked);

/* AUTO TRACK MODE */
document.getElementById("autoTrackMode").onchange = async (e) => {
  const mode = e.target.value;

  await saveBoard("autoTrackMode", mode);

  if (mode === "list" || mode === "both") {
    t.popup({
      title: "Select Lists",
      url: "./auto-track-lists.html",
      height: 350
    });
  }
};

/* AUTO TRACK PER CARD */
document.getElementById("autoTrack").onchange = (e) => {
  auto = e.target.checked;
  saveCard();
};

/* REMOVE POWER-UP */
document.getElementById("removeBtn").onclick = async () => {
  const ok = confirm("Remove and clear all saved data?");
  if (!ok) return;

  // 1️⃣ CLEAR BOARD DATA
  const board = (await t.get("board", "shared")) || {};
  for (const key of Object.keys(board)) {
    await t.remove("board", "shared", key);
  }

  // 2️⃣ CLEAR CARD DATA
  const card = (await t.get("card", "shared")) || {};
  for (const key of Object.keys(card)) {
    await t.remove("card", "shared", key);
  }

  // 3️⃣ CLEAR MEMBER DATA
  const mem = (await t.get("member", "private")) || {};
  for (const key of Object.keys(mem)) {
    await t.remove("member", "private", key);
  }

  // 4️⃣ MARK POWER-UP AS DISABLED
  await t.set("board", "shared", "disabled", true);

  alert("Power-Up removed. Now UI will disappear.");
  t.closePopup();
};


const t = TrelloPowerUp.iframe();

let elapsed = 0;
let estimated = 8 * 3600;
let running = false;
let startTime = null;
let auto = false;

let interval = null;

/* Format HH:MM:SS */
function format(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* Load everything */
(async function load() {
  const board = await t.get("board", "shared") || {};
  const card = await t.get("card", "shared") || {};

  elapsed = card.elapsed || 0;
  estimated = card.estimated || 8 * 3600;
  running = card.running || false;
  startTime = card.startTime || null;
  auto = card.auto || false;

  document.getElementById("elapsedLabel").textContent = format(elapsed);
  document.getElementById("trackerElapsed").textContent = format(elapsed);
  document.getElementById("estimatedDisplay").textContent = format(estimated) + " ✏️";

  document.getElementById("autoTrack").checked = auto;
  document.getElementById("hideBadges").checked = board.hideBadges || false;
  document.getElementById("hideDetail").checked = board.hideDetailBadges || false;
  document.getElementById("hideBars").checked = board.hideProgressBars || false;
  document.getElementById("focusMode").checked = board.autoFocus || false;
  document.getElementById("autoTrackMode").value = board.autoTrackMode || "off";

  if (running) startTick();

  setTimeout(() => t.sizeTo(document.body).done(), 50);
})();

/* Save card state */
function saveCard() {
  t.set("card", "shared", { elapsed, estimated, running, startTime, auto });
}

/* Save board settings */
function saveBoard(key, value) {
  t.set("board", "shared", key, value)
    .then(() => t.refresh());
}

/* Timer tick */
function startTick() {
  if (interval) return;

  interval = setInterval(() => {
    if (running) {
      const now = Date.now();
      const live = elapsed + Math.floor((now - startTime) / 1000);
      document.getElementById("elapsedLabel").textContent = format(live);
      document.getElementById("trackerElapsed").textContent = format(live);
    }
  }, 1000);
}

/* Toggle Timer */
document.getElementById("trackBtn").onclick = () => {
  if (running) {
    elapsed += Math.floor((Date.now() - startTime) / 1000);
    running = false;
    startTime = null;
  } else {
    running = true;
    startTime = Date.now();
    startTick();

    t.get("board", "shared", "autoFocus").then(f => {
      if (f) t.set("card", "shared", "focusMode", true);
    });
  }

  saveCard();
  document.getElementById("trackBtn").textContent =
    running ? "⏸ Stop Tracking" : "▶ Start Tracking";
};

/* Reset Timer */
document.getElementById("resetBtn").onclick = () => {
  elapsed = 0;
  running = false;
  startTime = null;
  saveCard();

  document.getElementById("elapsedLabel").textContent = "00:00:00";
  document.getElementById("trackerElapsed").textContent = "00:00:00";
};

/* Collapsible Time Tracker */
document.getElementById("trackerHeader").onclick = () => {
  const box = document.getElementById("trackerBox");
  const arrow = document.getElementById("arrow");

  if (box.style.display === "none") {
    box.style.display = "block";
    arrow.textContent = "⯆";
  } else {
    box.style.display = "none";
    arrow.textContent = "⯈";
  }

  setTimeout(() => t.sizeTo(document.body).done(), 40);
};

/* Edit Estimated */
document.getElementById("estimatedDisplay").onclick = () => {
  document.getElementById("estimatedDisplay").style.display = "none";
  const input = document.getElementById("estimatedInput");

  input.style.display = "block";
  input.value = format(estimated);
  input.focus();
};

document.getElementById("estimatedInput").onblur = () => {
  const raw = document.getElementById("estimatedInput").value.trim();
  const [h, m, s] = raw.split(":").map(Number);
  estimated = h * 3600 + m * 60 + s;

  saveCard();

  document.getElementById("estimatedDisplay").textContent = raw + " ✏️";
  document.getElementById("estimatedDisplay").style.display = "block";
  document.getElementById("estimatedInput").style.display = "none";
};

/* Board Toggle Settings */
document.getElementById("hideBadges").onchange = e => saveBoard("hideBadges", e.target.checked);
document.getElementById("hideDetail").onchange = e => saveBoard("hideDetailBadges", e.target.checked);
document.getElementById("hideBars").onchange = e => saveBoard("hideProgressBars", e.target.checked);
document.getElementById("focusMode").onchange = e => saveBoard("autoFocus", e.target.checked);

/* Auto Tracking Mode */
document.getElementById("autoTrackMode").onchange = e => {
  const mode = e.target.value;
  saveBoard("autoTrackMode", mode).then(() => {
    if (mode === "list" || mode === "both") {
      t.popup({
        title: "Select Lists",
        url: "./auto-track-lists.html",
        height: 360
      });
    }
  });
};

/* Auto per-card toggle */
document.getElementById("autoTrack").onchange = e => {
  auto = e.target.checked;
  saveCard();
};

/* Remove Power-Up */
document.getElementById("removeBtn").onclick = async () => {
  if (!confirm("Remove this power-up and delete all stored data?")) return;

  await t.set("board", "shared", null);
  await t.set("card", "shared", null);
  await t.set("member", "private", null);
  await t.remove("member", "private", "authorized");

  t.closePopup();
};

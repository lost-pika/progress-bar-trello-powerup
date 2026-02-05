/* global TrelloPowerUp */
const t = TrelloPowerUp.iframe();

const DEFAULTS = {
  hideBadges: false,
  hideTimerBadges: false,
  hideDetailBadges: false,
  hideProgressBars: false,
  autoFocus: false,
  autoTrackMode: "off",
};

function qs(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

async function getBoardShared() {
  const all = await t.getAll(); // bulk read [web:45]
  return all?.board?.shared || {};
}

async function loadUI() {
  const board = await getBoardShared();

  qs("hideBadges").checked = board.hideBadges ?? DEFAULTS.hideBadges;
  qs("hideTimer").checked = board.hideTimerBadges ?? DEFAULTS.hideTimerBadges;
  qs("hideDetail").checked = board.hideDetailBadges ?? DEFAULTS.hideDetailBadges;
  qs("hideBars").checked = board.hideProgressBars ?? DEFAULTS.hideProgressBars;
  qs("focusMode").checked = board.autoFocus ?? DEFAULTS.autoFocus;
  qs("autoTrackMode").value = board.autoTrackMode ?? DEFAULTS.autoTrackMode;

  setTimeout(() => t.sizeTo(document.body).done(), 40);
}

async function setBoard(key, value) {
  await t.set("board", "shared", key, value); // persist [web:45]
  await t.refresh();
}

function renderAuthorize() {
  document.body.innerHTML = `
    <div style="padding: 40px 20px; text-align:center;">
      <h2 style="margin-bottom: 10px; font-size: 18px;">Power-Up Disabled</h2>
      <p style="margin-bottom: 18px; opacity: 0.75;">Click below to re-enable</p>
      <button id="authBtn" style="
        padding: 12px 18px;
        background: #0079bf;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        width: 100%;
        max-width: 260px;
      ">Authorize Power-Up</button>
      <div id="authMsg" style="margin-top: 12px; font-size: 12px; opacity: .75;"></div>
    </div>
  `;

  setTimeout(() => t.sizeTo(document.body).done(), 40);

  document.getElementById("authBtn").addEventListener("click", async () => {
    const msg = document.getElementById("authMsg");
    msg.textContent = "Enabling…";

    try {
      await t.set("board", "shared", "disabled", false); // persist [web:45]
      await t.refresh();
      msg.textContent = "Enabled. Closing…";
      t.closePopup();
    } catch (e) {
      console.error(e);
      msg.textContent = "Failed to enable. Check console.";
    }
  });
}

function bind() {
  qs("hideBadges").addEventListener("change", async (e) => {
    await setBoard("hideBadges", e.target.checked);
  });

  qs("hideTimer").addEventListener("change", async (e) => {
    await setBoard("hideTimerBadges", e.target.checked);
  });

  qs("hideDetail").addEventListener("change", async (e) => {
    await setBoard("hideDetailBadges", e.target.checked);
  });

  qs("hideBars").addEventListener("change", async (e) => {
    await setBoard("hideProgressBars", e.target.checked);
  });

  qs("focusMode").addEventListener("change", async (e) => {
    await setBoard("autoFocus", e.target.checked);
  });

  qs("autoTrackMode").addEventListener("change", async (e) => {
    await setBoard("autoTrackMode", e.target.value);
  });

  qs("unauthBtn").addEventListener("click", async () => {
    const ok = confirm("Remove and clear all saved data?");
    if (!ok) return;

    const all = await t.getAll(); // [web:45]

    const boardShared = all?.board?.shared || {};
    for (const key of Object.keys(boardShared)) {
      await t.remove("board", "shared", key);
    }

    // Mark disabled after clearing
    await t.set("board", "shared", "disabled", true); // [web:45]
    await t.refresh();

    alert("Power-Up disabled. Re-open Settings to authorize again.");
    t.closePopup();
  });
}

(async function init() {
  const board = await getBoardShared();
  const disabled = board.disabled === true;

  if (disabled) {
    renderAuthorize();
    return;
  }

  bind();
  await loadUI();
})();

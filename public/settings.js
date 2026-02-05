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
  const all = await t.getAll(); // recommended bulk read [web:45]
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
  await t.set("board", "shared", key, value); // t.set mirrors t.get [web:45]
  t.refresh();
}

function bind() {
  qs("hideBadges").addEventListener("change", (e) =>
    setBoard("hideBadges", e.target.checked)
  );

  qs("hideTimer").addEventListener("change", (e) =>
    setBoard("hideTimerBadges", e.target.checked)
  );

  qs("hideDetail").addEventListener("change", (e) =>
    setBoard("hideDetailBadges", e.target.checked)
  );

  qs("hideBars").addEventListener("change", (e) =>
    setBoard("hideProgressBars", e.target.checked)
  );

  qs("focusMode").addEventListener("change", (e) =>
    setBoard("autoFocus", e.target.checked)
  );

  qs("autoTrackMode").addEventListener("change", (e) =>
    setBoard("autoTrackMode", e.target.value)
  );

  qs("unauthBtn").addEventListener("click", async () => {
    const ok = confirm("Remove and clear all saved data?");
    if (!ok) return;

    const all = await t.getAll(); // [web:45]

    const boardShared = all?.board?.shared || {};
    for (const key of Object.keys(boardShared)) await t.remove("board", "shared", key);

    const cardShared = all?.card?.shared || {};
    for (const key of Object.keys(cardShared)) await t.remove("card", "shared", key);

    const memPrivate = all?.member?.private || {};
    for (const key of Object.keys(memPrivate)) await t.remove("member", "private", key);

    await t.set("board", "shared", "disabled", true);
    alert("Power-Up data cleared.");
    t.closePopup();
  });
}

(async function init() {
  // Check if Power-Up is disabled
  const all = await t.getAll();
  const disabled = all?.board?.shared?.disabled;

  if (disabled) {
    // Replace entire UI with authorize button
    document.body.innerHTML = `
      <div style="padding: 40px 20px; text-align: center;">
        <h2 style="margin-bottom: 16px; font-size: 18px;">Power-Up Disabled</h2>
        <p style="margin-bottom: 20px; opacity: 0.7;">Click below to re-enable</p>
        <button id="authBtn" style="
          padding: 12px 24px;
          background: #0079bf;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        ">
          Authorize Power-Up
        </button>
      </div>
    `;

    setTimeout(() => t.sizeTo(document.body).done(), 40);

    document.getElementById("authBtn").addEventListener("click", async () => {
      await t.set("board", "shared", "disabled", false);
      t.closePopup();
      window.location.reload(); // or just close and let user reopen
    });

    return; // Stop here, don't bind normal UI
  }

  // Normal flow if not disabled
  bind();
  await loadUI();
})();

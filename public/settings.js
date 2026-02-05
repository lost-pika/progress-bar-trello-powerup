/* global TrelloPowerUp */
const t = TrelloPowerUp.iframe();

const DEFAULTS = {
  disabled: false,
  hideBadges: false,
  hideTimerBadges: false,
  hideDetailBadges: false,
  hideProgressProgressBars: false, // not used; kept to avoid typos
  hideProgressBars: false,
  autoFocus: false,
  autoTrackMode: "off",
};

let boardState = {};
let saveQueue = Promise.resolve(); // serialize shared writes [page:56]

function qs(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

function setDisabledUI(disabled, reason) {
  const ids = ["hideBadges", "hideTimer", "hideDetail", "hideBars", "focusMode", "autoTrackMode", "unauthBtn"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });

  let bar = document.getElementById("saveStatus");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "saveStatus";
    bar.style.cssText =
      "margin-top:10px;font-size:12px;opacity:.8;line-height:1.3;";
    document.body.appendChild(bar);
  }
  bar.textContent = reason || "";
}

async function getBoardShared() {
  // bulk read in context [page:56]
  const all = await t.getAll();
  return all?.board?.shared || {};
}

async function loadUI() {
  const board = await getBoardShared();
  boardState = { ...DEFAULTS, ...board };

  qs("hideBadges").checked = !!boardState.hideBadges;
  qs("hideTimer").checked = !!boardState.hideTimerBadges;
  qs("hideDetail").checked = !!boardState.hideDetailBadges;
  qs("hideBars").checked = !!boardState.hideProgressBars;
  qs("focusMode").checked = !!boardState.autoFocus;
  qs("autoTrackMode").value = boardState.autoTrackMode || "off";

  setTimeout(() => t.sizeTo(document.body).done(), 40);
}

function queueBoardSave(patch) {
  // Shared writes are not atomic; serialize and write the whole object to avoid clobbering. [page:56]
  saveQueue = saveQueue
    .then(async () => {
      boardState = { ...boardState, ...patch };

      setDisabledUI(false, "Saving…");
      await t.set("board", "shared", boardState); // set whole blob [page:56]
      t.refresh();
      setDisabledUI(false, "Saved");
    })
    .catch((err) => {
      console.error("Save failed:", err);
      setDisabledUI(false, "Save failed (check console).");
      throw err;
    });

  return saveQueue;
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
      // Write must finish BEFORE closing popup. [page:56]
      await t.set("board", "shared", "disabled", false);
      t.refresh();
      msg.textContent = "Enabled. Closing…";
      t.closePopup();
    } catch (e) {
      console.error(e);
      msg.textContent = "Failed to enable (check console).";
    }
  });
}

function bind() {
  qs("hideBadges").addEventListener("change", (e) =>
    queueBoardSave({ hideBadges: e.target.checked })
  );

  qs("hideTimer").addEventListener("change", (e) =>
    queueBoardSave({ hideTimerBadges: e.target.checked })
  );

  qs("hideDetail").addEventListener("change", (e) =>
    queueBoardSave({ hideDetailBadges: e.target.checked })
  );

  qs("hideBars").addEventListener("change", (e) =>
    queueBoardSave({ hideProgressBars: e.target.checked })
  );

  qs("focusMode").addEventListener("change", (e) =>
    queueBoardSave({ autoFocus: e.target.checked })
  );

  qs("autoTrackMode").addEventListener("change", (e) =>
    queueBoardSave({ autoTrackMode: e.target.value })
  );

  qs("unauthBtn").addEventListener("click", async () => {
    const ok = confirm("Remove and clear all saved data?");
    if (!ok) return;

    // Only set disabled flag; don’t wipe everything here (wipes can race and look “broken”). [page:56]
    await queueBoardSave({ disabled: true });
    alert("Power-Up disabled. Re-open Settings to authorize again.");
    t.closePopup();
  });
}

(async function init() {
  // Permission guard: shared board writes can fail if member doesn’t have board write access. [page:56]
  const ctx = t.getContext();
  const canWriteBoard = ctx?.permissions?.board === "write";

  if (!canWriteBoard) {
    setDisabledUI(true, "You don’t have board write access, so settings can’t be saved.");
  }

  const board = await getBoardShared();
  if (board?.disabled === true) {
    renderAuthorize();
    return;
  }

  bind();
  await loadUI();
})();

/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

function makeBar(pct) {
  const total = 10;
  const filled = Math.round((pct / 100) * total);
  return "█".repeat(filled) + "▒".repeat(total - filled);
}

function formatHM(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  return `${h}:${m}`;
}

function computeElapsed(data) {
  if (!data || !data.running || !data.startTime) return data?.elapsed || 0;
  return data.elapsed + Math.floor((Date.now() - data.startTime) / 1000);
}

async function computeProgressFromChecklists(t) {
  const card = await t.card("checklists");

  let total = 0;
  let done = 0;

  (card.checklists || []).forEach((cl) => {
    (cl.checkItems || []).forEach((item) => {
      total++;
      if (item.state === "complete") done++;
    });
  });

  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/* --------------------------------------------------
   MAIN POWER-UP
-------------------------------------------------- */

TrelloPowerUp.initialize({
  /* --------------------------------------------------
     BOARD BUTTON
  -------------------------------------------------- */
  "board-buttons": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");

    return [
      {
        icon: ICON,
        text: "Progress",
        callback: function (_t, opts) {
          return t.popup({
            title: disabled ? "Authorize Power-Up" : "Progress Settings",
            url: disabled ? "./auth.html" : "./settings.html",
            height: disabled ? 200 : 620,
            mouseEvent: opts.mouseEvent,
          });
        },
      },
    ];
  },

  /* --------------------------------------------------
     CARD BACK (iframe)
  -------------------------------------------------- */
  "card-back-section": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");
    if (disabled) return null;

    const data = await t.get("card", "shared");
    if (!data) return null; // Hide UI when no progress added

    return {
      title: "Progress",
      icon: ICON,
      content: {
        type: "iframe",
        url: t.signUrl("./card-progress.html"),
        height: 180,
      },
    };
  },

  /* --------------------------------------------------
     CARD FRONT BADGES
  -------------------------------------------------- */
  "card-badges": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");
    if (disabled) return [];

    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(async ([data, hideBadges, hideBars]) => {
      if (hideBadges || !data) return [];

      const badges = [];

      // 🎯 Focus badge
      if (data.focusMode) {
        badges.push({ text: "🎯 Focus", color: "red" });
      }

      // 🔥 Checklist progress
      const pct = await computeProgressFromChecklists(t);

      badges.push({
        text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
        color: "blue",
      });

      // ⏱ Timer badge
      badges.push({
        dynamic: async function (t) {
          const d = await t.get("card", "shared");
          if (!d) return { text: "" };
          return {
            text: `⏱ ${formatHM(computeElapsed(d))} | Est ${formatHM(
              d.estimated || 8 * 3600,
            )}`,
            color: "blue",
          };
        },
        refresh: 1000,
      });

      return badges;
    });
  },

  /* --------------------------------------------------
     EXPANDED DETAIL BADGES
  -------------------------------------------------- */
  "card-detail-badges": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");
    if (disabled) return [];

    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "hideTimerBadges"),
    ]).then(async ([data, hideDetail, hideBars, hideTimer]) => {
      if (hideDetail || !data) return [];

      const badges = [];

      // 🎯 Focus badge
      if (data.focusMode) {
        badges.push({
          title: "Focus",
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      // 🔥 Checklist progress
      const pct = await computeProgressFromChecklists(t);

      badges.push({
        title: "Progress",
        text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
        color: "blue",
      });

      // ⏱ Timer badge
      if (!hideTimer) {
        badges.push({
          title: "Timer",
          dynamic: async function (t) {
            const d = await t.get("card", "shared");
            if (!d) return { text: "" };
            return {
              text: `⏱ ${formatHM(computeElapsed(d))} | Est ${formatHM(
                d.estimated || 8 * 3600,
              )}`,
              color: "blue",
            };
          },
          refresh: 1000,
        });
      }

      return badges;
    });
  },

  /* --------------------------------------------------
     ADD / HIDE PROGRESS BUTTON
  -------------------------------------------------- */
  "card-buttons": async function (t) {
    const data = await t.get("card", "shared");
    const hasProgress = !!data;

    return [
      {
        icon: ICON,
        text: hasProgress ? "Hide Progress" : "Add Progress",
        callback: function () {
          if (hasProgress) {
            // Full reset
            return t.remove("card", "shared").then(() => t.refresh());
          }

          // Add new tracking
          return t
            .set("card", "shared", {
              progress: 0,
              elapsed: 0,
              estimated: 8 * 3600,
              running: false,
              startTime: null,
              focusMode: false,
            })
            .then(() => t.refresh());
        },
      },
    ];
  },

  /* --------------------------------------------------
     AUTO TRACK ON LIST MOVE
  -------------------------------------------------- */
  "card-moved": function (t, opts) {
    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "autoTrackMode"),
      t.get("board", "shared", "autoTrackLists"),
    ]).then(([data, mode, lists]) => {
      if (!data) return;
      if (mode !== "list" && mode !== "both") return;
      if (!lists || !lists.includes(opts.to.list.id)) return;

      // If not already running → auto start
      if (!data.running) {
        return t
          .set("card", "shared", {
            ...data,
            running: true,
            startTime: Date.now(),
            focusMode: true,
          })
          .then(() => t.refresh());
      }
    });
  },

  /* --------------------------------------------------
     AUTO TRACK ON CARD OPEN
  -------------------------------------------------- */
  "on-card-clicked": function (t) {
    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "autoTrackMode"),
    ]).then(([data, mode]) => {
      if (!data) return;
      if (mode !== "open" && mode !== "both") return;
      if (data.running) return;

      return t
        .set("card", "shared", {
          ...data,
          running: true,
          startTime: Date.now(),
          focusMode: true,
        })
        .then(() => t.refresh());
    });
  },

  /* --------------------------------------------------
     AUTH
  -------------------------------------------------- */
  "authorization-status": function (t) {
    return t.get("member", "private", "authorized").then((a) => ({
      authorized: a === true,
    }));
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Progress",
      url: "./auth.html",
      height: 200,
    });
  },
});

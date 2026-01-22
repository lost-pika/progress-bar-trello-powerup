/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

/* ----------------------------------------
   HELPERS
---------------------------------------- */

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

  const now = Date.now();
  return data.elapsed + Math.floor((now - data.startTime) / 1000);
}

async function computeProgressFromChecklists(t) {
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

/* ----------------------------------------
   INITIALIZE POWER-UP
---------------------------------------- */

TrelloPowerUp.initialize({
  /* Board Button → Settings popup */
  "board-buttons": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");

    if (disabled)
      return [
        {
          icon: ICON,
          text: "Progress",
          callback: function (t, opts) {
            return t.popup({
              title: "Authorize power up",
              url: "./auth.html",
              height: 200,
              mouseEvent: opts.mouseEvent, // ← REQUIRED
            });
          },
        },
      ];

    // If not disabled → normal settings
    return [
      {
        icon: ICON,
        text: "Progress",
        callback: function (t, opts) {
          return t.popup({
            title: "Progress Settings",
            url: "./settings.html",
            height: 620,
            mouseEvent: opts.mouseEvent,
          });
        },
      },
    ];
  },
  /* Card Back Section → Timer iframe */
  "card-back-section": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");
    if (disabled) return null;

    const cardData = await t.get("card", "shared");

    if (!cardData || cardData.disabledProgress === true) return null;

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

  /* Card Badges → Timer + Progress + Focus */
  "card-badges": async function (t) {
  const disabled = await t.get("board", "shared", "disabled");
  if (disabled) return [];

  return Promise.all([
    t.get("card", "shared"),
    t.get("board", "shared", "hideBadges"),
    t.get("board", "shared", "hideProgressBars"),
    t.get("board", "shared", "hideTimerBadges"), // ← REQUIRED
  ]).then(([data, hideBadges, hideBars, hideTimer]) => {
    if (hideBadges || !data) return [];
    if (data.disabledProgress) return [];

    const badges = [];

    // Focus badge
    if (data.focusMode) {
      badges.push({
        text: "🎯 Focus",
        color: "red",
      });
    }

    // Checklist progress
    return computeProgressFromChecklists(t).then((pct) => {
      badges.push({
        text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
        color: "blue",
      });

      // Timer badge — MUST respect hideTimer flag
      if (!hideTimer) {
        badges.push({
          dynamic: function (t) {
            return t.get("card", "shared").then((d) => {
              if (!d) return { text: "" };
              const el = computeElapsed(d);
              const est = d.estimated || 8 * 3600;
              return {
                text: `⏱ ${formatHM(el)} | Est ${formatHM(est)}`,
                color: "blue",
              };
            });
          },
          refresh: 1000,
        });
      }

      return badges;
    });
  });
},


  /* Inside card detail view */
  "card-detail-badges": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");
    if (disabled) return [];

    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "hideTimerBadges"),
    ]).then(([data, hideDetail, hideBars, hideTimer]) => {
      if (hideDetail || !data) return Promise.resolve([]);

      const badges = [];

      /* Focus badge */
      if (data.focusMode) {
        badges.push({
          title: "Focus",
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      /* 🔥 Checklist progress (NEW) */
      return computeProgressFromChecklists(t).then((pct) => {
        badges.push({
          title: "Progress",
          text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
          color: "blue",
        });

        /* Timer badge */
        if (!hideTimer) {
          badges.push({
            title: "Timer",
            dynamic: function (t) {
              return t.get("card", "shared").then((d) => {
                if (!d) return { text: "" };
                const el = computeElapsed(d);
                const est = d.estimated || 8 * 3600;
                return {
                  text: `⏱ ${formatHM(el)} | Est ${formatHM(est)}`,
                  color: "blue",
                };
              });
            },
            refresh: 1000,
          });
        }

        return badges; // FINAL return
      });
    });
  },

  "card-buttons": async function (t, opts) {
    const data = await t.get("card", "shared");
    const isHidden = data?.disabledProgress === true;

    return [
      {
        icon: ICON,
        text: isHidden ? "Add Progress" : "Hide Progress",
        callback: function (t) {
          if (!data) {
            // Progress has never been added
            return t.set("card", "shared", {
              progress: 0,
              elapsed: 0,
              estimated: 8 * 3600,
              running: false,
              startTime: null,
              focusMode: false,
              disabledProgress: false,
            });
          }

          if (!isHidden) {
            // Hide UI
            return t
              .set("card", "shared", "disabledProgress", true)
              .then(() => t.refresh());
          }

          // Show UI again
          return t
            .set("card", "shared", "disabledProgress", false)
            .then(() => t.refresh());
        },
      },
    ];
  },

  /* Auto-track on list move */
  "card-moved": function (t, opts) {
    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "autoTrackMode"),
      t.get("board", "shared", "autoTrackLists"),
    ]).then(([data, mode, lists]) => {
      if (!data) return;
      if (mode !== "list" && mode !== "both") return;
      if (!lists || lists.length === 0) return;

      const destListId = opts.to.list.id;

      if (!lists.includes(destListId)) return;

      /* Was not running → start automatically */
      if (!data.running) {
        return t
          .set("card", "shared", {
            ...data,
            running: true,
            startTime: Date.now(),
            focusMode: true, // ← REQUIRED
          })
          .then(() => t.refresh()); // ← REQUIRED for immediate badge update
      }

      /* Was running → ask user */
      return t
        .popup({
          title: "Restart Timer?",
          url: "./confirm-restart.html",
          height: 150,
          args: { cardData: data },
        })
        .then((result) => {
          if (!result || result.restart !== true) return;

          return t
            .set("card", "shared", {
              ...data,
              elapsed: 0,
              running: true,
              startTime: Date.now(),
              focusMode: true,
            })
            .then(() => t.refresh());
        });
    });
  },

  "on-card-clicked": function (t, opts) {
    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "autoTrackMode"),
    ]).then(([data, mode]) => {
      if (mode === "open" || mode === "both") {
        if (!data?.running) {
          return t
            .set("card", "shared", {
              ...data,
              running: true,
              startTime: Date.now(),
              focusMode: true, // ← REQUIRED
            })
            .then(() => t.refresh());
        }
      }
    });
  },

  /* Auth */
  "authorization-status": function (t) {
    return t
      .get("member", "private", "authorized")
      .then((a) => ({ authorized: a === true }));
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Progress Power-Up",
      url: "./auth.html",
      height: 200,
    });
  },
});

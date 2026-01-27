/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

// ⭐ TIMER POLLING: Force refresh on card badges
var timerInterval = null;

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

// ⭐ TIMER-BASED PROGRESS
function computeTimerProgress(data) {
  if (!data) return 0;

  const elapsed = computeElapsed(data);
  const estimated = data.estimated || 8 * 3600;

  const progress = Math.min(100, Math.round((elapsed / estimated) * 100));
  return progress;
}

// ⭐ POLLING: Removed - Trello API doesn't support t.refresh()
// Dynamic badges automatically refresh via the refresh property
// No polling needed - Trello handles badge updates internally

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
              mouseEvent: opts.mouseEvent,
            });
          },
        },
      ];

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
    // Inject custom CSS (badge colors) with higher specificity
    var css = `
    .badge-progress, [data-test-id="card-badges"] .badge-progress {
      background: rgba(46, 204, 113, 0.15) !important;
      border: 1px solid rgba(46, 204, 113, 0.35) !important;
      color: #2ecc71 !important;
      border-radius: 6px !important;
      padding: 4px 8px !important;
      font-weight: 600 !important;
    }
    .badge-timer, [data-test-id="card-badges"] .badge-timer {
      background: rgba(26, 188, 156, 0.15) !important;
      border: 1px solid rgba(26, 188, 156, 0.35) !important;
      color: #1abc9c !important;
      border-radius: 6px !important;
      padding: 4px 8px !important;
      font-weight: 600 !important;
    }
  `;

    var style = document.createElement("style");
    style.id = "progress-badge-styles";
    style.innerHTML = css;

    // Remove if already exists to prevent duplicates
    var existing = document.getElementById("progress-badge-styles");
    if (existing) existing.remove();

    document.head.appendChild(style);

    // now continue the normal code
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

    const [data, hideBadges, hideBars, hideTimer] = await Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "hideTimerBadges"),
    ]);

    if (hideBadges || !data) return [];
    if (data.disabledProgress) return [];

    // Dynamic badges handle timer updates automatically
    const badges = [];

    // Focus badge
    if (data.focusMode) {
      badges.push({
        text: "🎯 Focus",
        color: "red",
      });
    }

    // ⭐ TIMER-BASED PROGRESS BADGE
    // Static + Dynamic for maximum responsiveness
    badges.push({
      title: "Progress",
      text: (() => {
        const pct = computeTimerProgress(data);
        return hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`;
      })(),
      color: "green",
      dynamic: function (t) {
        return t.get("card", "shared").then((cardData) => {
          if (!cardData) return { text: "0%", color: "green" };
          const pct = computeTimerProgress(cardData);
          return {
            text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
            color: "green",
          };
        });
      },
      refresh: 250,
    });

    // Timer badge
    // Timer badge
    if (!hideTimer) {
      badges.push({
        dynamic: function (t) {
          return t.get("card", "shared").then((d) => {
            if (!d) return { text: "" };
            const el = computeElapsed(d);
            const est = d.estimated || 8 * 3600;
            return {
              text: `⏱ ${formatHM(el)} | Est ${formatHM(est)}`,
              color: "cyan",
            };
          });
        },
        refresh: 100,
      });
    }

    return badges;
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
      if (hideDetail || !data) return [];

      const badges = [];

      if (data.focusMode) {
        badges.push({
          title: "Focus",
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      // ⭐ TIMER-BASED PROGRESS BADGE (card detail)
      // ⭐ TIMER-BASED PROGRESS BADGE (card detail)
      badges.push({
        title: "Progress",
        dynamic: function (t) {
          return t.get("card", "shared").then((cardData) => {
            if (!cardData) return { text: "0%", color: "green" };

            const pct = computeTimerProgress(cardData);

            return {
              text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
              color: "green",
            };
          });
        },
        refresh: 100,
      });

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
                color: "cyan",
              };
            });
          },
          refresh: 100,
        });
      }

      return badges;
    });
  },

  /* Card buttons */
  "card-buttons": async function (t) {
    const data = await t.get("card", "shared");
    const isHidden = data?.disabledProgress === true;

    return [
      {
        icon: ICON,
        text: isHidden ? "Add Progress" : "Hide Progress",
        callback: function (t) {
          if (!data) {
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

          return t.set("card", "shared", "disabledProgress", !isHidden);
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

      if (!data.running) {
        return t.set("card", "shared", {
          ...data,
          running: true,
          startTime: Date.now(),
          focusMode: true,
        });
      }

      return t
        .popup({
          title: "Restart Timer?",
          url: "./confirm-restart.html",
          height: 150,
          args: { cardData: data },
        })
        .then((result) => {
          if (!result || result.restart !== true) return;

          return t.set("card", "shared", {
            ...data,
            elapsed: 0,
            running: true,
            startTime: Date.now(),
            focusMode: true,
          });
        });
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

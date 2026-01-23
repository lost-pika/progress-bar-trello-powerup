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

// ⭐ FIXED: Properly compute checklist progress
async function computeProgressFromChecklists(t) {
  try {
    const card = await t.card("checklists");
    
    if (!card || !card.checklists || card.checklists.length === 0) {
      return 0;
    }

    let total = 0;
    let done = 0;

    card.checklists.forEach((cl) => {
      if (!cl.checkItems || !Array.isArray(cl.checkItems)) return;
      
      cl.checkItems.forEach((item) => {
        total++;
        if (item.state === "complete") done++;
      });
    });

    if (total === 0) return 0;
    
    const percentage = Math.round((done / total) * 100);
    return percentage;
  } catch (err) {
    console.error("Error computing progress:", err);
    return 0;
  }
}

// ⭐ NEW: Force refresh progress immediately (don't wait for badge refresh)
async function updateProgressImmediately(t) {
  try {
    const pct = await computeProgressFromChecklists(t);
    const cardData = await t.get("card", "shared") || {};
    
    // Only update if progress changed
    if (cardData.progress !== pct) {
      await t.set("card", "shared", "progress", pct);
      // Refresh board view to show updated badges
      await t.refresh();
    }
  } catch (err) {
    console.error("Error updating progress:", err);
  }
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

  /* ⭐ CRITICAL: Listen for checklist changes */
  "notification-types": function (t) {
    return [
      {
        id: "checklistItemCompleted",
        text: "Checklist item completed",
      },
      {
        id: "checklistItemIncompleted",
        text: "Checklist item incompleted",
      },
    ];
  },

  /* Card Badges → Timer + Progress + Focus */
  "card-badges": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");
    if (disabled) return [];

    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "hideTimerBadges"),
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

      // Checklist progress - ⭐ ALWAYS compute fresh from Trello
      badges.push({
        dynamic: function (t) {
          return computeProgressFromChecklists(t).then(async (pct) => {
            let cardData = await t.get("card", "shared");
            if (!cardData) cardData = {};

            // Store the fresh percentage
            if (cardData.progress !== pct) {
              await t.set("card", "shared", "progress", pct);
            }

            return {
              text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
              color: "blue",
            };
          });
        },
        refresh: 1000, // ⭐ REDUCED: Check every second instead of 3s
      });

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
                color: "blue",
              };
            });
          },
          refresh: 1000,
        });
      }

      return badges;
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

      if (data.focusMode) {
        badges.push({
          title: "Focus",
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      // ⭐ SAME FIX HERE: Always compute fresh
      badges.push({
        title: "Progress",
        dynamic: function (t) {
          return computeProgressFromChecklists(t).then(async (pct) => {
            let cardData = await t.get("card", "shared");
            if (!cardData) cardData = {};

            if (cardData.progress !== pct) {
              await t.set("card", "shared", "progress", pct);
            }

            return {
              text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
              color: "blue",
            };
          });
        },
        refresh: 1000, // ⭐ REDUCED: 1s instead of 3s
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
                color: "blue",
              };
            });
          },
          refresh: 1000,
        });
      }

      return badges;
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
            return t
              .set("card", "shared", "disabledProgress", true)
              .then(() => t.refresh());
          }

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

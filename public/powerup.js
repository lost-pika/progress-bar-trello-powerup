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

async function computeChecklistProgress(t) {
  try {
    const card = await t.card("all");

    if (!card || !card.checklists || card.checklists.length === 0) {
      return 0;
    }

    let total = 0;
    let done = 0;

    card.checklists.forEach((cl) => {
      if (cl.checkItems && Array.isArray(cl.checkItems)) {
        cl.checkItems.forEach((item) => {
          total++;
          if (item.state === "complete") done++;
        });
      }
    });

    return total === 0 ? 0 : Math.round((done / total) * 100);
  } catch (err) {
    console.error("Error computing progress:", err);
    return 0;
  }
}

/* ----------------------------------------
   INITIALIZE POWER-UP
---------------------------------------- */

TrelloPowerUp.initialize({
  /* BOARD BUTTONS */
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

  /* CARD BACK SECTION */
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

  /* CARD BADGES */
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

    const badges = [];

    /* FOCUS MODE BADGE */
    if (data.focusMode) {
      badges.push({
        text: "🎯 Focus",
        color: "red",
      });
    }

    /* REAL-TIME PROGRESS BADGE — FIXED */
    badges.push({
      dynamic: function (t) {
        return computeChecklistProgress(t).then(async (pct) => {
          await t.set("card", "shared", "progress", pct);

          return {
            text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
            color: "blue",
          };
        });
      },
      refresh: 500, // fast update
    });

    /* TIMER BADGE */
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
  },

  /* CARD DETAIL BADGES */
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

      /* REAL-TIME PROGRESS BADGE (card detail) */
      badges.push({
        dynamic: function (t) {
          return computeChecklistProgress(t).then(async (pct) => {
            await t.set("card", "shared", "progress", pct);

            return {
              text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
              color: "blue",
            };
          });
        },
        refresh: 500,
      });

      /* TIMER BADGE */
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

  /* CARD BUTTONS */
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

          return t
            .set("card", "shared", "disabledProgress", !isHidden)
            .then(() => t.refresh());
        },
      },
    ];
  },

  /* AUTO-TRACK ON LIST MOVE */
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

  /* AUTH */
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

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
  "card-back-section": async function (t, opts) {
    const card = await t.get("card", "shared");
    const board = await t.get("board", "shared");

    const elapsed = card?.elapsed || 0;
    const estimated = card?.estimated || 8 * 3600;
    let running = card?.running || false;
    let startTime = card?.startTime || null;

    const autoTrackMode = board?.autoTrackMode || "off";
    const autoFocus = board?.autoFocus || false;

    /* ----------------------------------------
       AUTO TRACK ON CARD OPEN  (ONLY FIX ADDED)
    ---------------------------------------- */
    if (autoTrackMode === "open" && !running) {
      running = true;
      startTime = Date.now();

      await t.set("card", "shared", {
        ...card,
        running: true,
        startTime,
      });

      if (autoFocus) {
        await t.set("card", "shared", "focusMode", true);
      }
    }

    /* ---- Rest of your card-back UI ---- */
    return {
      title: "Progress Tracker",
      icon: ICON,
      url: "./card.html",
      height: 310,
    };
  },


  /* Card Badges → Timer + Progress + Focus */
   "card-badges": async function (t) {
    const card = await t.get("card", "shared");
    const board = await t.get("board", "shared");

    if (!card) return [];

    const elapsed = card.elapsed || 0;
    const estimated = card.estimated || 8 * 3600;
    const running = card.running || false;

    const hideBadges = board?.hideBadges || false;
    const hideTimer = board?.hideTimerBadges || false;
    const hideBars = board?.hideProgressBars || false;

    if (hideBadges) return [];

    const pct = Math.min(100, Math.round((elapsed / estimated) * 100));

    const badges = [];

    if (!hideTimer) {
      badges.push({
        text: formatMinutes(elapsed),
        icon: ICON,
        color: running ? "green" : "blue",
      });
    }

    if (!hideBars) {
      badges.push({
        text: pct + "%",
        color: "blue",
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
      badges.push({
        title: "Progress",
        dynamic: function (t) {
          return t.get("card", "shared").then((cardData) => {
            if (!cardData) return { text: "0%", color: "blue" };
            
            const pct = computeTimerProgress(cardData);
            
            return {
              text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
              color: "blue",
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
                color: "blue",
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
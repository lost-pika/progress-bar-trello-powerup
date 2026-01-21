/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

/* ---------------------------------------------
   HELPERS
--------------------------------------------- */

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

/* ---------------------------------------------
   INITIALIZE POWER-UP
--------------------------------------------- */

TrelloPowerUp.initialize({
  /* --------------------------------------------------------
     BOARD BUTTON → SETTINGS POPUP
  -------------------------------------------------------- */
  "board-buttons": function (t) {
    return [
      {
        icon: ICON,
        text: "Progress",
        callback: function () {
          return t.popup({
            title: "Progress Settings",
            url: "./settings.html",
            height: 620,
          });
        },
      },
    ];
  },

  /* --------------------------------------------------------
     CARD BACK SECTION (Time tracker UI)
  -------------------------------------------------------- */
  "card-back-section": function (t) {
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

  /* --------------------------------------------------------
     CARD BADGES (dynamic, updates every second)
  -------------------------------------------------------- */
  "card-badges": function (t) {
    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([data, hideBadges, hideBars]) => {
      if (hideBadges) return [];
      if (!data) return [];

      const badges = [];
      const elapsed = computeElapsed(data);
      const est = data.estimated || 8 * 3600;

      // 🎯 Focus
      if (data.focusMode === true) {
        badges.push({
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      // Progress
      if (typeof data.progress === "number") {
        const pct = Math.max(0, Math.min(100, parseInt(data.progress)));
        if (hideBars) {
          badges.push({ text: pct + "%", color: "blue" });
        } else {
          badges.push({ text: `${makeBar(pct)} ${pct}%`, color: "blue" });
        }
      }

      // Time badge (live)
      badges.push({
        dynamic: function (t) {
          return t.get("card", "shared").then((cd) => {
            if (!cd) return { text: "" };
            return {
              text: `⏱ ${formatHM(computeElapsed(cd))} | Est ${formatHM(cd.estimated || 8 * 3600)}`,
              color: "blue",
            };
          });
        },
        refresh: 1000,
      });

      return badges;
    });
  },

  /* --------------------------------------------------------
     CARD DETAIL BADGES
  -------------------------------------------------------- */
  "card-detail-badges": function (t) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("card", "shared", "focusMode"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([progress, focusMode, hideDetails, hideBars]) => {
      if (hideDetails) return [];

      const badges = [];

      if (focusMode) {
        badges.push({
          title: "Focus",
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      if (progress == null) return badges;

      const pct = Math.max(0, Math.min(100, progress));

      if (hideBars) {
        badges.push({ title: "Progress", text: pct + "%", color: "blue" });
      } else {
        badges.push({ title: "Progress", text: `${makeBar(pct)} ${pct}%`, color: "blue" });
      }

      return badges;
    });
  },

  /* --------------------------------------------------------
     OPEN CARD → Auto tracking if enabled
  -------------------------------------------------------- */
  "card-buttons": function (t) {
    return [
      {
        icon: ICON,
        text: "Open Card",
        callback: function () {
          return Promise.all([
            t.get("card", "shared"),
            t.get("board", "shared", "autoTrackMode"),
            t.card("id"),
          ]).then(([data, mode, card]) => {
            if (mode === "open" || mode === "both") {
              if (!data?.running) {
                t.set("card", "shared", {
                  ...data,
                  running: true,
                  startTime: Date.now(),
                });
              }
            }

            return t.navigate({ url: `https://trello.com/c/${card.id}` });
          });
        },
      },
    ];
  },

  /* --------------------------------------------------------
     CARD MOVED → Auto-track + Restart Logic
  -------------------------------------------------------- */
  "card-moved": function (t, opts) {
    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "autoTrackMode"),
      t.get("board", "shared", "autoTrackLists"),
    ]).then(([data, mode, lists]) => {
      if (!data) return;
      if (mode !== "list" && mode !== "both") return;
      if (!lists || lists.length === 0) return;

      const destList = opts.to.list;
      if (!lists.includes(destList)) return;

      // Not running → auto start
      if (!data.running) {
        return t.set("card", "shared", {
          ...data,
          running: true,
          startTime: Date.now(),
        });
      }

      // Running → ask restart?
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
          });
        });
    });
  },

  /* --------------------------------------------------------
     AUTH
  -------------------------------------------------------- */
  "authorization-status": function (t) {
    return t.get("member", "private", "authorized").then((auth) => ({
      authorized: auth === true,
    }));
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Progress Power-Up",
      url: "./auth.html",
      height: 200,
    });
  },
});

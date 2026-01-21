/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

// TEXT PROGRESS BAR
function makeBar(pct) {
  const total = 10;
  const filled = Math.round((pct / 100) * total);
  return "█".repeat(filled) + "▒".repeat(total - filled);
}

TrelloPowerUp.initialize({
  /* -----------------------------------------------------
     BOARD SETTINGS BUTTON
  ----------------------------------------------------- */
  "board-buttons": function (t) {
    return [
      {
        icon: ICON,
        text: "Progress",
        callback: function (t) {
          return t.popup({
            title: "Progress Settings",
            url: "./settings.html",
            height: 600,
          });
        },
      },
    ];
  },

  /* -----------------------------------------------------
     CARD BACK SECTION (with AUTO-START TIMER)
  ----------------------------------------------------- */
  "card-back-section": function (t) {
    // AUTO-START LOGIC (MUST BE OUTSIDE RETURN)
    t.get("card", "shared").then((data) => {
      if (data?.auto && !data.running) {
        t.set("card", "shared", {
          ...data,
          running: true,
          startTime: Date.now(),
        });
      }
    });

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

  /* -----------------------------------------------------
     CARD BADGES (BOARD VIEW)
  ----------------------------------------------------- */
  "card-badges": function (t) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("card", "shared", "focusMode"),
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([progress, focusMode, hideBadges, hideProgressBars]) => {
      const badges = [];

      // 🎯 Focus Badge
      if (focusMode) {
        badges.push({
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      // Hide all badges?
      if (hideBadges) return badges;

      if (progress == null) return badges;

      const pct = Math.max(0, Math.min(parseInt(progress), 100));

      // Percentage only
      if (hideProgressBars) {
        badges.push({
          text: pct + "%",
          color: "blue",
        });
      } else {
        badges.push({
          text: `${makeBar(pct)} ${pct}%`,
          color: "blue",
        });
      }

      return badges;
    });
  },

  /* -----------------------------------------------------
     CARD DETAIL BADGES (EXPANDED VIEW)
  ----------------------------------------------------- */
  "card-detail-badges": function (t) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("card", "shared", "focusMode"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([progress, focusMode, hideDetailBadges, hideProgressBars]) => {
      const badges = [];

      if (hideDetailBadges) return badges;

      if (focusMode) {
        badges.push({
          title: "Focus",
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      if (progress == null) return badges;

      const pct = Math.max(0, Math.min(parseInt(progress), 100));

      if (hideProgressBars) {
        badges.push({
          title: "Progress",
          text: pct + "%",
          color: "blue",
        });
      } else {
        badges.push({
          title: "Progress",
          text: `${makeBar(pct)} ${pct}%`,
          color: "blue",
        });
      }

      return badges;
    });
  },

  /* -----------------------------------------------------
     TIME TRACKER SECTION IN CARD DETAIL
  ----------------------------------------------------- */
  "card-detail-section": function (t) {
    return t.get("board", "shared", "hideDetailBadges").then((hide) => {
      if (hide) return null;

      return {
        title: "Time Tracker",
        icon: ICON,
        content: {
          type: "iframe",
          url: t.signUrl("./card-detail-progress.html"),
          height: 120,
        },
      };
    });
  },

  /* -----------------------------------------------------
     AUTH
  ----------------------------------------------------- */
  "authorization-status": function (t) {
    return t.get("member", "private", "authorized").then((auth) => ({
      authorized: auth === true,
    }));
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Progress Power-Up",
      url: "./auth.html",
      height: 180,
    });
  },
});

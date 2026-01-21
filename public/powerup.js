/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

// 🔥 ADD THIS FUNCTION HERE

function makeBar(pct) {
  const total = 10;
  const filled = Math.round((pct / 100) * total);
  return "█".repeat(filled) + "▒".repeat(total - filled);
}


TrelloPowerUp.initialize({
  // SETTINGS BUTTON
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

  // CARD BACK SECTION (iframe) - Detail view progress tracker
  "card-back-section": function (t, opts) {
  return {
    title: "Progress",
    icon: ICON,
    content: {
      type: "iframe",
      url: t.signUrl("./card-progress.html"),
      height: 180
    }
  };
},


  // CARD BADGES (front) - Shows on card in board view
 "card-badges": function (t, opts) {
  return Promise.all([
    t.get("card", "shared", "progress"),
    t.get("board", "shared", "hideBadges"),
    t.get("board", "shared", "hideProgressBars")
  ]).then(([progress, hideBadges, hideProgressBars]) => {

    // 1️⃣ If hide card badges → hide entirely from board view
    if (hideBadges) return [];

    // If no progress → no badge
    if (progress === undefined || progress === null || progress === "") {
      return [];
    }

    const pct = Math.max(0, Math.min(parseInt(progress), 100));

    // 2️⃣ Hide progress bar but KEEP % visible
    if (hideProgressBars) {
      return [
        {
          text: pct + "%",
          color: "blue"
        }
      ];
    }

    // 3️⃣ Normal mode → show bar + %
    const bar = makeBar(pct);

    return [
      {
        text: `${bar} ${pct}%`,
        color: "blue"
      }
    ];
  });
},



  // CARD DETAIL BADGES - Shows in expanded card view
  "card-detail-badges": function (t, opts) {
  return Promise.all([
    t.get("card", "shared", "progress"),
    t.get("board", "shared", "hideDetailBadges")
  ]).then(([progress, hideDetailBadges]) => {

    // 1️⃣ If hide detail badges → remove from expanded view ONLY
    if (hideDetailBadges) return [];

    // If no progress
    if (!progress && progress !== 0) return [];

    const pct = Math.max(0, Math.min(parseInt(progress), 100));

    return [
      {
        title: "Progress",
        text: pct + "%",
        color: "blue"
      }
    ];
  });
},

  // POWER-UPS MENU - Time tracker section in card detail
  'card-detail-section': function(t) {
    return Promise.all([
      t.get('board', 'shared', 'hideDetailBadges'),
    ]).then(([hideDetailBadges]) => {
      // Don't show time tracker if detail badges are hidden
      if (hideDetailBadges) {
        return null;
      }

      return {
        title: 'Time Tracker',
        icon: ICON,
        content: {
          type: 'iframe',
          url: t.signUrl('./card-detail-progress.html'),
          height: 120
        }
      };
    });
  },

  "authorization-status": function (t) {
    return t
      .get("member", "private", "authorized")
      .then((auth) => ({ authorized: auth === true }));
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Progress Power-Up",
      url: "./auth.html",
      height: 180,
    });
  },
});
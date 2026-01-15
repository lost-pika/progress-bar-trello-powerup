/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

TrelloPowerUp.initialize({
  // BOARD BUTTON
  "board-buttons": function (t) {
    return [
      {
        icon: ICON,
        text: "Progress",
        callback: function () {
          return t.popup({
            title: "Progress Settings",
            url: "./settings.html",
            height: 600,
          });
        },
      },
    ];
  },

  // CARD BACK SECTION
  "card-back-section": function (t) {
    return Promise.all([
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "hideBadges"),
    ]).then(([hideDetailBadges, hideProgressBars, hideBadges]) => {
      // ❌ If ANY hide toggles are on → DO NOT show iframe section
      if (hideDetailBadges || hideProgressBars || hideBadges) return null;

      return {
        title: "Progress",
        icon: ICON,
        content: {
          type: "iframe",
          url: t.signUrl("./card-progress.html"),
          height: 300, // increased height for full time-tracker
        },
      };
    });
  },

  // CARD BADGES (Front of card)
  "card-badges": function (t) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([progress, hideBadges, hideProgressBars]) => {
      if (hideBadges) return [];
      if (hideProgressBars) return [];

      if (progress == null) return [];

      const pct = Math.max(0, Math.min(progress, 100));

      // 🎨 FULL-WIDTH PROGRESS BAR (like your reference screenshot)
      return [
        {
          title: "Progress",
          percent: pct, // Trello automatically renders a bar like your screenshot
          color: pct < 40 ? "red" : pct < 80 ? "yellow" : "green",
        },
      ];
    });
  },

  // CARD INTERNAL BADGES (Inside modal header)
  "card-detail-badges": function (t) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([progress, hideDetailBadges, hideProgressBars]) => {
      if (hideDetailBadges) return [];
      if (hideProgressBars) return [];
      if (progress == null) return [];

      const pct = Math.max(0, Math.min(progress, 100));

      return [
        {
          title: "Progress",
          text: pct + "%",
          color: pct < 40 ? "red" : pct < 80 ? "yellow" : "green",
        },
      ];
    });
  },

  // AUTH
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

/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

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

  // CARD BACK SECTION (iframe)
  "card-back-section": function (t, opts) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "hideBadges"),
    ]).then(([progress, hideDetailBadges, hideProgressBars, hideBadges]) => {
      // Hide card-back module if both detail and progress are toggled off
      if (hideDetailBadges || hideProgressBars || hideBadges) {
        return null; // Removes the entire section
      }

      return {
        title: "Progress",
        icon: ICON,
        content: {
          type: "iframe",
          url: t.signUrl("./card-progress.html"),
          height: 130,
        },
      };
    });
  },

  // CARD BADGES (front)
  "card-badges": function (t, opts) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(function ([progress, hideBadges, hideProgressBars]) {
      if (hideBadges) return [];
      if (hideProgressBars) return [];

      if (progress !== undefined && progress !== null) {
        const pct = Math.max(0, Math.min(progress, 100));

        return [
          {
            dynamic: function () {
              return {
                text: pct + "%",
                color: pct < 40 ? "red" : pct < 80 ? "yellow" : "green",
              };
            },
          },
        ];
      }

      return [];
    });
  },

  // CARD DETAIL BADGES
  "card-detail-badges": function (t, opts) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([progress, hideDetailBadges, hideProgressBars]) => {
      if (hideDetailBadges) return [];
      if (hideProgressBars) return [];
      if (progress != null)
        return [
          {
            title: "Progress",
            text: progress + "%",
            color: "blue",
          },
        ];

      return [];
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

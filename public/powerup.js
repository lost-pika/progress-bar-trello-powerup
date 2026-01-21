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

  // CARD BACK SECTION (iframe) - Detail view progress tracker
  "card-back-section": function (t, opts) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("board", "shared", "hideDetailBadges"),
    ]).then(([progress, hideDetailBadges]) => {
      // Hide card-back module if detail badges are toggled off
      if (hideDetailBadges) {
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

  // CARD BADGES (front) - Shows on card in board view
  "card-badges": function (t, opts) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("board", "shared", "hideBadges"),
    ]).then(function ([progress, hideBadges]) {
      // If hide badges is ON, don't show anything
      if (hideBadges) return [];

      if (progress !== undefined && progress !== null) {
        const pct = Math.max(0, Math.min(progress, 100));

        return [
          {
            dynamic: function () {
              return [{ text: progress + '%', color: 'blue' }];
            },
          },
        ];
      }

      return [];
    });
  },

  // CARD DETAIL BADGES - Shows in expanded card view
  "card-detail-badges": function (t, opts) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("board", "shared", "hideDetailBadges"),
    ]).then(([progress, hideDetailBadges]) => {
      // If hide detail badges is ON, don't show anything
      if (hideDetailBadges) return [];

      if (progress != null) {
        return [
          {
            title: "Progress",
            text: progress + "%",
            color: "blue",
          },
        ];
      }

      return [];
    });
  },

  // POWER-UPS MENU - Time tracker section in card detail
  'card-detail-section': function(t) {
    return Promise.all([
      t.get('board', 'shared', 'hideDetailBadges'),
    ]).then(([hideDetailBadges]) => {
      // Don't show time tracker if detail badges are hidden
      if (hideDetailBadges) return null;

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
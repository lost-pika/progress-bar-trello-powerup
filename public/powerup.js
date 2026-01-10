/* global TrelloPowerUp */

TrelloPowerUp.initialize({
  // 1️⃣ BUTTON SHOWN INSIDE THE CARD
  "card-buttons": function (t) {
    return [
      {
        icon: "https://cdn-icons-png.flaticon.com/512/992/992651.png",
        text: "Add Progress UI",
        callback: function (t) {
          return t.popup({
            title: "Progress Settings",
            url: "./index.html", // your React UI
            height: 750,
            width: 900,
          });
        },
      },
    ];
  },

  // 2️⃣ BADGE SHOWN ON CARD FRONT
  "card-badges": function (t) {
    return t.get("card", "shared", "progress").then(function (progress) {
      if (!progress) {
        return [];
      }

      return [
        {
          text: progress + "%",
          color: progress >= 100 ? "green" : "blue",
        },
      ];
    });
  },
});

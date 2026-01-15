/* global TrelloPowerUp */

var ICON = 'https://cdn-icons-png.flaticon.com/512/992/992651.png';
var Promise = TrelloPowerUp.Promise;

TrelloPowerUp.initialize({

  // 1️⃣ BOARD BUTTON → Settings popup
  'board-buttons': function(t) {
    return [{
      icon: ICON,
      text: 'Progress',
      callback: function(t) {
        return t.popup({
          title: 'Progress Settings',
          url: './settings.html',
          height: 600,
          width: 500
        });
      }
    }];
  },

  // 2️⃣ CARD BACK SECTION → Shows ABOVE Description
   'card-back-section': function(t) {
    return {
      title: 'Progress',
      icon: ICON,
      content: {
        type: 'iframe',
        url: t.signUrl('./card-progress.html', { minutes: 30 }),
        height: 130   // <= reduce this
      }
    };
  },

  // 3️⃣ BADGE → shows saved progress on card front
  'card-badges': function (t, opts) {
    return Promise.all([
      t.get('card', 'shared', 'progress'),
      t.get('board', 'shared', 'hideBadges'),
      t.get('board', 'shared', 'hideProgressBars')
    ])
    .then(function ([progress, hideBadges, hideProgressBars]) {

      // 1️⃣ If ALL card badges are hidden → return NOTHING
      if (hideBadges) return [];

      // 2️⃣ If ONLY progress bars are hidden → return NOTHING for your badge
      if (hideProgressBars) return [];

      // 3️⃣ Show your own progress badge
      if (progress !== undefined && progress !== null) {
        return [{
          text: progress + '%',
          color: 'blue'
        }];
      }

      return [];
    });
  },

  // ---------------------------------------------------------
  // CARD DETAIL BADGES (Inside card modal)
  // ---------------------------------------------------------
  'card-detail-badges': function (t, opts) {
    return Promise.all([
      t.get('card', 'shared', 'progress'),
      t.get('board', 'shared', 'hideDetailBadges'),
      t.get('board', 'shared', 'hideProgressBars')
    ])
    .then(function ([progress, hideDetailBadges, hideProgressBars]) {

      // 1️⃣ Hide ALL detail badges
      if (hideDetailBadges) return [];

      // 2️⃣ Hide progress bar badge only
      if (hideProgressBars) return [];

      // 3️⃣ Show your detail badge
      if (progress !== undefined && progress !== null) {
        return [{
          title: 'Progress',
          text: progress + '%',
          color: 'blue'
        }];
      }

      return [];
    });
  }


});
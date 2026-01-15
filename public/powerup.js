/* global TrelloPowerUp */

var ICON = 'https://cdn-icons-png.flaticon.com/512/992/992651.png';

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
  'card-badges': function(t){
    return t.get('card', 'shared', 'progress')
      .then(function(progress){
        if (!progress) return [];

        return [{
          text: progress + '%',
          color: progress >= 100 ? 'green' : 'blue'
        }];
      });
  }

});
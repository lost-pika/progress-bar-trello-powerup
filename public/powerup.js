/* global TrelloPowerUp */

var ICON = 'https://cdn-icons-png.flaticon.com/512/992/992651.png';

TrelloPowerUp.initialize({

  // 1️⃣ BOARD BUTTON → appears next to Automation, Power-Ups, etc.
  'board-buttons': function(t) {
    return [{
      icon: ICON,
      text: 'Progress',
      callback: function(t) {
        return t.popup({
          title: 'Progress Settings',
          url: './settings.html',  // settings UI
          height: 600,
          width: 500
        });
      }
    }];
  },

  // 2️⃣ CARD BUTTON → opens popup UI
  'card-buttons': function(t) {
    return [{
      icon: ICON,
      text: 'Progress',
      callback: function(t){
        return t.popup({
          title: 'Progress Settings',
          url: './index.html',   // popup UI
          height: 600
        });
      }
    }];
  },

  // 3️⃣ BADGE → shows saved progress
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
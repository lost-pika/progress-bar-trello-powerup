// /* global TrelloPowerUp */


// TrelloPowerUp.initialize({

//   'card-back-section': function(t, options) {
//     return {
//       title: 'Progress',
//       icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
//       content: {
//         type: 'iframe',
//         url: t.signUrl('https://eclectic-vacherin-e62270.netlify.app/index.html'),
//         height: 800
//       }
//     };
//   },

//   'card-buttons': function(t) {
//     return [{
//       icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
//       text: 'Progress',
//       callback: function(t){
//         return t.navigate({
//           panel: 'progress-panel'
//         });
//       }
//     }];
//   },

//   'card-badges': function(t){
//     return t.get('card', 'shared', 'progress')
//       .then(function(progress){
//         if (!progress) return [];
//         return [{
//           text: progress + '%',
//           color: progress >= 100 ? 'green' : 'blue'
//         }];
//       });
//   }

// });


/* global TrelloPowerUp */

var ICON = 'https://cdn-icons-png.flaticon.com/512/992/992651.png';

TrelloPowerUp.initialize({

  // 1️⃣ CARD BUTTON → opens popup UI
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

  // 2️⃣ BADGE → shows saved progress
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


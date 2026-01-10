/* global TrelloPowerUp */

TrelloPowerUp.initialize({

  'card-buttons': function(t) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
      text: 'Progress',
      callback: function(t){
        return t.boardBar({
          title: 'Progress Settings',
          url: 'https://eclectic-vacherin-e62270.netlify.app/index.html',
          height: 900  // adjust if needed
        });
      }
    }];
  },

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

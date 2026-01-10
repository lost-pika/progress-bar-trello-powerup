/* global TrelloPowerUp */

TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png', // any icon URL
      text: 'Open Progress UI',
      callback: function(t){
        return t.popup({
          title: 'Progress',
          url: './index.html',   // 👈 your React app UI
          height: 750
        });
      }
    }];
  }
});

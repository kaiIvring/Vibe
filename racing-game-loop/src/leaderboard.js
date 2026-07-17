function createLeaderboard(storage) {
  var st = storage || { getItem: function () { return '[]'; }, setItem: function () {} };
  var scores = [];

  function load() {
    try { scores = JSON.parse(st.getItem('racing-scores') || '[]'); }
    catch (e) { scores = []; }
  }

  function save() {
    st.setItem('racing-scores', JSON.stringify(scores));
  }

  load();

  return {
    getScores: function () {
      return scores.slice().sort(function (a, b) { return b.score - a.score; });
    },
    addScore: function (name, score) {
      scores.push({ name: name, score: score, date: Date.now() });
      save();
    },
    clearScores: function () {
      scores.length = 0;
      save();
    }
  };
}

if (typeof module !== 'undefined') {
  module.exports = { createLeaderboard };
}

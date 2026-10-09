/* Split-flap board: each tile flips through the alphabet until it reaches
   the next word's letter, the way an airport departure board does.

   FlapBoard.create(element, { words, hold }) -> { play, stop, show }
*/
(function () {
  var ALPHABET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ&-";
  var MAX_STEPS = 12;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function buildTile() {
    var tile = document.createElement("span");
    tile.className = "flap";
    tile.innerHTML =
      '<span class="flap-half flap-top"><span> </span></span>' +
      '<span class="flap-half flap-bottom"><span> </span></span>' +
      '<span class="flap-half flap-top flap-leaf"><span> </span></span>' +
      '<span class="flap-half flap-bottom flap-leaf"><span> </span></span>';
    tile.dataset.ch = " ";
    return tile;
  }

  function setTile(tile, ch) {
    for (var i = 0; i < 4; i++) tile.children[i].firstChild.textContent = ch;
    tile.classList.remove("is-flipping");
    tile.dataset.ch = ch;
  }

  function flipOnce(tile, next, duration) {
    var parts = tile.children;
    var current = tile.dataset.ch;
    parts[0].firstChild.textContent = next;    // revealed behind the falling leaf
    parts[1].firstChild.textContent = current; // stays visible until the new leaf lands
    parts[2].firstChild.textContent = current;
    parts[3].firstChild.textContent = next;
    tile.style.setProperty("--flip", duration + "ms");
    tile.classList.remove("is-flipping");
    void tile.offsetWidth; // restart the animation
    tile.classList.add("is-flipping");
    tile.dataset.ch = next;
  }

  function stepsBetween(from, to) {
    var i = Math.max(0, ALPHABET.indexOf(from));
    var j = Math.max(0, ALPHABET.indexOf(to));
    var steps = [];
    while (i !== j) {
      i = (i + 1) % ALPHABET.length;
      steps.push(ALPHABET[i]);
    }
    return steps.slice(-MAX_STEPS);
  }

  function create(el, options) {
    var words = options.words.map(function (w) { return w.toUpperCase(); });
    var hold = options.hold || 3200;
    var duration = options.flip || 70;
    var length = Math.max.apply(null, words.map(function (w) { return w.length; }));
    var tiles = [];
    var timers = [];
    var index = -1;
    var playing = false;

    el.textContent = "";
    for (var t = 0; t < length; t++) {
      var tile = buildTile();
      tiles.push(tile);
      el.appendChild(tile);
    }

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function show(i, animate) {
      index = i % words.length;
      var word = words[index];
      var longest = 0;
      tiles.forEach(function (tile, k) {
        var target = word[k] || " ";
        if (!animate || reduceMotion.matches) return setTile(tile, target);
        var steps = stepsBetween(tile.dataset.ch, target);
        var delay = k * 35;
        steps.forEach(function (ch, s) {
          later(function () { flipOnce(tile, ch, duration); }, delay + s * duration);
        });
        longest = Math.max(longest, delay + steps.length * duration);
      });
      return longest;
    }

    function cycle() {
      if (!playing) return;
      var took = show(index + 1, true);
      if (reduceMotion.matches) return; // hold still on the first word
      later(cycle, took + hold);
    }

    return {
      play: function () {
        if (playing) return;
        playing = true;
        cycle();
      },
      stop: function () {
        playing = false;
        clearTimers();
      },
      show: function (i) { show(i, false); }
    };
  }

  window.FlapBoard = { create: create };
})();

(function () {
  "use strict";

  /* =====================================================================
     INSTELLINGEN
     ===================================================================== */

  // Woord dat rond de foto verschijnt, per vervoersmiddel
  var WOORD = { voet: "Wandel", fiets: "Fiets", trein: "Trein" };

  // Wil je echte geluiden gebruiken in plaats van de ingebouwde?
  // Zet dan hier het pad, bv. voet: "geluiden/voetstappen.mp3"
  // (leeg laten = ingebouwd geluid). Elk geluid wordt na 3 seconden gestopt.
  var GELUID_BESTANDEN = { voet: "", fiets: "", trein: "" };

  var GELUID_DUUR = 3; // seconden

  /* ---------------------------------------------------------------------
     DE FOTO'S
     g  = vervoersmiddel: "voet" | "fiets" | "trein"   <- hier wijzig je de indeling
     r  = verhouding breedte/hoogte (wordt automatisch gecorrigeerd na laden)
     w  = breedte in chaos-stand (% van paginabreedte)
     wo = breedte in orde-stand, xo / yo = plek in orde-stand (% van breedte / hoogte)
     --------------------------------------------------------------------- */
  var FOTOS = [
    // te voet
    { g: "voet",  src: "beelden/voet-kerk.jpg",            r: 1.34, w: 18.4, wo: 11.4, xo: 8.28,  yo: 4.74  },
    { g: "voet",  src: "beelden/voet-wolken.jpg",          r: 1.34, w: 17.3, wo: 14.0, xo: 8.28,  yo: 18.04 },
    { g: "voet",  src: "beelden/voet-graffiti.jpg",        r: 1.34, w: 19.6, wo: 13.6, xo: 8.28,  yo: 34.24 },
    { g: "voet",  src: "beelden/voet-park.jpg",            r: 1.34, w: 18.7, wo: 10.7, xo: 8.28,  yo: 50.92 },
    { g: "voet",  src: "beelden/voet-avond.jpg",           r: 1.34, w: 9.6,  wo: 9.6,  xo: 8.28,  yo: 63.55 },
    { g: "voet",  src: "beelden/voet-koeien.jpg",          r: 1.34, w: 13.8, wo: 13.8, xo: 8.28,  yo: 74.75 },

    // fiets
    { g: "fiets", src: "beelden/fiets-kanaal.jpg",         r: 0.75, w: 10.1, wo: 10.2, xo: 41.51, yo: 8.0   },
    { g: "fiets", src: "beelden/fiets-speeltuin.jpg",      r: 1.34, w: 17.8, wo: 17.8, xo: 53.31, yo: 8.0   },
    { g: "fiets", src: "beelden/fiets-baksteen.jpg",       r: 1.34, w: 13.0, wo: 13.0, xo: 41.51, yo: 29.43 },
    { g: "fiets", src: "beelden/fiets-straat.jpg",         r: 1.34, w: 20.2, wo: 20.2, xo: 41.51, yo: 45.01 },
    { g: "fiets", src: "beelden/fiets-boom.jpg",           r: 0.75, w: 10.3, wo: 10.4, xo: 41.51, yo: 68.1  },

    // trein
    { g: "trein", src: "beelden/trein-regenboog.jpg",      r: 0.75, w: 13.4, wo: 13.4, xo: 81.53, yo: 9.05  },
    { g: "trein", src: "beelden/trein-zonsondergang.jpg",  r: 1.34, w: 16.2, wo: 16.2, xo: 78.75, yo: 36.21 },
    { g: "trein", src: "beelden/trein-bovenleiding.jpg",   r: 1.34, w: 17.2, wo: 17.2, xo: 77.79, yo: 54.8  },
    { g: "trein", src: "beelden/trein-stam.jpg",           r: 1.34, w: 12.1, wo: 13.3, xo: 81.66, yo: 74.94 }
  ];

  /* =====================================================================
     LAYOUT
     ===================================================================== */

  var RATIO = 2296 / 1624;               // verhouding van het ontwerp
  var stage = document.getElementById("stage");
  var woordenLaag = document.getElementById("woorden");
  var stand = { voet: "chaos", fiets: "chaos", trein: "chaos" };
  var W, H, X0;

  function meet() {
    W = Math.min(window.innerWidth, window.innerHeight * RATIO);
    H = W / RATIO;
    X0 = (window.innerWidth - W) / 2;
    document.documentElement.style.setProperty("--u", (W / 100) + "px");
  }

  function schud(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function overlap(a, b) {
    var dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    var dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return dx > 0 && dy > 0 ? dx * dy : 0;
  }

  // Elke keer dat de pagina opent: nieuwe willekeurige schikking
  function genereerChaos() {
    var marge = 0.02 * W;
    var geplaatst = [];
    schud(FOTOS.slice()).forEach(function (f, i) {
      var w = f.w / 100 * W, h = w / f.r;
      var beste = null, score = Infinity;
      for (var k = 0; k < 5; k++) {
        var fx = Math.random(), fy = Math.random();
        var r = {
          x: marge + fx * (W - 2 * marge - w),
          y: 0.03 * H + fy * (0.92 * H - 0.03 * H - h),
          w: w, h: h, fx: fx, fy: fy
        };
        var s = 0;
        geplaatst.forEach(function (p) { s += overlap(r, p); });
        if (r.x < 0.23 * W && r.y + h > 0.9 * H) s += 1e12; // niet over de knopjes
        if (s < score) { score = s; beste = r; }
      }
      f.fx = beste.fx; f.fy = beste.fy; f.z = i + 1;
      geplaatst.push(beste);
    });
  }

  function plaats() {
    var marge = 0.02 * W;
    FOTOS.forEach(function (f) {
      var el = f.el, w, left, top;
      if (stand[f.g] === "orde") {
        w = f.wo / 100 * W;
        left = X0 + f.xo / 100 * W;
        top = f.yo / 100 * H;
      } else {
        w = f.w / 100 * W;
        var h = w / f.r;
        left = X0 + marge + f.fx * (W - 2 * marge - w);
        top = 0.03 * H + f.fy * (0.92 * H - 0.03 * H - h);
      }
      el.style.width = w + "px";
      el.style.left = left + "px";
      el.style.top = top + "px";
      el.style.zIndex = f.z;
    });
  }

  function bouw() {
    FOTOS.forEach(function (f) {
      var d = document.createElement("div");
      d.className = "foto";
      d.style.aspectRatio = String(f.r);
      var img = new Image();
      img.alt = "";
      img.draggable = false;
      img.onload = function () {
        if (img.naturalWidth && img.naturalHeight) {
          f.r = img.naturalWidth / img.naturalHeight;
          d.style.aspectRatio = String(f.r);
          plaats();
        }
      };
      img.src = f.src;
      d.appendChild(img);
      stage.appendChild(d);
      f.el = d;

      d.addEventListener("pointerenter", function () { hoverAan(f); });
      d.addEventListener("pointerleave", function () { hoverUit(); });
      d.addEventListener("pointerdown", function () { audio(); });
    });
  }

  /* =====================================================================
     WOORDEN ROND DE FOTO
     ===================================================================== */

  function wisWoorden() {
    while (woordenLaag.firstChild) woordenLaag.removeChild(woordenLaag.firstChild);
  }

  function toonWoorden(f) {
    wisWoorden();
    var r = f.el.getBoundingClientRect();
    var u = W / 100;
    var wb = 7 * u, hb = 3 * u;
    var aantal = 9;

    for (var i = 0; i < aantal; i++) {
      var s = document.createElement("span");
      s.className = "woord woord-" + f.g;
      s.textContent = WOORD[f.g];

      var kant = Math.floor(Math.random() * 4);
      var t = Math.random();
      var d = (-0.5 + Math.random() * 2.4) * u;   // negatief = over de rand van de foto
      var x, y;
      if (kant === 0)      { x = r.left + t * r.width - wb / 2; y = r.top - hb - d; }
      else if (kant === 1) { x = r.left + t * r.width - wb / 2; y = r.bottom + d; }
      else if (kant === 2) { x = r.left - wb - d;               y = r.top + t * r.height - hb / 2; }
      else                 { x = r.right + d;                   y = r.top + t * r.height - hb / 2; }

      x = Math.max(0.5 * u, Math.min(window.innerWidth - wb - 0.5 * u, x));
      y = Math.max(0.5 * u, Math.min(window.innerHeight - hb - 0.5 * u, y));
      s.style.left = x + "px";
      s.style.top = y + "px";
      woordenLaag.appendChild(s);
    }
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(woordenLaag.children, function (s) { s.classList.add("zichtbaar"); });
    });
  }

  function hoverAan(f) {
    toonWoorden(f);
    speelGeluid(f.g);
  }

  function hoverUit() {
    wisWoorden();   // het geluid loopt gewoon door tot de 3 seconden om zijn
  }

  /* =====================================================================
     GELUID (3 seconden) — ingebouwd via Web Audio, of eigen bestanden
     ===================================================================== */

  var ctx = null, ruis = null, actief = {};

  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      ruis = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var data = ruis.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  ["pointerdown", "keydown", "touchstart", "click"].forEach(function (e) {
    window.addEventListener(e, function () { audio(); }, { passive: true });
  });

  function ruisBron(t0, duur) {
    var s = ctx.createBufferSource();
    s.buffer = ruis;
    s.loop = true;
    s.start(t0, Math.random());
    s.stop(t0 + duur);
    return s;
  }

  function omhulling(g, t, piek, duur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(piek, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duur);
  }

  function voetstap(dest, t, hoog) {
    var s = ruisBron(t, 0.15);
    var f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = hoog ? 1600 : 1000;
    var e = ctx.createGain();
    omhulling(e, t, 0.5, 0.1);
    s.connect(f); f.connect(e); e.connect(dest);

    var o = ctx.createOscillator();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.1);
    var eo = ctx.createGain();
    omhulling(eo, t, 0.7, 0.12);
    o.connect(eo); eo.connect(dest);
    o.start(t); o.stop(t + 0.16);
  }

  function spoorKlak(dest, t) {
    var s = ruisBron(t, 0.1);
    var f = ctx.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.8;
    var e = ctx.createGain();
    omhulling(e, t, 0.45, 0.07);
    s.connect(f); f.connect(e); e.connect(dest);

    var o = ctx.createOscillator();
    o.frequency.value = 90;
    var eo = ctx.createGain();
    omhulling(eo, t, 0.4, 0.09);
    o.connect(eo); eo.connect(dest);
    o.start(t); o.stop(t + 0.12);
  }

  function belDing(dest, t) {
    [[2800, 0.28], [4210, 0.14], [5600, 0.06]].forEach(function (p) {
      var o = ctx.createOscillator();
      o.type = "sine"; o.frequency.value = p[0];
      var e = ctx.createGain();
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(p[1], t + 0.004);
      e.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(e); e.connect(dest);
      o.start(t); o.stop(t + 0.6);
    });
  }

  function synth(type) {
    var c = audio();
    if (!c) return null;
    var t0 = c.currentTime + 0.02;
    var g = c.createGain();
    g.connect(c.destination);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.9, t0 + 0.05);
    g.gain.setValueAtTime(0.9, t0 + GELUID_DUUR - 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + GELUID_DUUR);

    var i;
    if (type === "voet") {
      for (i = 0; i < 6; i++) voetstap(g, t0 + 0.1 + i * 0.48, i % 2);
    } else if (type === "trein") {
      var rum = ruisBron(t0, GELUID_DUUR);
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 220;
      var rg = ctx.createGain(); rg.gain.value = 0.5;
      rum.connect(lp); lp.connect(rg); rg.connect(g);
      for (i = 0; i < 7; i++) {
        spoorKlak(g, t0 + 0.1 + i * 0.42);
        spoorKlak(g, t0 + 0.21 + i * 0.42);
      }
    } else {
      [0, 0.14, 0.95, 1.09, 1.9, 2.04].forEach(function (d) { belDing(g, t0 + d); });
    }

    return {
      stop: function () {
        try {
          g.gain.cancelScheduledValues(ctx.currentTime);
          g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02);
        } catch (e) {}
        setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 200);
      }
    };
  }

  function bestand(pad) {
    var a = new Audio(pad);
    a.play().catch(function () {});
    var timer = setTimeout(function () { a.pause(); }, GELUID_DUUR * 1000);
    return { stop: function () { clearTimeout(timer); a.pause(); a.currentTime = 0; } };
  }

  function speelGeluid(type) {
    if (actief[type]) actief[type].stop();
    actief[type] = GELUID_BESTANDEN[type] ? bestand(GELUID_BESTANDEN[type]) : synth(type);
  }

  /* =====================================================================
     KNOPJES: CHAOS / ORDE (elk vervoersmiddel los van de andere)
     ===================================================================== */

  Array.prototype.forEach.call(document.querySelectorAll(".groep"), function (groep) {
    var g = groep.getAttribute("data-groep");
    var schakelaar = groep.querySelector(".schakelaar");
    Array.prototype.forEach.call(schakelaar.querySelectorAll("button"), function (knop) {
      knop.addEventListener("click", function () {
        stand[g] = knop.getAttribute("data-stand");
        schakelaar.setAttribute("data-stand", stand[g]);
        plaats();
        wisWoorden();
      });
    });
  });

  /* =====================================================================
     START
     ===================================================================== */

  meet();
  bouw();
  genereerChaos();
  plaats();
  // animatie pas aanzetten na de eerste plaatsing
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { stage.classList.add("anim"); });
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    stage.classList.remove("anim");
    meet();
    plaats();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { stage.classList.add("anim"); }, 100);
  });
})();

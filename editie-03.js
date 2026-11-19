(function () {
  "use strict";

  /* =====================================================================
     WELK APPARAAT?  gsm -> fiets,  laptop / groter scherm -> trein
     ===================================================================== */

  var telefoon =
    window.matchMedia("(max-width: 767px)").matches ||
    (window.matchMedia("(pointer: coarse)").matches &&
      Math.min(window.innerWidth, window.innerHeight) <= 500);

  var scene = document.getElementById(telefoon ? "scene-fiets" : "scene-trein");
  scene.hidden = false;

  var SW = telefoon ? 1170 : 2296;     // ontwerpbreedte
  var SH = telefoon ? 1560 : 1624;     // ontwerphoogte
  var s = 1;

  function schaal() {
    s = telefoon
      ? window.innerWidth / SW
      : Math.min(window.innerWidth / SW, window.innerHeight / SH);
    scene.style.width = SW + "px";
    scene.style.height = SH + "px";
    scene.style.transform = "translateX(-50%) scale(" + s + ")";
  }
  schaal();
  window.addEventListener("resize", schaal);

  /* ===== hulpfuncties ===== */

  function tween(duur, ease, fn) {
    return new Promise(function (klaar) {
      var t0 = null;
      function stap(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / duur);
        fn(ease(p));
        if (p < 1) requestAnimationFrame(stap); else klaar();
      }
      requestAnimationFrame(stap);
    });
  }
  var easeIn = function (p) { return p * p * p; };
  var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };

  function kleurKiezer(id, bijWissel) {
    var knoppen = document.querySelectorAll("#" + id + " .kleur");
    Array.prototype.forEach.call(knoppen, function (k) {
      k.addEventListener("click", function () {
        Array.prototype.forEach.call(knoppen, function (x) { x.classList.remove("actief"); });
        k.classList.add("actief");
        bijWissel(k.getAttribute("data-kleur"));
      });
    });
    return function (uit) {
      Array.prototype.forEach.call(knoppen, function (k) { k.disabled = uit; });
    };
  }

  /* =====================================================================
     TREIN  (laptop / groot scherm)
     ===================================================================== */

  function initTrein() {
    var L = 6500, Y0 = 600, H = 600, N = 6;   // lengte, y-start, hoogte, aantal wagons
    var TREIN_EINDE = 6469;                   // x van het einde van de laatste wagon
    var container = document.getElementById("trein");
    var knop = document.getElementById("stap-op");
    var resetKnop = document.getElementById("reset");

    // ---- de trein tekenen (svg) en tegelijk de omtrek voor het graffiti-masker verzamelen ----
    var BODY = "M38 754 H1000 Q1038 754 1038 792 V1074 Q1038 1111 1000 1111 H38 Q0 1111 0 1074 V792 Q0 754 38 754Z";
    var NOSE = "M1030 755 H248 C200 758 172 790 150 818 L35 960 C10 995 0 1030 0 1070 C0 1100 15 1112 40 1112 H1022 C1034 1112 1038 1100 1038 1085 V772 C1038 762 1036 755 1030 755Z";
    var BL = "#0000ff";

    var masker = new Path2D();   // in canvas-coördinaten (y = scène-y min Y0)
    var svg = "";

    function ramen(x, n) {
      var r = '<rect x="' + x + '" y="803" width="' + (n * 105 + 4) + '" height="142" fill="' + BL + '"/>';
      for (var i = 0; i < n; i++) {
        r += '<rect x="' + (x + 10 + 105 * i) + '" y="820" width="94" height="105" fill="#fff"/>';
      }
      return r;
    }
    function deur() {
      return '<rect x="463" y="795" width="114" height="297" rx="10" fill="#fff" stroke="' + BL + '" stroke-width="10"/>' +
             '<rect x="513" y="800" width="12" height="285" fill="' + BL + '"/>' +
             '<rect x="477" y="812" width="30" height="262" rx="8" fill="none" stroke="' + BL + '" stroke-width="6"/>' +
             '<rect x="531" y="812" width="30" height="262" rx="8" fill="none" stroke="' + BL + '" stroke-width="6"/>';
    }
    function boog(x) {
      return '<path transform="translate(' + x + ',1112)" fill="' + BL + '" d="M0 0 C8 30 18 48 40 50 C60 51 78 40 100 48 C125 56 138 38 142 0Z"/>';
    }
    function pant(x) {
      return '<path fill="' + BL + '" d="M' + x + ' 752 Q' + (x + 10) + ' 726 ' + (x + 37) + ' 722 H' + (x + 115) + ' Q' + (x + 140) + ' 724 ' + (x + 150) + ' 752Z"/>' +
             '<path fill="none" stroke="' + BL + '" stroke-width="16" stroke-linecap="round" d="M' + (x + 65) + ' 724 C' + (x + 90) + ' 700 ' + (x + 97) + ' 676 ' + (x + 75) + ' 650 C' + (x + 65) + ' 636 ' + (x + 65) + ' 622 ' + (x + 71) + ' 612"/>';
    }

    function wagen(x0, neus, flip, pantX) {
      var t = flip ? "translate(" + (x0 + 1038) + ",0) scale(-1,1)" : "translate(" + x0 + ",0)";
      var g = '<g transform="' + t + '">';
      g += '<path d="' + (neus ? NOSE : BODY) + '" fill="#fff" stroke="' + BL + '" stroke-width="18" stroke-linejoin="round"/>';
      if (neus) {
        g += '<path d="M148 848 C150 862 150 930 148 948 H55 C80 905 112 868 148 848Z" fill="#fff" stroke="' + BL + '" stroke-width="10" stroke-linejoin="round"/>';
      } else {
        g += ramen(28, 4);
      }
      g += deur() + ramen(583, 4) + boog(115) + boog(770);
      if (pantX !== null) g += pant(pantX);
      g += "</g>";

      var m = flip
        ? new DOMMatrix().translate(x0 + 1038, -Y0).scale(-1, 1)
        : new DOMMatrix().translate(x0, -Y0);
      masker.addPath(new Path2D(neus ? NOSE : BODY), m);
      return g;
    }

    for (var i = 0; i < N; i++) {
      var x0 = i === 0 ? 150 : 1207 + 1056 * (i - 1);
      var neus = (i === 0 || i === N - 1);
      var flip = (i === N - 1);
      var pantX = (i % 2 === 0) ? (i === 0 ? 330 : 575) : null;
      svg += wagen(x0, neus, flip, pantX);
    }

    container.innerHTML =
      '<svg viewBox="0 ' + Y0 + " " + L + " " + H + '" width="' + L + '" height="' + H + '">' + svg + "</svg>" +
      '<canvas width="' + L + '" height="' + H + '"></canvas>';

    var canvas = container.querySelector("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clip(masker);                       // graffiti alleen binnen de trein

    document.body.style.cursor = "grab";    // buiten de trein kun je slepen

    // ---- beginpositie: de trein staat deels buiten beeld ----
    var tx = -700;
    function zetTrein(x) { tx = x; container.style.transform = "translateX(" + x + "px)"; }
    zetTrein(tx);

    // grenzen voor het slepen: altijd een stuk trein in beeld
    function klem(x) {
      var extra = ((window.innerWidth - SW * s) / 2) / s;
      var rechts = SW + extra;
      var min = rechts - TREIN_EINDE;
      var max = 0;
      if (min > max) min = max;
      return Math.max(min, Math.min(max, x));
    }
    window.addEventListener("resize", function () { zetTrein(klem(tx)); });

    // ---- graffiti spuiten (smallere brush) ----
    var RGB = { blauw: [0, 0, 255], wit: [255, 255, 255], geel: [255, 255, 0] };
    var kleur = RGB.blauw;
    var bezig = false, tekent = false, pos = null, last = null, rafId = 0;
    var R = 19;                              // brushstraal (was 28)

    var zetUit = kleurKiezer("kleuren-trein", function (k) { kleur = RGB[k]; });

    function rgba(a) { return "rgba(" + kleur[0] + "," + kleur[1] + "," + kleur[2] + "," + a + ")"; }

    function spuit(x, y) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, rgba(0.22));
      g.addColorStop(0.6, rgba(0.1));
      g.addColorStop(1, rgba(0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fill();

      for (var i = 0; i < 9; i++) {
        var a = Math.random() * Math.PI * 2;
        var d = R * 1.15 * Math.pow(Math.random(), 0.65);
        ctx.fillStyle = rgba(0.45 + Math.random() * 0.5);
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.5 + Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function lijn(a, b) {
      var dx = b.x - a.x, dy = b.y - a.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      var n = Math.max(1, Math.ceil(d / 4));
      for (var i = 1; i <= n; i++) spuit(a.x + dx * i / n, a.y + dy * i / n);
    }

    function punt(e) {
      var r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * canvas.width / r.width,
        y: (e.clientY - r.top) * canvas.height / r.height
      };
    }

    function lus() {
      if (!tekent) return;
      if (pos) spuit(pos.x, pos.y);       // stil blijven houden = meer verf
      rafId = requestAnimationFrame(lus);
    }

    // ---- tekenen binnen de trein, slepen overal daarbuiten ----
    var modus = null;                      // "teken" | "sleep" | null
    var startX = 0, startTx = 0;

    function isKnop(t) {
      return t && t.closest && t.closest("button, a, .kleuren");
    }

    window.addEventListener("pointerdown", function (e) {
      if (bezig || modus) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (isKnop(e.target)) return;

      if (e.target === canvas) {
        var p = punt(e);
        if (ctx.isPointInPath(masker, p.x, p.y)) {
          e.preventDefault();
          modus = "teken";
          tekent = true;
          pos = last = p;
          spuit(p.x, p.y);
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(lus);
          return;
        }
      }
      // niet op de trein getikt: de trein slepen
      modus = "sleep";
      startX = e.clientX;
      startTx = tx;
      document.body.classList.add("sleept");
    });

    window.addEventListener("pointermove", function (e) {
      if (modus === "teken") {
        var p = punt(e);
        lijn(last, p);
        last = pos = p;
      } else if (modus === "sleep") {
        zetTrein(klem(startTx + (e.clientX - startX) / s));
      } else if (!bezig && e.target === canvas) {
        var q = punt(e);
        canvas.style.cursor = ctx.isPointInPath(masker, q.x, q.y) ? "crosshair" : "grab";
      }
    });

    function einde() {
      modus = null;
      tekent = false;
      document.body.classList.remove("sleept");
    }
    window.addEventListener("pointerup", einde);
    window.addEventListener("pointercancel", einde);
    window.addEventListener("blur", einde);

    // trackpad / muiswiel (zijwaarts of met shift) en pijltjestoetsen schuiven de trein ook
    window.addEventListener("wheel", function (e) {
      if (bezig) return;
      var dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (!dx) return;
      e.preventDefault();
      zetTrein(klem(tx - dx / s));
    }, { passive: false });

    window.addEventListener("keydown", function (e) {
      if (bezig) return;
      if (e.key === "ArrowLeft")  zetTrein(klem(tx + 200));
      if (e.key === "ArrowRight") zetTrein(klem(tx - 200));
    });

    // ---- reset: alle graffiti weg ----
    resetKnop.addEventListener("click", function () {
      if (bezig) return;
      tekent = false;
      canvas.width = L;                    // wist alles (en zet ook het masker terug)
      ctx.clip(masker);
    });

    // ---- stap op: de trein rijdt rechts weg, komt links terug en stopt ----
    knop.addEventListener("click", function () {
      if (bezig) return;
      bezig = true; tekent = false; modus = null;
      knop.disabled = true; resetKnop.disabled = true; zetUit(true);

      var zichtbaarLinks = -((window.innerWidth - SW * s) / 2) / s;
      var zichtbaarRechts = SW + ((window.innerWidth - SW * s) / 2) / s;
      var uit = zichtbaarRechts - 140 + 40;           // neus voorbij de rechterrand
      var van = zichtbaarLinks - L - 40;              // staart nog links van het beeld
      var begin = tx;

      tween(2600, easeIn, function (p) { zetTrein(begin + (uit - begin) * p); })
        .then(function () {
          zetTrein(van);
          return tween(4500, easeOut, function (p) { zetTrein(van + (0 - van) * p); });
        })
        .then(function () {
          bezig = false;
          knop.disabled = false; resetKnop.disabled = false; zetUit(false);
        });
    });
  }

  /* =====================================================================
     FIETS  (gsm)
     ===================================================================== */

  function initFiets() {
    var ZX = 250, ZY = 640, ZW = 660, ZH = 470, K = 2;      // tekenvlak (ontwerpeenheden) + resolutie
    var HUB_L = { x: 418, y: 915 }, HUB_R = { x: 739, y: 912 };
    var SPLIT = 579;                                        // links van de lijn = achterwiel
    var WIEL_R = 105;                                       // straal voor het draaien

    var groep = document.getElementById("fiets-groep");
    var tek = document.getElementById("wiel-tekening");
    var cL = document.getElementById("wiel-l");
    var cR = document.getElementById("wiel-r");
    var knop = document.getElementById("vertrek");

    [tek, cL, cR].forEach(function (c) { c.width = ZW * K; c.height = ZH * K; });
    var ctx = tek.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    var modus = "blauw";
    var zetUit = kleurKiezer("kleuren-fiets", function (k) { modus = k; });
    var tekent = false, last = null, bezig = false;

    function punt(e) {
      var r = tek.getBoundingClientRect();
      return { x: (e.clientX - r.left) * tek.width / r.width, y: (e.clientY - r.top) * tek.height / r.height };
    }
    function j() { return (Math.random() - 0.5) * 2.4 * K; }

    function lijn(a, b) {
      if (modus === "wit") {                              // gom
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 40 * K;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        return;
      }
      ctx.strokeStyle = "#0000ff";                        // stift, met licht ruwe rand
      for (var i = 0; i < 2; i++) {
        ctx.lineWidth = (i ? 5 : 7) * K;
        ctx.beginPath();
        ctx.moveTo(a.x + j(), a.y + j());
        ctx.lineTo(b.x + j(), b.y + j());
        ctx.stroke();
      }
    }

    tek.addEventListener("pointerdown", function (e) {
      if (bezig) return;
      e.preventDefault();
      tek.setPointerCapture(e.pointerId);
      tekent = true;
      last = punt(e);
      lijn(last, { x: last.x + 0.1, y: last.y });
    });
    tek.addEventListener("pointermove", function (e) {
      if (!tekent) return;
      var p = punt(e);
      lijn(last, p);
      last = p;
    });
    function stop() { tekent = false; }
    tek.addEventListener("pointerup", stop);
    tek.addEventListener("pointercancel", stop);
    tek.addEventListener("lostpointercapture", stop);

    function zetOrigin(c, hub) {
      c.style.transformOrigin = (hub.x - ZX) + "px " + (hub.y - ZY) + "px";
    }
    zetOrigin(cL, HUB_L); zetOrigin(cR, HUB_R);

    function zetX(x) { groep.style.transform = "translateX(" + x + "px)"; }
    function draai(a) {
      cL.style.transform = "rotate(" + a + "rad)";
      cR.style.transform = "rotate(" + a + "rad)";
    }

    // wielen = linker- en rechterhelft van de tekening
    function splitsWielen() {
      var cut = (SPLIT - ZX) * K;
      [[cL, 0, cut], [cR, cut, tek.width - cut]].forEach(function (d) {
        var c = d[0], g = c.getContext("2d");
        g.clearRect(0, 0, c.width, c.height);
        g.drawImage(tek, d[1], 0, d[2], tek.height, d[1], 0, d[2], tek.height);
      });
    }

    function bakWielenTerug(a) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, tek.width, tek.height);
      [[cL, HUB_L], [cR, HUB_R]].forEach(function (w) {
        var hx = (w[1].x - ZX) * K, hy = (w[1].y - ZY) * K;
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(a);
        ctx.translate(-hx, -hy);
        ctx.drawImage(w[0], 0, 0);
        ctx.restore();
      });
    }

    knop.addEventListener("click", function () {
      if (bezig) return;
      bezig = true; tekent = false;
      knop.disabled = true; zetUit(true);

      splitsWielen();
      tek.style.display = "none";
      cL.style.display = "block"; cR.style.display = "block";

      var hoek = 0;
      var uit = SW - 300 + 40;      // meest linkse wiel voorbij de rechterrand
      var van = -(860 + 40);        // meest rechtse wiel net links van het beeld
      var vorige = 0;

      zetX(0); draai(0);

      tween(2200, easeIn, function (p) {
        var x = uit * p;
        hoek += (x - vorige) / WIEL_R; vorige = x;
        zetX(x); draai(hoek);
      }).then(function () {
        vorige = van; zetX(van);
        return tween(2800, easeOut, function (p) {
          var x = van + (0 - van) * p;
          hoek += (x - vorige) / WIEL_R; vorige = x;
          zetX(x); draai(hoek);
        });
      }).then(function () {
        bakWielenTerug(hoek);
        cL.style.display = "none"; cR.style.display = "none";
        draai(0);
        tek.style.display = "block";
        bezig = false;
        knop.disabled = false; zetUit(false);
      });
    });
  }

  if (telefoon) initFiets(); else initTrein();
})();

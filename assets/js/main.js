/* ==========================================================================
   Crystal Lights — Site behaviour
   Vanilla JS, no dependencies. Every module guards its own markup.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------------
     Year stamp
     ------------------------------------------------------------------ */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------------
     Sticky header
     ------------------------------------------------------------------ */
  (function stickyHeader() {
    var header = $(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* ------------------------------------------------------------------
     Mobile drawer
     ------------------------------------------------------------------ */
  (function drawer() {
    var burger = $("[data-burger]");
    var panel = $("[data-drawer]");
    if (!burger || !panel) return;

    var close = function () {
      panel.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
    };
    var open = function () {
      panel.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
    };

    burger.addEventListener("click", function () {
      panel.classList.contains("is-open") ? close() : open();
    });

    $$("[data-drawer-close]", panel).forEach(function (el) {
      el.addEventListener("click", close);
    });
    $$("a", panel).forEach(function (a) { a.addEventListener("click", close); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) close();
    });
  })();

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  (function reveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px" });

    items.forEach(function (el, i) {
      // Stagger siblings that share a parent unless an explicit delay is set.
      if (!el.style.getPropertyValue("--d")) {
        var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.setProperty("--d", Math.min(idx, 6) * 70 + "ms");
      }
      io.observe(el);
    });
  })();

  /* ------------------------------------------------------------------
     Card cursor glow
     ------------------------------------------------------------------ */
  (function cardGlow() {
    if (reduceMotion || window.matchMedia("(hover: none)").matches) return;
    $$(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  })();

  /* ------------------------------------------------------------------
     Count-up statistics
     ------------------------------------------------------------------ */
  (function counters() {
    var nodes = $$("[data-count]");
    if (!nodes.length) return;

    var render = function (el, value) {
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      var str = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-CA");
      el.textContent = (el.dataset.prefix || "") + str + (el.dataset.suffix || "");
    };

    var run = function (el) {
      var target = parseFloat(el.dataset.count);
      if (reduceMotion) { render(el, target); return; }
      var start = performance.now();
      var dur = 1600;
      var tick = function (now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        render(el, target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) { nodes.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    nodes.forEach(function (el) { render(el, 0); io.observe(el); });
  })();

  /* ------------------------------------------------------------------
     Before / after reveal sliders
     ------------------------------------------------------------------ */
  (function revealSliders() {
    $$("[data-reveal-slider]").forEach(function (box) {
      var set = function (clientX) {
        var r = box.getBoundingClientRect();
        var pct = ((clientX - r.left) / r.width) * 100;
        box.style.setProperty("--pos", Math.max(0, Math.min(100, pct)) + "%");
      };

      var dragging = false;
      box.addEventListener("pointerdown", function (e) {
        dragging = true;
        box.setPointerCapture(e.pointerId);
        set(e.clientX);
      });
      box.addEventListener("pointermove", function (e) { if (dragging) set(e.clientX); });
      box.addEventListener("pointerup", function () { dragging = false; });
      box.addEventListener("pointercancel", function () { dragging = false; });

      // Keyboard support on the grip
      var grip = $(".reveal-slider__grip", box);
      if (grip) {
        grip.setAttribute("tabindex", "0");
        grip.setAttribute("role", "slider");
        grip.setAttribute("aria-label", "Compare images");
        grip.setAttribute("aria-valuemin", "0");
        grip.setAttribute("aria-valuemax", "100");
        grip.setAttribute("aria-valuenow", "50");
        grip.style.pointerEvents = "auto";
        grip.addEventListener("keydown", function (e) {
          var cur = parseFloat(box.style.getPropertyValue("--pos")) || 50;
          var next = cur;
          if (e.key === "ArrowLeft") next = cur - 4;
          else if (e.key === "ArrowRight") next = cur + 4;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = 100;
          else return;
          e.preventDefault();
          next = Math.max(0, Math.min(100, next));
          box.style.setProperty("--pos", next + "%");
          grip.setAttribute("aria-valuenow", String(Math.round(next)));
        });
      }
    });
  })();

  /* ------------------------------------------------------------------
     Colour studio
     ------------------------------------------------------------------ */
  (function colourStudio() {
    var stage = document.querySelector("[data-studio-stage]");
    if (!stage) return;

    var img = stage.querySelector("img");
    var label = document.querySelector("[data-studio-label]");
    var intensity = document.querySelector("[data-studio-intensity]");

    // The stage photograph is lit emerald green. Everything is expressed as a
    // rotation away from that base hue, so the house genuinely re-lights
    // instead of having a flat colour painted over the sky.
    var BASE_HUE = 142;

    var hueOf = function (hex) {
      var n = parseInt(hex.slice(1), 16);
      var r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
      if (!d) return { h: 0, s: 0 };
      var h;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = Math.round(h * 60);
      return { h: h < 0 ? h + 360 : h, s: d / max };
    };

    var state = { colour: "#ffd166", sat: 0.6, bright: 1.06, spectrum: false, off: false };

    var paint = function () {
      var f = intensity ? parseInt(intensity.value, 10) / 100 : 0.78;

      if (state.off) {
        stage.classList.remove("is-spectrum");
        img.style.filter = "saturate(0.16) brightness(0.34)";
        stage.style.setProperty("--glow", "0");
        return;
      }

      if (state.spectrum) {
        stage.classList.add("is-spectrum");
        img.style.filter = "";
        stage.style.setProperty("--glow", (0.16 + f * 0.24).toFixed(3));
        return;
      }

      stage.classList.remove("is-spectrum");
      var hs = hueOf(state.colour);
      var rot = hs.s < 0.12 ? 0 : (hs.h - BASE_HUE + 360) % 360;
      var brightness = (state.bright * (0.78 + f * 0.42)).toFixed(3);
      img.style.filter =
        "hue-rotate(" + rot + "deg) saturate(" + state.sat + ") brightness(" + brightness + ")";
      stage.style.setProperty("--tint", state.colour);
      stage.style.setProperty("--glow", (0.12 + f * 0.3).toFixed(3));
    };

    var select = function (group, btn) {
      document.querySelectorAll("[data-swatch],[data-preset]").forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
      });
      btn.setAttribute("aria-pressed", "true");
    };

    // Presets carry their own saturation/brightness character.
    var PRESETS = {
      warm: { colour: "#ffd166", sat: 0.55, bright: 1.1, label: "Warm White" },
      christmas: { colour: "#e5484d", sat: 1.5, bright: 1.0, label: "Christmas Red" },
      halloween: { colour: "#ff7a1a", sat: 1.55, bright: 1.02, label: "Halloween Orange" },
      diwali: { colour: "#ffb020", sat: 1.3, bright: 1.08, label: "Diwali Gold" },
      canada: { colour: "#ff2d4f", sat: 1.6, bright: 1.0, label: "Canada Day Red" }
    };

    document.querySelectorAll("[data-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        select("preset", btn);
        var key = btn.dataset.preset;

        if (key === "off") {
          state.off = true;
          state.spectrum = false;
          if (label) label.textContent = "Lights off — the daytime look";
          paint();
          return;
        }

        state.off = false;

        if (key === "spectrum") {
          state.spectrum = true;
          if (label) label.textContent = "Full Spectrum";
          paint();
          return;
        }

        var p = PRESETS[key];
        if (!p) return;
        state.spectrum = false;
        state.colour = p.colour;
        state.sat = p.sat;
        state.bright = p.bright;
        if (label) label.textContent = p.label;
        paint();
      });
    });

    document.querySelectorAll("[data-swatch]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        select("swatch", btn);
        state.off = false;
        var v = btn.dataset.swatch;

        if (v === "spectrum") {
          state.spectrum = true;
        } else {
          state.spectrum = false;
          state.colour = v;
          var hs = hueOf(v);
          // Near-white swatches drop saturation instead of rotating hue.
          state.sat = hs.s < 0.12 ? 0.14 : 1.45;
          state.bright = hs.s < 0.12 ? 1.16 : 1.0;
        }
        if (label) label.textContent = btn.dataset.name || "Custom colour";
        paint();
      });
    });

    if (intensity) intensity.addEventListener("input", paint);

    paint();
  })();

  /* ------------------------------------------------------------------
     Gallery filters
     ------------------------------------------------------------------ */
  (function galleryFilter() {
    var bar = $("[data-filters]");
    if (!bar) return;
    var tiles = $$("[data-tags]");

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      $$("[data-filter]", bar).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      var key = btn.dataset.filter;
      tiles.forEach(function (tile) {
        var show = key === "all" || tile.dataset.tags.split(" ").indexOf(key) > -1;
        tile.classList.toggle("is-hidden", !show);
      });
    });
  })();

  /* ------------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------------ */
  (function lightbox() {
    var box = $("[data-lightbox]");
    if (!box) return;

    var img = $("[data-lightbox-img]", box);
    var cap = $("[data-lightbox-cap]", box);
    var items = [];
    var index = 0;

    var collect = function () {
      items = $$("[data-lb]").filter(function (t) { return !t.classList.contains("is-hidden"); });
    };

    var show = function (i) {
      collect();
      if (!items.length) return;
      index = (i + items.length) % items.length;
      var node = items[index];
      var picture = $("img", node);
      img.src = picture.src;
      img.alt = picture.alt;
      if (cap) {
        cap.innerHTML = "<strong>" + (node.dataset.title || "") + "</strong>" + (node.dataset.sub || "");
      }
    };

    var open = function (i) {
      show(i);
      box.classList.add("is-open");
      document.body.classList.add("is-locked");
      var closeBtn = $(".lightbox__close", box);
      if (closeBtn) closeBtn.focus();
    };

    var close = function () {
      box.classList.remove("is-open");
      document.body.classList.remove("is-locked");
    };

    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-lb]");
      if (trigger) {
        collect();
        open(items.indexOf(trigger));
        return;
      }
      if (e.target.closest("[data-lightbox-close]")) close();
      if (e.target.closest("[data-lightbox-prev]")) show(index - 1);
      if (e.target.closest("[data-lightbox-next]")) show(index + 1);
      if (e.target === box) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });

    // Keyboard activation on tiles
    $$("[data-lb]").forEach(function (t) {
      t.setAttribute("tabindex", "0");
      t.setAttribute("role", "button");
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          collect();
          open(items.indexOf(t));
        }
      });
    });
  })();

  /* ------------------------------------------------------------------
     FAQ accordion
     ------------------------------------------------------------------ */
  (function faq() {
    $$("[data-faq]").forEach(function (group) {
      $$(".faq__q", group).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var item = btn.closest(".faq__item");
          var isOpen = item.classList.contains("is-open");
          if (group.dataset.faq === "single") {
            $$(".faq__item", group).forEach(function (i) {
              i.classList.remove("is-open");
              $(".faq__q", i).setAttribute("aria-expanded", "false");
            });
          }
          item.classList.toggle("is-open", !isOpen);
          btn.setAttribute("aria-expanded", String(!isOpen));
        });
      });
    });
  })();

  /* ------------------------------------------------------------------
     Testimonial carousel
     ------------------------------------------------------------------ */
  (function quotes() {
    var rail = $("[data-quotes]");
    if (!rail) return;
    var step = function () {
      var card = $(".quote", rail);
      return card ? card.offsetWidth + 20 : 340;
    };
    var prev = $("[data-quotes-prev]");
    var next = $("[data-quotes-next]");
    if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
  })();

  /* ------------------------------------------------------------------
     Mobile dock CTA
     ------------------------------------------------------------------ */
  (function dock() {
    var el = $("[data-dock]");
    if (!el) return;
    var onScroll = function () {
      el.classList.toggle("is-shown", window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* ------------------------------------------------------------------
     Quote builder (multi-step)
     ------------------------------------------------------------------ */
  (function quoteBuilder() {
    var form = $("[data-quote-form]");
    if (!form) return;

    var steps = $$(".qstep", form);
    var bars = $$(".steps-bar__i", form);
    var current = 0;

    var paint = function () {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === current); });
      bars.forEach(function (b, i) { b.classList.toggle("is-done", i <= current); });
    };

    var validate = function (step) {
      var ok = true;
      $$("[required]", step).forEach(function (f) {
        if (!f.checkValidity()) { f.reportValidity(); ok = false; }
      });
      return ok;
    };

    var summarise = function () {
      var target = $("[data-quote-summary]", form);
      if (!target) return;
      var data = new FormData(form);
      var rows = [
        ["Property type", data.get("property") || "—"],
        ["Roofline length", data.get("size") || "—"],
        ["Interested in", $$("input[name='interest']:checked", form).map(function (i) { return i.value; }).join(", ") || "—"],
        ["Timeline", data.get("timeline") || "—"],
        ["Service area", data.get("area") || "—"]
      ];
      target.innerHTML = rows.map(function (r) {
        return "<div class='qsummary__row'><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
      }).join("");
    };

    form.addEventListener("click", function (e) {
      if (e.target.closest("[data-qnext]")) {
        if (!validate(steps[current])) return;
        current = Math.min(current + 1, steps.length - 1);
        if (current === steps.length - 1) summarise();
        paint();
        form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
      if (e.target.closest("[data-qback]")) {
        current = Math.max(current - 1, 0);
        paint();
      }
    });

    paint();
  })();

  /* ------------------------------------------------------------------
     Form submission
     Static site: no backend. Composes a pre-filled email to the office
     so no enquiry is lost, and shows a clear confirmation.
     Swap the handler for a real endpoint (Formspree / Netlify / custom)
     by setting data-endpoint on the <form>.
     ------------------------------------------------------------------ */
  (function forms() {
    $$("[data-mail-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var status = $("[data-form-status]", form);
        var endpoint = form.dataset.endpoint;

        var data = new FormData(form);
        var lines = [];
        data.forEach(function (value, key) {
          if (!String(value).trim()) return;
          var label = key.replace(/[-_]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
          var existing = lines.findIndex(function (l) { return l.indexOf(label + ":") === 0; });
          if (existing > -1) lines[existing] += ", " + value;
          else lines.push(label + ": " + value);
        });

        var finish = function (message, isError) {
          if (!status) return;
          status.textContent = message;
          status.classList.add("is-shown");
          status.classList.toggle("is-error", !!isError);
          status.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        };

        if (endpoint) {
          fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
            .then(function (r) {
              if (!r.ok) throw new Error("bad response");
              form.reset();
              finish("Thank you — your request is in. We'll be in touch within one business day.");
            })
            .catch(function () {
              finish("Something went wrong sending that. Please call 604-679-4087 or email info@crystallights.ca.", true);
            });
          return;
        }

        var subject = encodeURIComponent(form.dataset.subject || "Website enquiry — Crystal Lights");
        var body = encodeURIComponent(lines.join("\n"));
        window.location.href = "mailto:info@crystallights.ca?subject=" + subject + "&body=" + body;
        finish("Your email app is opening with the details filled in — just hit send. Prefer to talk? Call 604-679-4087.");
      });
    });
  })();

  /* ------------------------------------------------------------------
     Hero parallax (light touch)
     ------------------------------------------------------------------ */
  (function parallax() {
    if (reduceMotion) return;
    var layers = $$("[data-parallax]");
    if (!layers.length) return;
    var ticking = false;
    var update = function () {
      var y = window.scrollY;
      layers.forEach(function (el) {
        var speed = parseFloat(el.dataset.parallax) || 0.15;
        el.style.transform = "translate3d(0," + (y * speed).toFixed(1) + "px,0)";
      });
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  })();
})();

/* ==========================================================================
   Crystal Lights — light-driven interface
   Appended module. Same conventions as main.js: self-guarding IIFEs.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ------------------------------------------------------------------
     Lights-on intro — once per browser session, never on repeat views.
     ------------------------------------------------------------------ */
  (function ignite() {
    var el = $("[data-ignite]");
    if (!el) return;

    var seen = false;
    try { seen = sessionStorage.getItem("cl-ignited") === "1"; } catch (e) {}

    if (seen || reduceMotion) { el.parentNode.removeChild(el); return; }

    try { sessionStorage.setItem("cl-ignited", "1"); } catch (e) {}

    var finish = function () {
      el.classList.add("is-done");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
    };
    setTimeout(finish, 1250);
    // Never trap anyone behind it.
    el.addEventListener("click", finish);
    window.addEventListener("wheel", finish, { once: true, passive: true });
  })();

  /* ------------------------------------------------------------------
     Cursor light — a soft pool of light that follows the pointer.
     ------------------------------------------------------------------ */
  (function cursorLight() {
    if (reduceMotion || window.matchMedia("(hover: none)").matches) return;

    var el = document.createElement("div");
    el.className = "cursorlight";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);

    var tx = 0, ty = 0, x = 0, y = 0, running = false;

    var tick = function () {
      x = lerp(x, tx, 0.13);
      y = lerp(y, ty, 0.13);
      el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      if (Math.abs(x - tx) > 0.4 || Math.abs(y - ty) > 0.4) requestAnimationFrame(tick);
      else running = false;
    };

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      el.classList.add("is-on");
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: true });

    document.addEventListener("pointerleave", function () { el.classList.remove("is-on"); });
  })();

  /* ------------------------------------------------------------------
     Magnetic buttons — primary CTAs lean toward the cursor.
     ------------------------------------------------------------------ */
  (function magnetic() {
    if (reduceMotion || window.matchMedia("(hover: none)").matches) return;

    $$("[data-magnetic]").forEach(function (btn) {
      var reset = function () { btn.style.transform = ""; };

      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        btn.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", reset);
      btn.addEventListener("blur", reset);
    });
  })();

  /* ------------------------------------------------------------------
     Hero scene cycle — the hero photograph relights itself on a loop,
     so the product is demonstrated before a word is read.
     ------------------------------------------------------------------ */
  (function heroCycle() {
    var img = document.querySelector("[data-hero-relight]");
    if (!img) return;

    var dot = document.querySelector("[data-hero-hue]");
    var name = document.querySelector("[data-hero-scene]");

    /* Calibrated against assets/img/gallery/home-green.jpg — measured, not
       computed, because CSS hue-rotate is a matrix approximation. The photo is
       lit emerald against a black sky, which is what makes the rotation read as
       a genuine relight instead of a colour cast over the sky.
         0deg green · 60 cyan · 120 violet · 180 magenta · 240 orange · 270 amber */
    var STEPS = [
      { rot: 0, sat: 1.35, bri: 1.0, c: "#34d399", label: "Emerald" },
      { rot: 60, sat: 1.4, bri: 1.0, c: "#22d3ee", label: "Ice Cyan" },
      { rot: 120, sat: 1.4, bri: 1.0, c: "#a855f7", label: "Violet" },
      { rot: 180, sat: 1.45, bri: 1.0, c: "#f0398b", label: "Magenta" },
      { rot: 240, sat: 1.45, bri: 1.02, c: "#ff7a1a", label: "Sunset" },
      { rot: 270, sat: 0.5, bri: 1.14, c: "#ffd166", label: "Warm White" }
    ];

    var i = 0;

    var apply = function () {
      var s = STEPS[i % STEPS.length];
      // Keep winding forwards so the transition always sweeps one way round the
      // wheel instead of snapping back through every hue at the end of a lap.
      var rot = s.rot + 360 * Math.floor(i / STEPS.length);
      img.style.filter =
        "hue-rotate(" + rot + "deg) saturate(" + s.sat + ") brightness(" + s.bri + ")";
      if (dot) dot.style.setProperty("--hue", s.c);
      if (name) name.textContent = s.label;
      i++;
    };

    img.style.transition = "filter 2.4s cubic-bezier(.4,0,.2,1)";
    // Open on warm white — the setting most homeowners actually live with.
    i = 5;
    apply();

    if (reduceMotion) return;

    var timer = setInterval(apply, 4200);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearInterval(timer); timer = null; }
      else if (!timer) timer = setInterval(apply, 4200);
    });
  })();

  /* ------------------------------------------------------------------
     Scroll-driven relighting scene.
     Scroll position maps continuously onto a colour ramp, so the house
     relights as you move rather than cutting between states.
     ------------------------------------------------------------------ */
  (function scrollScene() {
    var scene = document.querySelector("[data-scene]");
    if (!scene) return;

    var sticky = scene.querySelector(".scene__sticky");
    var title = document.querySelector("[data-scene-title]");
    var copy = document.querySelector("[data-scene-copy]");
    var ticks = Array.prototype.slice.call(scene.querySelectorAll(".scene__tick"));

    /* Same calibrated photograph as the hero. Rotations wind forwards on
       purpose: 210 -> 360 sweeps red through orange and gold into green, and
       360 -> 480 carries green through cyan into violet. Scrolling therefore
       moves the house through a continuous colour sweep rather than cutting
       between fixed states. */
    var STOPS = [
      { rot: 270, sat: 0.10, bri: 0.30, glow: 0.0, c: "#8a95ac",
        title: "Off.",
        copy: "Switched off it is a slim trim line under your roof edge, powder-coated to match your fascia. Most visitors never notice it is there at all." },
      { rot: 270, sat: 0.50, bri: 1.14, glow: 0.20, c: "#ffd166",
        title: "Every evening.",
        copy: "Warm white from dusk to bedtime, on a schedule you set once. This is the setting most homeowners simply leave running all year." },
      { rot: 240, sat: 1.50, bri: 1.02, glow: 0.28, c: "#ff7a1a",
        title: "October.",
        copy: "Orange and violet with flicker and chase effects. The house the whole street detours past on Halloween night." },
      { rot: 210, sat: 1.55, bri: 1.00, glow: 0.30, c: "#e5484d",
        title: "December.",
        copy: "Red and green across every gable, live in one tap. No boxes in the garage, no ladder in the rain, nothing to take down in January." },
      { rot: 360, sat: 1.40, bri: 1.00, glow: 0.26, c: "#34d399",
        title: "March.",
        copy: "Emerald for St. Patrick's, pastels for spring, your team's colours on game night. Changing the whole house takes about four seconds." },
      { rot: 480, sat: 1.45, bri: 1.00, glow: 0.32, c: "#a855f7",
        title: "Anything else.",
        copy: "Sixteen million colours, every bulb addressable, a thousand presets built in. Birthdays, anniversaries, or a colour that simply suits the evening." }
    ];

    var last = -1;

    var setStop = function (idx) {
      if (idx === last) return;
      last = idx;
      var s = STOPS[idx];

      [title, copy].forEach(function (el) { if (el) el.classList.add("is-changing"); });

      setTimeout(function () {
        if (title) title.textContent = s.title;
        if (copy) copy.textContent = s.copy;
        [title, copy].forEach(function (el) { if (el) el.classList.remove("is-changing"); });
      }, 200);

      ticks.forEach(function (t, n) { t.classList.toggle("is-on", n === idx); });
    };

    var paint = function (rot, sat, bri, glow, tint) {
      scene.style.setProperty("--scene-fx",
        "hue-rotate(" + rot.toFixed(1) + "deg) saturate(" + sat.toFixed(2) +
        ") brightness(" + bri.toFixed(2) + ")");
      scene.style.setProperty("--scene-glow", glow.toFixed(3));
      scene.style.setProperty("--scene-tint", tint);
    };

    var update = function () {
      var travel = scene.offsetHeight - sticky.offsetHeight;

      // No scroll distance to work with (a collapsed viewport, or the section
      // laid out before its spacers resolve). Fall back to the everyday scene
      // so the photograph is never left sitting there unlit and raw.
      if (travel <= 0) {
        var f = STOPS[1];
        paint(f.rot, f.sat, f.bri, f.glow, f.c);
        setStop(1);
        return;
      }

      var p = clamp(-scene.getBoundingClientRect().top / travel, 0, 1);
      var pos = p * (STOPS.length - 1);
      var i = clamp(Math.floor(pos), 0, STOPS.length - 2);
      var t = pos - i;
      var a = STOPS[i], b = STOPS[i + 1];

      paint(lerp(a.rot, b.rot, t), lerp(a.sat, b.sat, t), lerp(a.bri, b.bri, t),
            lerp(a.glow, b.glow, t), t < 0.5 ? a.c : b.c);

      setStop(Math.round(pos));
    };

    if (reduceMotion) {
      var s1 = STOPS[1];
      paint(s1.rot, s1.sat, s1.bri, s1.glow, s1.c);
      setStop(1);
      return;
    }

    ticks.forEach(function (t, n) { t.style.setProperty("--tick", STOPS[n].c); });

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  })();

  /* ------------------------------------------------------------------
     Horizontal drag strip
     ------------------------------------------------------------------ */
  (function dragStrip() {
    $$("[data-hstrip]").forEach(function (rail) {
      var bar = rail.parentElement.querySelector("[data-hprogress]");
      var down = false, startX = 0, startLeft = 0, moved = 0;

      var progress = function () {
        if (!bar) return;
        var max = rail.scrollWidth - rail.clientWidth;
        var p = max > 0 ? rail.scrollLeft / max : 0;
        bar.style.setProperty("--p", (0.15 + p * 0.85).toFixed(3));
      };

      rail.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "touch") return; // native touch scrolling is better
        down = true;
        moved = 0;
        startX = e.clientX;
        startLeft = rail.scrollLeft;
        rail.setPointerCapture(e.pointerId);
      });

      rail.addEventListener("pointermove", function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        moved = Math.abs(dx);
        if (moved > 4) rail.classList.add("is-dragging");
        rail.scrollLeft = startLeft - dx;
      });

      var release = function () {
        down = false;
        rail.classList.remove("is-dragging");
      };
      rail.addEventListener("pointerup", release);
      rail.addEventListener("pointercancel", release);

      // A drag should never fire the lightbox underneath it.
      rail.addEventListener("click", function (e) {
        if (moved > 4) { e.preventDefault(); e.stopPropagation(); }
      }, true);

      rail.addEventListener("scroll", progress, { passive: true });
      progress();
    });
  })();
})();

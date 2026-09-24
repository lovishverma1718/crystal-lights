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
    var wrap = $(".header-wrap");
    if (!header) return;
    var onScroll = function () {
      var isStuck = window.scrollY > 12;
      header.classList.toggle("is-stuck", isStuck);
      if (wrap) wrap.classList.toggle("is-stuck", isStuck);
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

    function applyFilter(key) {
      tiles.forEach(function (tile) {
        var tags = (tile.dataset.tags || "").split(" ");
        var show = key === "all" || tags.indexOf(key) > -1;
        tile.classList.toggle("is-hidden", !show);
      });
    }

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      $$("[data-filter]", bar).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      applyFilter(btn.dataset.filter);
    });

    var activeBtn = $("[data-filter][aria-pressed='true']", bar) || $("[data-filter]", bar);
    if (activeBtn) {
      applyFilter(activeBtn.dataset.filter);
    }
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
     Hero scene cycle — cycles through the real installation photographs.
     ------------------------------------------------------------------ */
  (function heroCycle() {
    var slides = $$("[data-hero-slide]");
    var img = $("[data-hero-relight]");
    var dot = $("[data-hero-hue]");
    var name = $("[data-hero-scene]");

    if (slides.length) {
      var SCENES = [
        { label: "Warm White", color: "#ffd166" },
        { label: "Christmas", color: "#e5484d" },
        { label: "Festival Violet", color: "#a855f7" },
        { label: "Crisp White", color: "#ffffff" },
        { label: "Cool Daylight", color: "#22d3ee" }
      ];
      var idx = 0;
      var showSlide = function (n) {
        idx = (n + slides.length) % slides.length;
        slides.forEach(function (s, i) {
          s.classList.toggle("is-active", i === idx);
        });
        var sc = SCENES[idx % SCENES.length];
        if (dot && sc) dot.style.setProperty("--hue", sc.color);
        if (name && sc) name.textContent = sc.label;
      };
      showSlide(0);
      if (reduceMotion) return;
      var timer = setInterval(function () { showSlide(idx + 1); }, 4200);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { clearInterval(timer); timer = null; }
        else if (!timer) timer = setInterval(function () { showSlide(idx + 1); }, 4200);
      });
      return;
    }

    if (!img) return;
    var STEPS = [
      { rot: 270, sat: 0.5, bri: 1.14, c: "#ffd166", label: "Warm White" },
      { rot: 210, sat: 1.5, bri: 1.0, c: "#e5484d", label: "Christmas" },
      { rot: 120, sat: 1.4, bri: 1.0, c: "#a855f7", label: "Violet" },
      { rot: 0, sat: 1.35, bri: 1.0, c: "#34d399", label: "Emerald" }
    ];
    var i = 0;
    var apply = function () {
      var s = STEPS[i % STEPS.length];
      var rot = s.rot + 360 * Math.floor(i / STEPS.length);
      img.style.filter = "hue-rotate(" + rot + "deg) saturate(" + s.sat + ") brightness(" + s.bri + ")";
      if (dot) dot.style.setProperty("--hue", s.c);
      if (name) name.textContent = s.label;
      i++;
    };
    img.style.transition = "filter 2.4s cubic-bezier(.4,0,.2,1)";
    apply();
    if (reduceMotion) return;
    var timerLegacy = setInterval(apply, 4200);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearInterval(timerLegacy); timerLegacy = null; }
      else if (!timerLegacy) timerLegacy = setInterval(apply, 4200);
    });
  })();

  /* ------------------------------------------------------------------
     Lighting scenes — button driven with real client images.
     ------------------------------------------------------------------ */
  (function sceneSwitcher() {
    var scene = document.querySelector("[data-scene]");
    if (!scene) return;

    var stageImg = scene.querySelector("[data-scene-img]");
    var title = document.querySelector("[data-scene-title]");
    var copy = document.querySelector("[data-scene-copy]");
    var buttons = Array.prototype.slice.call(scene.querySelectorAll("[data-scene-stop], [data-scene-key]"));

    var SCENE_DATA = {
      "everyday": {
        img: "assets/img/gallery/scene-everyday.jpg",
        color: "#ffd166",
        title: "Everyday.",
        copy: "Warm white from dusk to bedtime, on a schedule you set once. This is the timeless architectural look homeowners enjoy all year round."
      },
      "halloween": {
        img: "assets/img/gallery/scene-halloween.jpg",
        color: "#a855f7",
        title: "Halloween.",
        copy: "Deep vibrant purple, eerie flicker, and themed accents. The house the entire neighborhood stops to photograph on October 31st."
      },
      "christmas": {
        img: "assets/img/gallery/scene-christmas.jpg",
        color: "#e5484d",
        title: "Christmas.",
        copy: "Festive red, green, and crisp white across every peak and gable in one tap. No tangled strings, zero ladder climbing in the winter cold."
      },
      "canada-day": {
        img: "assets/img/gallery/scene-canada-day.jpg",
        color: "#ff2d4f",
        title: "Canada Day.",
        copy: "Proud red and white roofline illumination celebrating July 1st, national holidays, and backyard summer celebrations."
      },
      "game-night": {
        img: "assets/img/gallery/scene-game-night.jpg",
        color: "#3b82f6",
        title: "Game Night.",
        copy: "Show off your team colors on game night. Vibrant blues, purples, and high-energy animations ready in four seconds from your phone."
      }
    };

    var current = null;

    var show = function (key, instant) {
      if (key === current) return;
      current = key;
      var data = SCENE_DATA[key];
      if (!data) return;

      if (stageImg) {
        if (instant) {
          stageImg.src = data.img;
        } else {
          stageImg.style.transition = "opacity 0.22s var(--ease-out)";
          stageImg.style.opacity = "0.3";
          setTimeout(function () {
            stageImg.src = data.img;
            stageImg.style.opacity = "1";
          }, 180);
        }
      }

      scene.style.setProperty("--scene-tint", data.color);

      buttons.forEach(function (btn) {
        var k = btn.dataset.sceneKey || (btn.dataset.sceneStop !== undefined ? Object.keys(SCENE_DATA)[parseInt(btn.dataset.sceneStop, 10)] : null);
        var active = k === key;
        btn.classList.toggle("is-on", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });

      if (instant) {
        if (title) title.textContent = data.title;
        if (copy) copy.textContent = data.copy;
        return;
      }

      [title, copy].forEach(function (el) { if (el) el.classList.add("is-changing"); });
      setTimeout(function () {
        if (title) title.textContent = data.title;
        if (copy) copy.textContent = data.copy;
        [title, copy].forEach(function (el) { if (el) el.classList.remove("is-changing"); });
      }, 200);
    };

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.dataset.sceneKey || Object.keys(SCENE_DATA)[parseInt(btn.dataset.sceneStop || "0", 10)] || "everyday";
        show(key, false);
      });
    });

    show("everyday", true);
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

/* ==========================================================================
   Reviews — rendered from assets/js/reviews.js
   ========================================================================== */
(function () {
  "use strict";

  var rail = document.querySelector("[data-quotes]");
  var data = window.CL_REVIEWS;
  if (!rail || !data || !data.length) return;

  var esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7L12 17.8 5.8 21.2 7 14.2 2 9.4l7-.9Z"/></svg>';
  var PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

  var initials = function (name) {
    var parts = String(name).trim().split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
  };

  rail.innerHTML = data.map(function (r) {
    var n = Math.max(1, Math.min(5, Math.round(Number(r.stars) || 5)));
    var stars = "";
    for (var i = 0; i < 5; i++) stars += '<span class="' + (i < n ? "" : "is-empty") + '">' + STAR + "</span>";

    var city = String(r.city || "").trim();
    var where = city
      ? '<span class="quote__city">' + PIN + esc(/,\s*[A-Z]{2}$/.test(city) ? city : city + ", BC") + "</span>"
      : "";

    return (
      '<figure class="quote">' +
        '<div class="quote__top">' +
          '<span class="quote__stars" role="img" aria-label="' + n + ' out of 5 stars">' + stars + "</span>" +
          '<span class="quote__score">' + n + ".0</span>" +
        "</div>" +
        "<blockquote>" + esc(r.text) + "</blockquote>" +
        "<figcaption>" +
          '<span class="quote__av" aria-hidden="true">' + esc(initials(r.name)) + "</span>" +
          '<span class="quote__who"><strong>' + esc(r.name) + "</strong>" +
            where +
            '<span class="quote__meta"><a href="https://maps.app.goo.gl/UtMMNNwyxrQCGAqe6?g_st=ic" target="_blank" rel="noopener noreferrer">Google review · ' + esc(r.date) + "</a></span>" +
          "</span>" +
        "</figcaption>" +
      "</figure>"
    );
  }).join("");
})();

/* ==========================================================================
   Crystal Lights — AI Lighting Assistant Bot
   ========================================================================== */
(function clAiBot() {
  var widget = document.getElementById("clAiWidget");
  var trigger = document.getElementById("clAiTrigger");
  var modal = document.getElementById("clAiModal");
  var closeBtn = document.getElementById("clAiClose");
  var messages = document.getElementById("clAiMessages");
  var form = document.getElementById("clAiForm");
  var input = document.getElementById("clAiInput");
  var prompts = document.getElementById("clAiPrompts");

  if (!widget || !trigger || !modal) return;

  var open = function () {
    modal.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    if (input) input.focus();
  };

  var close = function () {
    modal.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", function () {
    modal.classList.contains("is-open") ? close() : open();
  });
  if (closeBtn) closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  var appendMsg = function (html, isUser) {
    var div = document.createElement("div");
    div.className = "cl-ai-msg " + (isUser ? "cl-ai-msg--user" : "cl-ai-msg--bot");
    div.innerHTML = html;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };

  var botTyping = function (replyHtml) {
    var typing = document.createElement("div");
    typing.className = "cl-ai-msg cl-ai-msg--bot";
    typing.innerHTML = "<em>Crystal AI is typing...</em>";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(function () {
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      appendMsg(replyHtml, false);
    }, 400);
  };

  var RESPONSES = {
    cost: "<p>Pricing depends on your roofline length, architectural peaks, and chosen layout. We provide <strong>free, fixed written quotes</strong> with zero hidden fees covering all materials, certified installation, app setup, and a 10-year warranty.</p><p><a href='contact.html'>Click here to request your free quote &rarr;</a> or call us at <a href='tel:+16046794087'>604-679-4087</a>!</p>",
    daytime: "<p>Our lights are designed to be <strong>virtually invisible by day</strong>! We install custom-extruded aluminum tracks powder-coated to match your fascia or trim colour (white, black, bronze, or brown). Bulbs sit recessed facing downward, reading as clean architectural trim from the street.</p>",
    warranty: "<p>We back every installation with an industry-leading <strong>10-Year Comprehensive Warranty</strong> on parts, labour, tracks, and controllers! If a bulb or connection ever fails, our team comes out to fix it at zero cost.</p>",
    areas: "<p>We proudly serve across British Columbia:<br>• <strong>Lower Mainland:</strong> Vancouver, Burnaby, Richmond, Surrey, Langley, Coquitlam, Delta, Abbotsford, etc.<br>• <strong>Vancouver Island:</strong> Victoria, Nanaimo, Duncan, Courtenay, Campbell River, etc.<br>• <strong>The Okanagan:</strong> Kelowna, West Kelowna, Vernon, Penticton, etc.</p>",
    app: "<p>Our smartphone app gives you full control over <strong>16 million+ colours</strong>, individual bulb customization, 1,000+ holiday presets (Christmas, Halloween, Diwali, Canada Day, sports teams), customizable animations, brightness dimming, and automated sunset/sunrise scheduling!</p>",
    quote: "<p>We'd love to light up your home! Our consultations are 100% free with no deposit and no obligation. <a href='contact.html'><strong>Click here to book your consultation &rarr;</strong></a> or call Love and the team directly at <a href='tel:+16046794087'>604-679-4087</a>.</p>"
  };

  if (prompts) {
    prompts.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-prompt]");
      if (!btn) return;
      var key = btn.dataset.prompt;
      appendMsg(btn.textContent, true);
      botTyping(RESPONSES[key] || RESPONSES.quote);
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      appendMsg(q, true);
      input.value = "";

      var lower = q.toLowerCase();
      var reply = "";

      if (lower.indexOf("cost") > -1 || lower.indexOf("price") > -1 || lower.indexOf("quote") > -1 || lower.indexOf("estimate") > -1 || lower.indexOf("rate") > -1) {
        reply = RESPONSES.cost;
      } else if (lower.indexOf("day") > -1 || lower.indexOf("invis") > -1 || lower.indexOf("track") > -1 || lower.indexOf("look") > -1) {
        reply = RESPONSES.daytime;
      } else if (lower.indexOf("warrant") > -1 || lower.indexOf("guarantee") > -1 || lower.indexOf("years") > -1) {
        reply = RESPONSES.warranty;
      } else if (lower.indexOf("area") > -1 || lower.indexOf("where") > -1 || lower.indexOf("location") > -1 || lower.indexOf("surrey") > -1 || lower.indexOf("vancouver") > -1 || lower.indexOf("island") > -1 || lower.indexOf("okanagan") > -1) {
        reply = RESPONSES.areas;
      } else if (lower.indexOf("app") > -1 || lower.indexOf("phone") > -1 || lower.indexOf("color") > -1 || lower.indexOf("timer") > -1 || lower.indexOf("preset") > -1) {
        reply = RESPONSES.app;
      } else if (lower.indexOf("phone") > -1 || lower.indexOf("contact") > -1 || lower.indexOf("call") > -1 || lower.indexOf("number") > -1 || lower.indexOf("email") > -1) {
        reply = "<p>You can reach us directly anytime at <a href='tel:+16046794087'><strong>604-679-4087</strong></a> or email <a href='mailto:info@crystallights.ca'><strong>info@crystallights.ca</strong></a>. We respond within one business day!</p>";
      } else {
        reply = "<p>Thank you for asking! Crystal Lights installs permanent, app-controlled outdoor lighting built for BC weather with a 10-year warranty. We would be happy to walk your property and provide a free layout and fixed quote.<br><br><a href='contact.html'><strong>Book a Free Consultation &rarr;</strong></a> or call us at <a href='tel:+16046794087'>604-679-4087</a>.</p>";
      }

      botTyping(reply);
    });
  }
})();



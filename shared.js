(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // Nav starts fully transparent (so the hero image shows through on top);
    // gains a solid background once scrolled past the top so it stays readable.
    // Separately (and at a much smaller threshold): nav-scrolled marks the
    // instant scrolling starts at all — kept around for anything that wants
    // "has scrolled at all" state. Hiding the landing-page nav logo is now
    // driven by nav-past-hero instead (see updateLogoHandoff below), which
    // fires when section 3 first appears at the bottom of the viewport.
    var nav = document.querySelector('nav');
    if (nav) {
      var updateNav = function () {
        nav.classList.toggle('nav-solid', window.scrollY > 40);
        nav.classList.toggle('nav-scrolled', window.scrollY > 0);
      };
      updateNav();
      window.addEventListener('scroll', updateNav, { passive: true });
    }

    // Toggle a body.is-scrolling class while the user is actively scrolling,
    // clearing it 140ms after the last scroll event. shared.css uses this to
    // pause heavy background SVG animations mid-scroll (see .brand-mark-bg
    // rule) so the scroll-driven flying-logo handoff gets full frame budget.
    var scrollIdleTimer = null;
    var body = document.body;
    window.addEventListener('scroll', function () {
      if (!body.classList.contains('is-scrolling')) body.classList.add('is-scrolling');
      clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(function () { body.classList.remove('is-scrolling'); }, 140);
    }, { passive: true });

    // Home page only: the section-2 icon and wordmark each fly to the nav
    // independently — same two elements the whole way, not copies that
    // crossfade — which is what lets them morph from stacked (icon above
    // word, in section 2) to inline (icon beside word, in the nav) as they
    // travel, instead of just shrinking in place. Each is its own FLIP:
    // cache its rest position/size and its own nav target's position/size
    // once, then every scroll frame interpolate a transform between them.
    var brandMark = document.querySelector('.brand-mark');
    var navEl = document.querySelector('nav');
    // Measured from the real nav each time (not hardcoded), since the nav
    // wraps to multiple rows and is taller than the desktop 64px on mobile —
    // a hardcoded value here was silently wrong on phones.
    var getNavH = function () { return navEl ? navEl.getBoundingClientRect().height : 64; };

    var makeFlyer = function (el, targetEl) {
      if (!el || !targetEl) return null;
      var rest = null; // { docTop, docLeft, width, height }
      var target = null; // { top, left, width, height } — nav is sticky, viewport-relative is fine
      var flightStart = null; // { x, y } — screen position frozen the instant progress first left 0
      var docked = false; // true once we've pinned the element via position:fixed at progress=1

      var measure = function () {
        // Fully reset to natural in-flow state before measuring — otherwise
        // a stale position:fixed / transform from a previous dock leaks into
        // the fresh measurement.
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
        el.style.transform = 'none';
        docked = false;
        var r = el.getBoundingClientRect();
        rest = {
          docTop: r.top + window.scrollY,
          docLeft: r.left + window.scrollX,
          width: r.width,
          height: r.height
        };
        var t = targetEl.getBoundingClientRect();
        target = { top: t.top, left: t.left, width: t.width, height: t.height };
      };

      // Lock the element to the nav slot via position:fixed once the flight
      // completes (progress hits 1). This breaks the dependency between the
      // element's viewport position and scroll offset — without it, every
      // scroll frame recomputes a transform that has to counter the natural
      // in-flow scroll movement, and the one-frame lag between scroll paint
      // and transform paint shows up as a tiny visible jitter on the docked
      // logo. Once fixed, scrolling can't move it, so no jitter.
      var dock = function () {
        if (docked) return;
        var targetCenterX = target.left + target.width / 2;
        var targetCenterY = target.top + target.height / 2;
        var targetScale = target.height / rest.height;
        // Position the element so its top-left sits at target-center minus
        // half its own natural size — its center is then exactly at the
        // target center. Scale (default transform-origin: center) shrinks
        // it to target size around that same center — visually identical
        // to the last frame of the flight, so the handoff is seamless.
        el.style.position = 'fixed';
        el.style.top = (targetCenterY - rest.height / 2) + 'px';
        el.style.left = (targetCenterX - rest.width / 2) + 'px';
        el.style.transform = 'scale(' + targetScale + ')';
        docked = true;
      };

      var undock = function () {
        if (!docked) return;
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
        docked = false;
      };

      var update = function (progress) {
        // Once we've fully landed, stay put — no per-scroll transform math.
        if (progress >= 1) {
          dock();
          return;
        }
        // Scrolling back up past the dock threshold — release and resume
        // the transform-based flight for the reverse trip.
        if (docked) undock();

        // Current natural position the element would sit at right now if it
        // weren't flying at all (it's a normal in-flow element, so this keeps
        // moving with scroll on its own — that's what the transform below
        // has to counteract).
        var liveTop = rest.docTop - window.scrollY;
        var liveLeft = rest.docLeft - window.scrollX;
        var liveCenterX = liveLeft + rest.width / 2;
        var liveCenterY = liveTop + rest.height / 2;

        if (progress <= 0) {
          flightStart = null;
          el.style.transform = 'none';
          return;
        }
        // Freeze the screen position the flight started from, once, so the
        // path is a clean line from THAT fixed point to the target — not a
        // blend that chases the element's live (fast-scrolling) position,
        // which is what let it swing off-screen when section 2 got taller
        // than the flight's own scroll zone.
        if (!flightStart) {
          flightStart = { x: liveCenterX, y: liveCenterY };
        }

        var targetCenterX = target.left + target.width / 2;
        var targetCenterY = target.top + target.height / 2;
        var targetScale = target.height / rest.height;

        var desiredX = flightStart.x + (targetCenterX - flightStart.x) * progress;
        var desiredY = flightStart.y + (targetCenterY - flightStart.y) * progress;
        var scale = 1 + (targetScale - 1) * progress;

        var dx = desiredX - liveCenterX;
        var dy = desiredY - liveCenterY;

        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';
      };

      return { measure: measure, update: update };
    };

    var iconFlyer = makeFlyer(document.querySelector('.brand-mark-icon'), document.querySelector('.nav-logo-target-icon'));
    var wordFlyer = makeFlyer(document.querySelector('.brand-mark-word'), document.querySelector('.nav-logo-target-word'));

    if (brandMark && (iconFlyer || wordFlyer)) {
      var ticking = false;

      var updateLogoHandoff = function () {
        ticking = false;
        // The section 2 / section 3 boundary — the "section three starting
        // line". 0 = that line has just appeared at the bottom of the
        // viewport (it starts to scroll into view), 1 = it has reached the
        // nav (section 2 fully crossed) — both should have arrived by then.
        var lineY = brandMark.getBoundingClientRect().bottom;
        var zone = window.innerHeight - getNavH();
        var progress = (window.innerHeight - lineY) / zone;
        progress = Math.max(0, Math.min(1, progress));

        if (iconFlyer) iconFlyer.update(progress);
        if (wordFlyer) wordFlyer.update(progress);

        // Hide the landing-page nav logo the moment section 3 starts
        // scrolling in (which is also the exact moment the flying logo
        // takes off from section 2 — so the nav slot goes from "landing
        // logo visible" straight to "flying logo docking in", never both).
        if (navEl) navEl.classList.toggle('nav-past-hero', progress > 0);
      };

      var onScroll = function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateLogoHandoff);
        }
      };
      var onResize = function () {
        if (iconFlyer) iconFlyer.measure();
        if (wordFlyer) wordFlyer.measure();
        updateLogoHandoff();
      };
      onResize();
      // Safety net: re-measure once every resource (images included) has
      // definitely finished loading. The width/height attributes on the
      // <img> tags already fix the root cause (a real-network image load
      // being slower than the initial measure() call, which only showed up
      // live, not locally where the image was instant/cached) — this catches
      // any other later-loading cause of the same class of bug (e.g. a web
      // font swap shifting layout) without needing to diagnose it by name.
      window.addEventListener('load', onResize);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
    }

    // Section 3 feature-list calendar icon: shows today's actual date, same
    // as the real app's CalendarIcon (src/components/Icons.jsx).
    var apCalDay = document.getElementById('ap-cal-day');
    if (apCalDay) {
      var day = new Date().getDate();
      apCalDay.textContent = day;
      if (day < 10) {
        apCalDay.setAttribute('font-size', '14');
        apCalDay.setAttribute('letter-spacing', '0');
      }
    }
  });
})();

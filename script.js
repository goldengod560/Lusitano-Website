/* ============================================================
   LUSITANO — script.js
   All animation logic. Everything checks prefers-reduced-motion
   and falls back gracefully.
============================================================ */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ----------------------------------------------------------
     1. Navigation — glass background on scroll + mobile menu
  ---------------------------------------------------------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const onScrollNav = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", open);
  });
  // Close mobile menu when a link is tapped
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ----------------------------------------------------------
     2. Hero title — split into letters for the staggered reveal
  ---------------------------------------------------------- */
  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle && !reduceMotion) {
    const text = heroTitle.textContent.trim();
    heroTitle.textContent = "";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "ltr";
      span.textContent = ch;
      span.style.animationDelay = `${0.25 + i * 0.09}s`;
      heroTitle.appendChild(span);
    });
  }

  /* ----------------------------------------------------------
     3. Gold particle field (hero) — lightweight canvas
        Pauses when the hero is off-screen. Skipped entirely
        for reduced-motion users.
  ---------------------------------------------------------- */
  const canvas = document.getElementById("particles");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, particles, running = true, raf;

    const COUNT = window.innerWidth < 720 ? 22 : 42; // keep it light

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => ({
      x: Math.random() * w,
      y: h + Math.random() * h * 0.3,
      r: 0.6 + Math.random() * 1.6,
      speed: 0.12 + Math.random() * 0.28,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.002 + Math.random() * 0.004,
      alpha: 0.15 + Math.random() * 0.4,
    });

    const init = () => {
      resize();
      particles = Array.from({ length: COUNT }, () => {
        const p = spawn();
        p.y = Math.random() * h; // scatter on first load
        return p;
      });
    };

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.speed;
        p.sway += p.swaySpeed;
        const x = p.x + Math.sin(p.sway) * 18;
        if (p.y < -10) Object.assign(p, spawn());
        const grad = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 3);
        grad.addColorStop(0, `rgba(232, 213, 168, ${p.alpha})`);
        grad.addColorStop(1, "rgba(232, 213, 168, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    init();
    tick();
    window.addEventListener("resize", () => { resize(); }, { passive: true });

    // Pause the particle loop when the hero scrolls out of view
    new IntersectionObserver(([entry]) => {
      const wasRunning = running;
      running = entry.isIntersecting;
      if (running && !wasRunning) tick();
      else if (!running) cancelAnimationFrame(raf);
    }).observe(canvas);
  }

  /* ----------------------------------------------------------
     4. Scroll-reveal animations
  ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ----------------------------------------------------------
     5. Parallax mist layers in the hero
  ---------------------------------------------------------- */
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax);
        el.style.translate = `0 ${y * speed}px`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     6. Scent cards — 3D tilt on desktop, tap-to-awaken on mobile
  ---------------------------------------------------------- */
  const cards = document.querySelectorAll(".scent-card");

  cards.forEach((card) => {
    if (!isTouch && !reduceMotion) {
      // Subtle 3D tilt following the cursor
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--ry", `${px * 7}deg`);
        card.style.setProperty("--rx", `${py * -7}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
      });
    }

    // Tap toggles the aura on touch devices (only one card active at a time)
    card.addEventListener("click", () => {
      if (!isTouch) return;
      const wasActive = card.classList.contains("active");
      cards.forEach((c) => c.classList.remove("active"));
      if (!wasActive) card.classList.add("active");
    });
  });

  /* ----------------------------------------------------------
     7. Magnetic buttons — buttons lean gently toward the cursor
  ---------------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ----------------------------------------------------------
     8. Missing-image fallback — if a category photo isn't there
        yet, hide the <img> so the styled gradient panel shows
        instead of a broken-image icon.
  ---------------------------------------------------------- */
  document.querySelectorAll(".cat-visual img").forEach((img) => {
    img.addEventListener("error", () => { img.style.display = "none"; });
  });

  /* ----------------------------------------------------------
     9. Footer year
  ---------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

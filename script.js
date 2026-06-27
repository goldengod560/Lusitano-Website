/* ============================================================
   LUSITANO — script.js (FLASHY SHOWCASE EDITION)
   ============================================================ */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ----------------------------------------------------------
     1. Custom cursor + gold trail
  ---------------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    document.body.appendChild(cursor);

    const trailCount = 5;
    const trails = [];
    for (let i = 0; i < trailCount; i++) {
      const t = document.createElement("div");
      t.className = "cursor-trail";
      document.body.appendChild(t);
      trails.push({ el: t });
    }

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Animate cursor and trails
    const animateCursor = () => {
      // Cursor snaps to mouse quickly
      cursorX += (mouseX - cursorX) * 0.7;
      cursorY += (mouseY - cursorY) * 0.7;
      cursor.style.left = cursorX + "px";
      cursor.style.top = cursorY + "px";

      // Trail dots follow in a chain behind the cursor
      let targetX = cursorX;
      let targetY = cursorY;
      for (let i = 0; i < trailCount; i++) {
        const el = trails[i].el;
        const currentX = parseFloat(el.style.left || targetX);
        const currentY = parseFloat(el.style.top || targetY);
        const nx = currentX + (targetX - currentX) * 0.35;
        const ny = currentY + (targetY - currentY) * 0.35;
        el.style.left = nx + "px";
        el.style.top = ny + "px";
        el.style.opacity = String(0.5 - i * 0.1);
        targetX = nx;
        targetY = ny;
      }
      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Hover states
    document.querySelectorAll("a, button, .scent-card, .cat-card, .why-card, .buy-card, .btn").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
    });
  }

  /* ----------------------------------------------------------
     2. Scroll progress bar
  ---------------------------------------------------------- */
  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  document.body.prepend(progressBar);

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ----------------------------------------------------------
     3. Navigation
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
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ----------------------------------------------------------
     4. Gold particle field (hero)
  ---------------------------------------------------------- */
  const canvas = document.getElementById("particles");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, particles, running = true, raf;
    const COUNT = window.innerWidth < 720 ? 28 : 55;

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
      r: 0.6 + Math.random() * 1.8,
      speed: 0.1 + Math.random() * 0.3,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.002 + Math.random() * 0.004,
      alpha: 0.15 + Math.random() * 0.45,
    });

    const init = () => {
      resize();
      particles = Array.from({ length: COUNT }, () => {
        const p = spawn();
        p.y = Math.random() * h;
        return p;
      });
    };

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.speed;
        p.sway += p.swaySpeed;
        const x = p.x + Math.sin(p.sway) * 20;
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

    init(); tick();
    window.addEventListener("resize", resize, { passive: true });
    new IntersectionObserver(([entry]) => {
      const wasRunning = running;
      running = entry.isIntersecting;
      if (running && !wasRunning) tick();
      else if (!running) cancelAnimationFrame(raf);
    }).observe(canvas);
  }

  /* ----------------------------------------------------------
     5. Scroll-reveal animations
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* Story section parallax zoom */
  const story = document.querySelector(".story");
  if (story && !reduceMotion) {
    const storyIO = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) story.classList.add("in");
      },
      { threshold: 0.2 }
    );
    storyIO.observe(story);
  }

  /* ----------------------------------------------------------
     6. Parallax mist layers
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
     7. Scent cards — 3D tilt + mobile tap fix
  ---------------------------------------------------------- */
  const cards = document.querySelectorAll(".scent-card");

  if (!reduceMotion) {
    const cardIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle("inview", e.isIntersecting);
      },
      { rootMargin: "60px" }
    );
    cards.forEach((c) => cardIO.observe(c));
  }

  cards.forEach((card) => {
    if (!isTouch && !reduceMotion) {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--ry", `${px * 8}deg`);
        card.style.setProperty("--rx", `${py * -8}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
      });
    }

    card.addEventListener("click", () => {
      if (!isTouch) return;
      const wasActive = card.classList.contains("active");
      cards.forEach((c) => c.classList.remove("active"));
      if (!wasActive) card.classList.add("active");
    });
  });

  /* ----------------------------------------------------------
     8. Magnetic buttons
  ---------------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ----------------------------------------------------------
     9. Missing-image fallback
  ---------------------------------------------------------- */
  document.querySelectorAll(".cat-visual img, .spotlight-visual img, .story-bg img").forEach((img) => {
    img.addEventListener("error", () => { img.style.display = "none"; });
  });

  /* ----------------------------------------------------------
     10. Footer year
  ---------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------
     11. WebGL Water Ripple — Ocean Scents
  ---------------------------------------------------------- */
  const scentsSection = document.querySelector(".scents");
  if (scentsSection && !reduceMotion && !isTouch) {
    const waterCanvas = document.createElement("canvas");
    waterCanvas.className = "water-canvas";
    scentsSection.prepend(waterCanvas);

    const gl = waterCanvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) {
      waterCanvas.remove();
    } else {
      const vsSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_mouseActive;
        uniform float u_scroll;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution;
          vec2 p = uv * 2.0 - 1.0;
          p.x *= u_resolution.x / u_resolution.y;

          float t = u_time * 0.4;

          // Multi-layer water waves
          float w1 = sin(p.x * 2.5 + t) * cos(p.y * 1.8 + t * 0.7);
          float w2 = sin(p.x * 4.0 - t * 0.9) * sin(p.y * 3.5 + t * 1.1);
          float w3 = sin(p.x * 7.0 + t * 1.3) * cos(p.y * 5.0 - t * 0.8);
          float w4 = sin((p.x + p.y) * 3.0 + t * 0.6) * 0.5;
          float w5 = fbm(p * 2.5 + vec2(t * 0.2, t * 0.15)) * 2.0 - 1.0;

          float water = w1 * 0.15 + w2 * 0.12 + w3 * 0.08 + w4 * 0.08 + w5 * 0.1;

          // Scroll intensity - waves amplify as you scroll through
          float scrollIntensity = u_scroll * 0.4 + 0.8;
          water *= scrollIntensity;

          // Mouse ripple - multiple harmonics for realistic propagation
          vec2 m = (u_mouse / u_resolution) * 2.0 - 1.0;
          m.x *= u_resolution.x / u_resolution.y;
          float md = length(p - m);
          float ripple = sin(md * 35.0 - t * 7.0) * exp(-md * 5.0) * u_mouseActive;
          float ripple2 = sin(md * 22.0 - t * 5.0) * exp(-md * 3.0) * u_mouseActive * 0.4;
          float ripple3 = sin(md * 15.0 - t * 3.0) * exp(-md * 2.0) * u_mouseActive * 0.2;
          water += ripple * 0.3 + ripple2 * 0.15 + ripple3 * 0.1;

          // Caustic highlights
          float caustic = pow(max(0.0, water + 0.3), 4.0) * 0.5;

          // Deep ocean color palette (blended for all three ocean scents)
          vec3 deep   = vec3(0.012, 0.035, 0.06);
          vec3 mid    = vec3(0.025, 0.10, 0.18);
          vec3 surf   = vec3(0.05, 0.22, 0.35);
          vec3 foam   = vec3(0.10, 0.42, 0.55);
          vec3 glow   = vec3(0.22, 0.58, 0.75);
          vec3 specular = vec3(0.55, 0.75, 0.85);

          float w = water * 0.5 + 0.5;
          vec3 col = mix(deep, mid, smoothstep(0.0, 0.25, w));
          col = mix(col, surf, smoothstep(0.25, 0.55, w));
          col = mix(col, foam, smoothstep(0.55, 0.8, w + caustic * 0.15));
          col = mix(col, glow, caustic * 0.35);

          // Specular sheen - multiple angles for shimmer
          float spec = pow(max(0.0, w1 * 0.4 + w2 * 0.3 + w3 * 0.2 + 0.35), 12.0) * 0.2;
          float spec2 = pow(max(0.0, sin(p.x * 10.0 + t * 2.0) * cos(p.y * 8.0 - t * 1.5) * 0.5 + 0.5), 6.0) * 0.15;
          col += specular * (spec + spec2);

          // Subtle gold tint from Lusitano branding
          col += vec3(0.08, 0.05, 0.0) * spec * 0.5;

          // Vignette for depth
          float vig = 1.0 - smoothstep(0.3, 1.3, length(p * vec2(0.85, 1.0)));
          col *= 0.55 + vig * 0.45;

          gl_FragColor = vec4(col, 0.5);
        }
      `;

      function compile(type, source) {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error("Water shader compile error:", gl.getShaderInfoLog(s));
          gl.deleteShader(s);
          return null;
        }
        return s;
      }

      const vs = compile(gl.VERTEX_SHADER, vsSource);
      const fs = compile(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) {
        waterCanvas.remove();
      } else {
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          console.error("Water shader link error:", gl.getProgramInfoLog(prog));
          waterCanvas.remove();
        } else {
          gl.useProgram(prog);

          // Fullscreen quad
          const buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1
          ]), gl.STATIC_DRAW);
          const loc = gl.getAttribLocation(prog, "a_position");
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

          // Uniforms
          const uTime = gl.getUniformLocation(prog, "u_time");
          const uRes = gl.getUniformLocation(prog, "u_resolution");
          const uMouse = gl.getUniformLocation(prog, "u_mouse");
          const uMouseActive = gl.getUniformLocation(prog, "u_mouseActive");
          const uScroll = gl.getUniformLocation(prog, "u_scroll");

          let mouseX = 0, mouseY = 0, mouseActive = 0, mouseTimeout;

          scentsSection.addEventListener("mousemove", (e) => {
            const rect = waterCanvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            mouseX = (e.clientX - rect.left) * dpr;
            mouseY = (rect.height - (e.clientY - rect.top)) * dpr;
            mouseActive = 1;
            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => { mouseActive = 0; }, 800);
          });
          scentsSection.addEventListener("mouseleave", () => {
            mouseActive = 0;
            clearTimeout(mouseTimeout);
          });

          let w, h, dpr, running = false, raf;

          const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = waterCanvas.offsetWidth;
            h = waterCanvas.offsetHeight;
            waterCanvas.width = w * dpr;
            waterCanvas.height = h * dpr;
            gl.viewport(0, 0, waterCanvas.width, waterCanvas.height);
          };

          const getScrollProgress = () => {
            const rect = scentsSection.getBoundingClientRect();
            const totalScrollable = rect.height - window.innerHeight;
            if (totalScrollable <= 0) return 0.5;
            return Math.max(0, Math.min(1, -rect.top / totalScrollable));
          };

          const startTime = performance.now();
          const render = () => {
            if (!running) return;
            const t = (performance.now() - startTime) / 1000;
            gl.uniform1f(uTime, t);
            gl.uniform2f(uRes, waterCanvas.width, waterCanvas.height);
            gl.uniform2f(uMouse, mouseX, mouseY);
            gl.uniform1f(uMouseActive, mouseActive);
            gl.uniform1f(uScroll, getScrollProgress());
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            raf = requestAnimationFrame(render);
          };

          resize();
          window.addEventListener("resize", resize, { passive: true });

          // IntersectionObserver for visibility
          new IntersectionObserver(([entry]) => {
            const wasRunning = running;
            running = entry.isIntersecting;
            if (running) {
              waterCanvas.classList.add("active");
              if (!wasRunning) render();
            } else {
              waterCanvas.classList.remove("active");
              if (wasRunning) cancelAnimationFrame(raf);
            }
          }, { threshold: 0.05 }).observe(scentsSection);
        }
      }
    }
  }
})();

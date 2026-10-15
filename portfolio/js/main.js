/* =========================================================
   Satyajeet Narayan — interactions
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- hero headline: split into animated words ---------- */
  $$("[data-split]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words
      .map((w, i) => `<span class="word" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`)
      .join(" ");
  });

  /* ---------- nav: scrolled state, progress, scrollspy, mobile ---------- */
  const nav = $("[data-nav]");
  const progress = $(".scroll-progress");
  const toggle = $("[data-nav-toggle]");
  const menu = $("[data-mobile-menu]");

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
  };
  toggle.addEventListener("click", () => setMenu(menu.hidden));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); } });

  const navLinks = $$(".nav__links a");
  const spySections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${en.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  spySections.forEach((s) => spy.observe(s));

  /* ---------- reveal on scroll ---------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); revealer.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach((el) => revealer.observe(el));

  /* ---------- cursor spotlight on cards ---------- */
  if (finePointer) {
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest && e.target.closest(".spotlight");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });

    const tilt = $("[data-tilt]");
    if (tilt && !reduceMotion) {
      tilt.addEventListener("pointermove", (e) => {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      });
      tilt.addEventListener("pointerleave", () => { tilt.style.transform = ""; });
    }
  }

  /* ---------- scroll-driven: progress, parallax, timeline ---------- */
  const parallaxEls = $$("[data-parallax]");
  const timeline = $("[data-timeline]");
  const timelineFill = $("[data-timeline-fill]");
  const timelineItems = $$(".t-item");

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    nav.classList.toggle("is-scrolled", y > 30);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    const parallaxOn = !reduceMotion && window.innerWidth > 880;
    parallaxEls.forEach((el) => {
      if (!parallaxOn) { el.style.removeProperty("--py"); return; }   // e.g. after resizing down to mobile
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
      el.style.setProperty("--py", `${offset.toFixed(1)}px`);
    });

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((vh * 0.6 - r.top) / r.height, 0, 1);
      timelineFill.style.transform = `scaleY(${p})`;
      timelineItems.forEach((it) => {
        const dot = it.querySelector(".t-item__dot").getBoundingClientRect();
        it.classList.toggle("is-lit", dot.top < vh * 0.6);
      });
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- count-up stats ---------- */
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      counter.unobserve(en.target);
      const el = en.target;
      const end = parseFloat(el.dataset.count);
      if (reduceMotion) { el.textContent = end; return; }
      const dur = 1800;
      const t0 = performance.now();
      const step = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(end * eased);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => counter.observe(el));

  /* ---------- flickering pixels behind stats ---------- */
  const pixelHost = $("[data-pixels]");
  if (pixelHost) {
    const frag = document.createDocumentFragment();
    const clusters = [{ x: 6, y: 62 }, { x: 93, y: 22 }, { x: 72, y: 88 }];
    for (let i = 0; i < 90; i++) {
      const c = clusters[i % clusters.length];
      const p = document.createElement("span");
      p.className = "pixel";
      const spread = i % 3 === 2 ? 10 : 14;
      p.style.left = `${clamp(c.x + (Math.random() - 0.5) * spread * 2, 0, 98)}%`;
      p.style.top = `${clamp(c.y + (Math.random() - 0.5) * spread * 3, 0, 96)}%`;
      p.style.setProperty("--s", `${8 + Math.round(Math.random() * 7)}px`);
      p.style.setProperty("--t", `${2.5 + Math.random() * 4}s`);
      p.style.setProperty("--dl", `${-Math.random() * 6}s`);
      frag.appendChild(p);
    }
    pixelHost.appendChild(frag);
  }

  /* ---------- writing marquee: duplicate the list for a seamless loop ---------- */
  const wList = $("[data-writing-list]");
  if (wList) {
    const clone = wList.cloneNode(true);
    clone.removeAttribute("data-writing-list");
    clone.setAttribute("aria-hidden", "true");
    $$("a", clone).forEach((a) => a.setAttribute("tabindex", "-1"));
    wList.parentNode.appendChild(clone);
  }

  /* ---------- carousel ---------- */
  const carousel = $("[data-carousel]");
  if (carousel) {
    const prev = $("[data-carousel-prev]");
    const next = $("[data-carousel-next]");
    const stepSize = () => {
      const card = carousel.firstElementChild;
      return card.getBoundingClientRect().width + parseFloat(getComputedStyle(carousel).columnGap || 28);
    };
    const update = () => {
      const max = carousel.scrollWidth - carousel.clientWidth - 2;
      prev.disabled = carousel.scrollLeft <= 2;
      next.disabled = carousel.scrollLeft >= max;
      prev.classList.toggle("arrow-btn--active", !prev.disabled && next.disabled);
      next.classList.toggle("arrow-btn--active", !next.disabled);
    };
    prev.addEventListener("click", () => carousel.scrollBy({ left: -stepSize(), behavior: reduceMotion ? "auto" : "smooth" }));
    next.addEventListener("click", () => carousel.scrollBy({ left: stepSize(), behavior: reduceMotion ? "auto" : "smooth" }));
    carousel.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
    });
    window.addEventListener("resize", update);
    update();

    // mouse drag to scroll
    let down = false, startX = 0, startLeft = 0, moved = false;
    carousel.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = carousel.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; carousel.classList.add("is-dragging"); }
      if (moved) carousel.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (moved) carousel.classList.remove("is-dragging"); // re-enabling scroll-snap settles on a card
    });
  }

  /* ---------- hero orb: a rotating neural sphere ---------- */
  const canvas = $("[data-orb]");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const N = window.innerWidth < 700 ? 420 : 680;
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const pts = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = GOLDEN * i;
      pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r, accent: i % 41 === 0 });
    }
    // connect each point to its two nearest neighbours
    const edges = [];
    const adj = pts.map(() => []);
    for (let i = 0; i < N; i++) {
      let b1 = -1, b2 = -1, d1 = 9, d2 = 9;
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, dz = pts[i].z - pts[j].z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = j; } else if (d < d2) { d2 = d; b2 = j; }
      }
      [b1, b2].forEach((j) => {
        if (i < j || !adj[j].includes(i)) { edges.push([i, j]); adj[i].push(j); adj[j].push(i); }
      });
    }
    // signals travelling along edges
    const signals = Array.from({ length: 16 }, () => {
      const a = Math.floor(Math.random() * N);
      return { a, b: adj[a][0], t: Math.random(), speed: 0.012 + Math.random() * 0.02 };
    });
    // glow sprite
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext("2d");
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(220,230,255,1)");
    g.addColorStop(0.25, "rgba(120,150,255,.55)");
    g.addColorStop(1, "rgba(62,108,255,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);

    let W = 0, H = 0, DPR = 1, R = 0;
    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      R = Math.min(W, H) * 0.33;
    };
    resize();
    new ResizeObserver(resize).observe(canvas);

    let rotY = 0.6, rotX = -0.25, targetX = -0.25, targetYOff = 0, yOff = 0;
    window.addEventListener("pointermove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      targetX = -0.25 + ny * 0.5;
      targetYOff = nx * 0.8;
    }, { passive: true });

    const proj = new Float32Array(N * 3);
    const CAM = 3.2;
    const ringPts = (tiltX, tiltZ, rad) => {
      const arr = [];
      for (let k = 0; k <= 120; k++) {
        const a = (k / 120) * Math.PI * 2;
        let x = Math.cos(a) * rad, y = 0, z = Math.sin(a) * rad;
        // tilt around X
        let y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
        let z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
        // tilt around Z
        const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
        const y2 = x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
        arr.push([x2, y2, z1]);
      }
      return arr;
    };
    const rings = [
      { p: ringPts(1.25, 0.35, 1.32), dot: 0, speed: 0.004 },
      { p: ringPts(1.1, -0.6, 1.5), dot: 0.5, speed: -0.003 },
    ];

    const rotate = (x, y, z, cy, sy, cx, sx) => {
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y1 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      return [x1, y1, z2];
    };

    let running = true, raf = 0, last = performance.now();
    const frame = (now) => {
      const dt = Math.min(48, now - last) / 16.67;
      last = now;
      if (!reduceMotion) rotY += 0.0022 * dt;
      rotX += (targetX - rotX) * 0.04;
      yOff += (targetYOff - yOff) * 0.04;

      const cy = Math.cos(rotY + yOff), sy = Math.sin(rotY + yOff);
      const cx = Math.cos(rotX), sx = Math.sin(rotX);
      const ox = W / 2, oy = H / 2;
      const breathe = 1 + Math.sin(now / 2200) * 0.012;

      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const [x, y, z] = rotate(p.x, p.y, p.z, cy, sy, cx, sx);
        const s = CAM / (CAM - z);
        proj[i * 3] = ox + x * R * breathe * s;
        proj[i * 3 + 1] = oy + y * R * breathe * s;
        proj[i * 3 + 2] = z;
      }

      // rings (back half first)
      const drawRing = (ring, front) => {
        ctx.beginPath();
        let started = false;
        for (let k = 0; k < ring.p.length; k++) {
          const [rx, ry, rz] = ring.p[k];
          const [x, y, z] = rotate(rx, ry, rz, cy, sy, cx, sx);
          if ((z >= 0) !== front) { started = false; continue; }
          const s = CAM / (CAM - z);
          const px = ox + x * R * s, py = oy + y * R * s;
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = front ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.07)";
        ctx.lineWidth = 1;
        ctx.stroke();
      };
      rings.forEach((r) => drawRing(r, false));

      // edges
      ctx.lineWidth = 0.6;
      for (let e = 0; e < edges.length; e++) {
        const [a, b] = edges[e];
        const za = proj[a * 3 + 2], zb = proj[b * 3 + 2];
        const depth = (za + zb) / 2;
        const alpha = 0.03 + Math.max(0, depth + 0.3) * 0.13;
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(proj[a * 3], proj[a * 3 + 1]);
        ctx.lineTo(proj[b * 3], proj[b * 3 + 1]);
        ctx.stroke();
      }

      // nodes
      for (let i = 0; i < N; i++) {
        const z = proj[i * 3 + 2];
        const k = (z + 1) / 2;
        const size = 0.5 + k * 1.5;
        if (pts[i].accent) {
          const glow = 10 + k * 14;
          ctx.globalAlpha = 0.35 + k * 0.5;
          ctx.drawImage(sprite, proj[i * 3] - glow / 2, proj[i * 3 + 1] - glow / 2, glow, glow);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = `rgba(255,255,255,${(0.12 + k * 0.8).toFixed(3)})`;
        ctx.fillRect(proj[i * 3] - size / 2, proj[i * 3 + 1] - size / 2, size, size);
      }

      // signals
      for (const sg of signals) {
        sg.t += sg.speed * dt;
        if (sg.t >= 1) {
          const nextOpts = adj[sg.b].filter((n) => n !== sg.a);
          sg.a = sg.b;
          sg.b = nextOpts.length ? nextOpts[Math.floor(Math.random() * nextOpts.length)] : adj[sg.a][0];
          sg.t = 0;
        }
        const x = proj[sg.a * 3] + (proj[sg.b * 3] - proj[sg.a * 3]) * sg.t;
        const y = proj[sg.a * 3 + 1] + (proj[sg.b * 3 + 1] - proj[sg.a * 3 + 1]) * sg.t;
        const z = proj[sg.a * 3 + 2];
        if (z < -0.2) continue;
        const size = 12 + z * 10;
        ctx.globalAlpha = 0.5 + z * 0.5;
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;

      // front ring halves + travelling dots
      rings.forEach((r) => {
        drawRing(r, true);
        r.dot = (r.dot + r.speed * dt + 1) % 1;
        const idx = Math.floor(r.dot * (r.p.length - 1));
        const [rx, ry, rz] = r.p[idx];
        const [x, y, z] = rotate(rx, ry, rz, cy, sy, cx, sx);
        const s = CAM / (CAM - z);
        const size = z > 0 ? 18 : 8;
        ctx.globalAlpha = z > 0 ? 0.9 : 0.25;
        ctx.drawImage(sprite, ox + x * R * s - size / 2, oy + y * R * s - size / 2, size, size);
        ctx.globalAlpha = 1;
      });

      if (running && !reduceMotion) raf = requestAnimationFrame(frame);
    };

    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    if (reduceMotion) {
      requestAnimationFrame(frame);
    } else {
      new IntersectionObserver(([en]) => {
        running = en.isIntersecting && !document.hidden;
        running ? start() : stop();
      }).observe(canvas);
      document.addEventListener("visibilitychange", () => {
        running = !document.hidden;
        running ? start() : stop();
      });
    }
  }

  /* ---------- misc ---------- */
  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();

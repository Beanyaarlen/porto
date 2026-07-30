(() => {
  "use strict";

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const degree = Math.PI / 180;
  const globeTilt = -0.22;
  const minZoom = 0.75;
  const maxZoom = 1.55;
  const zoomStep = 0.08;

  const globePoints = [
    {
      id: "jakarta",
      number: "01",
      category: "Domisili",
      title: "Jakarta, Indonesia",
      description: "Tempat saya belajar, bekerja, dan mengembangkan produk digital.",
      detail: "Jakarta · Indonesia",
      latitude: -12,
      longitude: -20,
    },
    {
      id: "onda",
      number: "02",
      category: "Pengalaman saat ini",
      title: "PT Onda Printing",
      description: "Pengembangan website perusahaan dan alur pemesanan yang terhubung dengan database.",
      detail: "PHP · MySQL · JavaScript",
      latitude: 22,
      longitude: 35,
    },
    {
      id: "infomedic",
      number: "03",
      category: "Proyek pilihan",
      title: "InfoMedic",
      description: "Prototipe chatbot informasi kesehatan yang dibuat menggunakan Rasa dan Python.",
      detail: "Python · Rasa · NLP",
      latitude: 8,
      longitude: 125,
    },
    {
      id: "ukrida",
      number: "04",
      category: "Pendidikan",
      title: "UKRIDA",
      description: "S1 Informatika dengan pembelajaran seputar perangkat lunak, data, dan teknologi informasi.",
      detail: "Informatika · 2022—sekarang",
      latitude: -28,
      longitude: -120,
    },
  ];

  function projectPoint(latitude, longitude, rotation) {
    const lat = latitude * degree;
    const lon = (longitude + rotation) * degree;
    const sphereX = Math.cos(lat) * Math.sin(lon);
    const sphereY = Math.sin(lat);
    const sphereZ = Math.cos(lat) * Math.cos(lon);
    const tiltedY = sphereY * Math.cos(globeTilt) - sphereZ * Math.sin(globeTilt);
    const tiltedZ = sphereY * Math.sin(globeTilt) + sphereZ * Math.cos(globeTilt);

    return { x: 50 + sphereX * 42, y: 50 - tiltedY * 42, z: tiltedZ };
  }

  function drawCurve(context, samples, front, accent = false) {
    context.beginPath();
    let drawing = false;

    samples.forEach((sample) => {
      const visible = front ? sample.z >= 0 : sample.z < 0;
      const x = sample.x * 6;
      const y = sample.y * 6;
      if (!visible) {
        drawing = false;
        return;
      }
      if (!drawing) context.moveTo(x, y);
      else context.lineTo(x, y);
      drawing = true;
    });

    context.setLineDash(front ? [] : [4, 9]);
    context.lineWidth = accent ? 1.8 : front ? 1.15 : 0.8;
    context.strokeStyle = accent
      ? "rgba(255, 107, 53, 0.9)"
      : front
        ? "rgba(241, 237, 228, 0.34)"
        : "rgba(241, 237, 228, 0.12)";
    context.stroke();
  }

  function drawWireframe(canvas, rotation) {
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const curves = [];
    for (let longitude = -180; longitude < 180; longitude += 30) {
      const samples = [];
      for (let latitude = -90; latitude <= 90; latitude += 3) {
        samples.push(projectPoint(latitude, longitude, rotation));
      }
      curves.push({ samples });
    }
    for (let latitude = -67.5; latitude <= 67.5; latitude += 22.5) {
      const samples = [];
      for (let longitude = -180; longitude <= 180; longitude += 3) {
        samples.push(projectPoint(latitude, longitude, rotation));
      }
      curves.push({ samples, accent: latitude === 0 });
    }

    curves.forEach(({ samples, accent }) => drawCurve(context, samples, false, accent));
    curves.forEach(({ samples, accent }) => drawCurve(context, samples, true, accent));
    context.setLineDash([]);
  }

  function initializeGlobe() {
    const sphere = document.querySelector(".globe-sphere");
    const canvas = document.querySelector(".globe-canvas");
    const pointsLayer = document.querySelector(".globe-points");
    const information = document.querySelector(".globe-information");
    const zoomOutput = document.querySelector(".globe-toolbar output");
    if (!sphere || !canvas || !pointsLayer || !information || !zoomOutput) return;

    let activeId = globePoints[0].id;
    let zoom = 1;
    let rotation = 0;
    let velocity = 0;
    let inertiaFrame = 0;
    let dragging = false;
    let pointerX = 0;
    let pointerTime = 0;

    const pointButtons = globePoints.map((point) => {
      const button = document.createElement("button");
      button.className = "globe-point";
      button.type = "button";
      button.setAttribute("aria-label", `${point.category}: ${point.title}`);
      button.innerHTML = `<span class="globe-point-number">${point.number}</span><span class="globe-node-label">${point.title}</span>`;
      const select = () => selectPoint(point.id);
      button.addEventListener("pointerenter", select);
      button.addEventListener("focus", select);
      button.addEventListener("click", select);
      pointsLayer.append(button);
      return { point, button };
    });

    function selectPoint(id) {
      activeId = id;
      const point = globePoints.find((item) => item.id === activeId) || globePoints[0];
      information.querySelector(".globe-information-heading span").textContent = point.number;
      information.querySelector(".globe-information-heading p").textContent = point.category;
      information.querySelector("h2").textContent = point.title;
      information.querySelector(".globe-information-copy").textContent = point.description;
      information.querySelector("footer").textContent = point.detail;
      renderPoints();
    }

    function renderPoints() {
      pointButtons.forEach(({ point, button }) => {
        const projected = projectPoint(point.latitude, point.longitude, rotation);
        const visible = projected.z > -0.04;
        button.classList.toggle("is-active", point.id === activeId);
        button.setAttribute("aria-pressed", String(point.id === activeId));
        button.setAttribute("aria-hidden", String(!visible));
        button.tabIndex = visible ? 0 : -1;
        button.style.setProperty("--point-x", `${projected.x}%`);
        button.style.setProperty("--point-y", `${projected.y}%`);
        button.style.setProperty("--point-scale", String(0.78 + Math.max(projected.z, -0.2) * 0.28));
        button.style.setProperty("--point-opacity", visible ? "1" : "0.12");
        button.style.pointerEvents = visible ? "auto" : "none";
      });
    }

    function renderGlobe() {
      sphere.style.setProperty("--globe-zoom", String(zoom));
      zoomOutput.textContent = `${Math.round(zoom * 100)}%`;
      drawWireframe(canvas, rotation);
      renderPoints();
    }

    function setZoom(nextZoom) {
      zoom = Number(clamp(nextZoom, minZoom, maxZoom).toFixed(2));
      renderGlobe();
    }

    function stopInertia() {
      cancelAnimationFrame(inertiaFrame);
      velocity = 0;
    }

    function resetGlobe() {
      stopInertia();
      zoom = 1;
      rotation = 0;
      renderGlobe();
    }

    function continueWithInertia() {
      velocity *= 0.94;
      if (Math.abs(velocity) < 0.025) return;
      rotation += velocity;
      renderGlobe();
      inertiaFrame = requestAnimationFrame(continueWithInertia);
    }

    sphere.addEventListener("wheel", (event) => {
      event.preventDefault();
      setZoom(zoom + (event.deltaY < 0 ? zoomStep : -zoomStep));
    }, { passive: false });

    sphere.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      stopInertia();
      sphere.setPointerCapture(event.pointerId);
      pointerX = event.clientX;
      pointerTime = performance.now();
      dragging = true;
      sphere.classList.add("is-dragging");
    });

    sphere.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const now = performance.now();
      const movement = event.clientX - pointerX;
      const elapsedFrames = Math.max((now - pointerTime) / 16.67, 0.5);
      const rotationChange = movement * 0.48;
      rotation += rotationChange;
      velocity = rotationChange / elapsedFrames;
      pointerX = event.clientX;
      pointerTime = now;
      renderGlobe();
    });

    const endDrag = (event) => {
      if (!dragging) return;
      if (sphere.hasPointerCapture(event.pointerId)) sphere.releasePointerCapture(event.pointerId);
      dragging = false;
      sphere.classList.remove("is-dragging");
      inertiaFrame = requestAnimationFrame(continueWithInertia);
    };
    sphere.addEventListener("pointerup", endDrag);
    sphere.addEventListener("pointercancel", endDrag);
    sphere.addEventListener("dblclick", resetGlobe);

    sphere.addEventListener("keydown", (event) => {
      if (event.target !== sphere) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        stopInertia();
        rotation += event.key === "ArrowLeft" ? -10 : 10;
        renderGlobe();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom(zoom + zoomStep);
      } else if (event.key === "-") {
        event.preventDefault();
        setZoom(zoom - zoomStep);
      } else if (event.key === "0") {
        event.preventDefault();
        resetGlobe();
      }
    });

    document.querySelector('[data-globe-control="zoom-out"]').addEventListener("click", () => setZoom(zoom - zoomStep));
    document.querySelector('[data-globe-control="zoom-in"]').addEventListener("click", () => setZoom(zoom + zoomStep));
    document.querySelector('[data-globe-control="reset"]').addEventListener("click", resetGlobe);

    selectPoint(activeId);
    renderGlobe();
  }

  function initializeMotion() {
    const root = document.documentElement;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = matchMedia("(pointer: coarse)");
    const revealItems = [...document.querySelectorAll("[data-reveal]")];

    if (reducedMotion.matches) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    root.classList.add("motion-ready");
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));

    const updateScroll = () => {
      const scrollable = document.documentElement.scrollHeight - innerHeight;
      const progress = scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0;
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
    };
    updateScroll();
    addEventListener("scroll", updateScroll, { passive: true });

    if (!coarsePointer.matches) {
      document.querySelectorAll("[data-tilt]").forEach((item) => {
        item.addEventListener("pointermove", (event) => {
          const bounds = item.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width;
          const y = (event.clientY - bounds.top) / bounds.height;
          item.style.setProperty("--tilt-x", `${((0.5 - y) * 1.8).toFixed(2)}deg`);
          item.style.setProperty("--tilt-y", `${((x - 0.5) * 2.4).toFixed(2)}deg`);
          item.style.setProperty("--shine-x", `${(x * 100).toFixed(1)}%`);
          item.style.setProperty("--shine-y", `${(y * 100).toFixed(1)}%`);
        });
        item.addEventListener("pointerleave", () => {
          item.style.setProperty("--tilt-x", "0deg");
          item.style.setProperty("--tilt-y", "0deg");
        });
      });
    }
  }

  initializeMotion();
  initializeGlobe();
})();

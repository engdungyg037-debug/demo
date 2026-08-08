const revealItems = document.querySelectorAll(".reveal");
const contactCards = document.querySelectorAll("[data-copy]");
const qrOpenButtons = document.querySelectorAll("[data-qr-open]");
const qrCloseButtons = document.querySelectorAll("[data-qr-close]");
const toast = document.querySelector(".copy-toast");

/* Pony scroll progress */
(function initPonyScrollProgress() {
  let ticking = false;
  const header = document.querySelector(".site-header");

  const updateProgress = () => {
    if (header) {
      document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
    }
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    const runnerSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--runner-size")) || 64;
    const travel = Math.max(0, window.innerWidth - runnerSize - 12);
    document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
    document.documentElement.style.setProperty("--scroll-x", `${(travel * progress).toFixed(2)}px`);
    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  updateProgress();
})();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1600);
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  return copied;
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopy(text)) {
      throw new Error("Fallback copy failed");
    }
    showToast("已复制：" + text);
  } catch (error) {
    showToast("复制失败，请手动选择文字");
  }
}


function openQrModal(id) {
  const modal = document.getElementById(id);
  if (!modal) {
    return;
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeQrModal(modal) {
  if (!modal) {
    return;
  }
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

qrOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openQrModal(button.dataset.qrOpen);
  });
});

qrCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeQrModal(button.closest(".qr-modal"));
  });
});

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("qr-modal")) {
    closeQrModal(event.target);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".qr-modal.is-open").forEach(closeQrModal);
  }
});
contactCards.forEach((card) => {
  card.addEventListener("click", () => {
    copyText(card.dataset.copy);
  });
});

function autoScrollCarousel(selector) {
  const carousel = document.querySelector(selector);
  if (!carousel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let timer;
  const getStep = () => {
    const card = carousel.querySelector(".experience-photo-card, .service-photo-card");
    const gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : carousel.clientWidth;
  };

  const start = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (carousel.scrollLeft >= maxScroll - 8) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        carousel.scrollBy({ left: getStep(), behavior: "smooth" });
      }
    }, 2800);
  };

  const pause = () => window.clearInterval(timer);

  carousel.addEventListener("mouseenter", pause);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("touchstart", pause, { passive: true });
  carousel.addEventListener("touchend", start);

  start();
}

autoScrollCarousel(".experience-photos");
const courseMomentsGallery = document.querySelector(".course-moments-gallery");

if (courseMomentsGallery) {
  const courseCards = [...courseMomentsGallery.querySelectorAll(".service-photo-card")];
  const caseOverlay = courseMomentsGallery.querySelector(".course-case-overlay");
  const casePanel = courseMomentsGallery.querySelector(".course-case-panel");
  const casePreview = courseMomentsGallery.querySelector(".course-case-preview");
  const previewImage = casePreview.querySelector("img");
  const closeButton = courseMomentsGallery.querySelector(".course-case-close");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let closeTimer;

  const closeCourseCase = () => {
    window.clearTimeout(closeTimer);
    courseCards.forEach((card) => {
      card.classList.remove("is-active");
      card.setAttribute("aria-expanded", "false");
    });
    caseOverlay.hidden = true;
    previewImage.removeAttribute("src");
    previewImage.alt = "";
  };

  const openCourseCase = (card) => {
    const template = document.getElementById(`course-case-${card.dataset.case}`);
    if (!template) return;

    const wasActive = card.classList.contains("is-active");
    closeCourseCase();
    if (wasActive) return;

    const content = template.content;
    const tagContainer = casePanel.querySelector(".course-case-tags");
    tagContainer.replaceChildren(...[...content.querySelectorAll(".course-case-tag")].map((tag) => tag.cloneNode(true)));
    casePanel.querySelector("h4").textContent = content.querySelector("h4").textContent;
    casePanel.querySelector("p").textContent = content.querySelector("p").textContent;
    const photosRect = courseMomentsGallery.querySelector(".course-service-photos").getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const arrowPosition = ((cardRect.left + cardRect.width / 2 - photosRect.left) / photosRect.width) * 100;
    casePanel.style.setProperty("--case-arrow", `${Math.min(92, Math.max(8, arrowPosition))}%`);
    const selectedImage = card.querySelector("img");
    previewImage.src = selectedImage.currentSrc || selectedImage.src;
    previewImage.alt = selectedImage.alt;
    card.classList.add("is-active");
    card.setAttribute("aria-expanded", "true");
    caseOverlay.hidden = false;
  };

  courseCards.forEach((card) => {
    card.addEventListener("click", () => openCourseCase(card));

    card.addEventListener("pointermove", (event) => {
      if (!finePointer.matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(x * 9).toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });

  closeButton.addEventListener("click", closeCourseCase);

  courseMomentsGallery.addEventListener("mouseenter", () => window.clearTimeout(closeTimer));
  courseMomentsGallery.addEventListener("mouseleave", () => {
    if (finePointer.matches && !caseOverlay.hidden) {
      closeTimer = window.setTimeout(closeCourseCase, 450);
    }
  });

  document.addEventListener("click", (event) => {
    if (!courseMomentsGallery.contains(event.target)) closeCourseCase();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !caseOverlay.hidden) closeCourseCase();
  });
}

const overviewImages = [...document.querySelectorAll(".materials-gallery .material-card img, .ai-screenshot-gallery .ai-shot img")];

if (overviewImages.length) {
  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "图片大图预览");
  lightbox.innerHTML = `<button class="image-lightbox-close" type="button" aria-label="关闭大图预览">&times;</button><img src="" alt="" />`;
  document.body.append(lightbox);
  const lightboxImage = lightbox.querySelector("img");
  const lightboxClose = lightbox.querySelector(".image-lightbox-close");
  let previouslyFocused;
  const closeLightbox = () => { lightbox.classList.remove("is-open"); document.body.style.overflow = ""; lightboxImage.removeAttribute("src"); lightboxImage.alt = ""; previouslyFocused?.focus(); };
  const openLightbox = (image) => { previouslyFocused = document.activeElement; lightboxImage.src = image.currentSrc || image.src; lightboxImage.alt = image.alt; lightbox.classList.add("is-open"); document.body.style.overflow = "hidden"; lightboxClose.focus(); };
  overviewImages.forEach((image) => {
    const imageContainer = image.closest("figure");
    imageContainer.tabIndex = 0;
    imageContainer.setAttribute("role", "button");
    imageContainer.setAttribute("aria-label", `查看大图：${image.alt}`);
    imageContainer.addEventListener("click", () => openLightbox(image));
    imageContainer.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLightbox(image); } });
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox(); });
}


/* ── Emoji burst on click ── */
(function () {
  const EMOJIS = ["✨", "🌟", "⭐", "💫", "🌈", "🎉", "🎊", "💖", "💝", "🌸", "🌺", "🌻", "🍀", "🦋", "🧸", "🎨", "💐", "🎈", "🎀", "🪷"];
  const MAX = 130;
  const PER_CLICK = 14;
  const particles = [];
  let rafId = null;

  function burst(cx, cy) {
    while (particles.length + PER_CLICK > MAX) {
      particles.shift().el.remove();
    }
    for (let i = 0; i < PER_CLICK; i++) {
      const el = document.createElement("span");
      el.className = "emoji-particle";
      el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const base = (Math.PI * 2 * i) / PER_CLICK;
      const angle = base + (Math.random() - 0.5) * 0.55;
      const dist = 75 + Math.random() * 170;
      const size = 18 + Math.random() * 28;
      el.style.cssText = "left:" + cx + "px;top:" + cy + "px;font-size:" + size + "px";
      document.body.appendChild(el);
      particles.push({
        el: el,
        ox: cx,
        oy: cy,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 35,
        rot: (Math.random() - 0.5) * 400,
        rotV: (Math.random() - 0.5) * 580,
        dur: 550 + Math.random() * 750,
        t0: performance.now()
      });
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const t = Math.min((now - p.t0) / p.dur, 1);
      if (t >= 1) { p.el.remove(); particles.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - t, 3);
      const gy = 45 * t * t;
      p.el.style.transform = "translate(" + (p.dx * e).toFixed(1) + "px," + (p.dy * e + gy).toFixed(1) + "px) rotate(" + (p.rot + p.rotV * t).toFixed(1) + "deg)";
      p.el.style.opacity = (1 - t).toFixed(3);
    }
    if (particles.length) rafId = requestAnimationFrame(tick); else rafId = null;
  }

  document.addEventListener("click", function (e) { burst(e.clientX, e.clientY); });
})();

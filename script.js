const revealItems = document.querySelectorAll(".reveal");
const contactCards = document.querySelectorAll("[data-copy]");
const qrOpenButtons = document.querySelectorAll("[data-qr-open]");
const qrCloseButtons = document.querySelectorAll("[data-qr-close]");
const toast = document.querySelector(".copy-toast");

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

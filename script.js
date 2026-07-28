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
autoScrollCarousel(".course-service-photos");



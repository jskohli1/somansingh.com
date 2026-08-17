const heroImages = [
  "assets/images/hero-01.jpg",
  "assets/images/hero-02.jpg",
  "assets/images/hero-03.jpg",
  "assets/images/hero-04.jpg",
  "assets/images/hero-05.jpg",
  "assets/images/hero-06.jpg",
  "assets/images/hero-07.jpg",
  "assets/images/hero-08.jpg",
];

const slides = [...document.querySelectorAll("[data-hero-slide]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const moveDuration = 5000;
const fadeDuration = 2200;
const scaleLow = 1;
const scaleHigh = 1.08;
let activeLayer = 0;
let imageIndex = 0;
let currentScale = scaleLow;
let nextScale = scaleHigh;
let sequenceTimer;
let zoomAnimation;

for (let index = 1; index < heroImages.length; index += 1) {
  const image = new Image();
  image.src = heroImages[index];
}

function moveActiveSlide() {
  const active = slides[activeLayer];
  active.style.transform = `scale(${currentScale})`;
  zoomAnimation = active.animate(
    [
      { transform: `scale(${currentScale})` },
      { transform: `scale(${nextScale})` },
    ],
    { duration: moveDuration, easing: "linear", fill: "forwards" }
  );
  sequenceTimer = window.setTimeout(dissolveToNextSlide, moveDuration);
}

function dissolveToNextSlide() {
  const outgoing = slides[activeLayer];
  const incomingLayer = activeLayer === 0 ? 1 : 0;
  const incoming = slides[incomingLayer];

  incoming.getAnimations().forEach((animation) => animation.cancel());
  imageIndex = (imageIndex + 1) % heroImages.length;
  currentScale = nextScale;
  incoming.style.backgroundImage = `url("${heroImages[imageIndex]}")`;
  incoming.style.transform = `scale(${currentScale})`;
  incoming.style.zIndex = "2";
  outgoing.style.zIndex = "1";
  incoming.classList.add("is-active");

  requestAnimationFrame(() => outgoing.classList.remove("is-active"));
  sequenceTimer = window.setTimeout(() => {
    outgoing.style.zIndex = "0";
    activeLayer = incomingLayer;
    nextScale = currentScale === scaleHigh ? scaleLow : scaleHigh;
    moveActiveSlide();
  }, fadeDuration);
}

function setSlideshow() {
  window.clearTimeout(sequenceTimer);
  zoomAnimation?.cancel();
  if (!reducedMotion.matches && slides.length === 2) {
    moveActiveSlide();
  }
}

setSlideshow();
reducedMotion.addEventListener("change", setSlideshow);

const menuToggle = document.querySelector("[data-menu-toggle]");
const navigation = document.querySelector("[data-nav]");

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  navigation.classList.toggle("is-open", !open);
  document.body.classList.toggle("menu-open", !open);
});

navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
document.querySelector("[data-year]").textContent = new Date().getFullYear();

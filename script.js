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
let zoomingIn = true;
let sequenceVersion = 0;
let heroIsVisible = true;
const controlledAnimations = new Set();

function prepareImage(index) {
  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = "low";
  image.src = heroImages[index];
  const ready = typeof image.decode === "function"
    ? image.decode().catch(() => undefined)
    : new Promise((resolve) => {
        if (image.complete) resolve();
        else {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        }
      });
  return { index, image, ready };
}

let preparedImage = heroImages.length > 1 ? prepareImage(1) : null;

function updatePlaybackState() {
  const shouldPlay = heroIsVisible && !document.hidden;
  controlledAnimations.forEach((animation) => {
    if (shouldPlay) animation.play();
    else animation.pause();
  });
}

async function playAnimation(animation) {
  controlledAnimations.add(animation);
  updatePlaybackState();
  try {
    await animation.finished;
    return true;
  } catch {
    return false;
  } finally {
    controlledAnimations.delete(animation);
  }
}

function stopAnimations() {
  controlledAnimations.forEach((animation) => animation.cancel());
  controlledAnimations.clear();
}

async function animateScale(slide, from, to, version) {
  slide.style.transform = `scale(${from})`;
  const animation = slide.animate(
    [{ transform: `scale(${from})` }, { transform: `scale(${to})` }],
    { duration: moveDuration, easing: "linear", fill: "both" }
  );
  const finished = await playAnimation(animation);
  if (!finished || version !== sequenceVersion) return false;
  slide.style.transform = `scale(${to})`;
  animation.cancel();
  return true;
}

async function dissolve(outgoing, incoming, version) {
  outgoing.style.opacity = "1";
  incoming.style.opacity = "0";
  const options = { duration: fadeDuration, easing: "cubic-bezier(.45,0,.25,1)", fill: "both" };
  const fadeOut = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], options);
  const fadeIn = incoming.animate([{ opacity: 0 }, { opacity: 1 }], options);
  const [outFinished, inFinished] = await Promise.all([
    playAnimation(fadeOut),
    playAnimation(fadeIn),
  ]);
  if (!outFinished || !inFinished || version !== sequenceVersion) return false;
  outgoing.style.opacity = "0";
  incoming.style.opacity = "1";
  fadeOut.cancel();
  fadeIn.cancel();
  return true;
}

async function runSlideshow(version) {
  while (version === sequenceVersion && !reducedMotion.matches) {
    const outgoing = slides[activeLayer];
    const targetScale = zoomingIn ? scaleHigh : scaleLow;
    if (!(await animateScale(outgoing, currentScale, targetScale, version))) return;

    currentScale = targetScale;
    imageIndex = (imageIndex + 1) % heroImages.length;
    if (!preparedImage || preparedImage.index !== imageIndex) {
      preparedImage = prepareImage(imageIndex);
    }
    await preparedImage.ready;
    if (version !== sequenceVersion) return;

    const incomingLayer = activeLayer === 0 ? 1 : 0;
    const incoming = slides[incomingLayer];
    incoming.getAnimations().forEach((animation) => animation.cancel());
    incoming.style.backgroundImage = `url("${heroImages[imageIndex]}")`;
    incoming.style.transform = `scale(${currentScale})`;
    outgoing.style.transform = `scale(${currentScale})`;
    incoming.style.zIndex = "2";
    outgoing.style.zIndex = "1";
    incoming.classList.add("is-active");
    preparedImage = prepareImage((imageIndex + 1) % heroImages.length);

    if (!(await dissolve(outgoing, incoming, version))) return;
    outgoing.classList.remove("is-active");
    outgoing.style.zIndex = "0";
    incoming.style.zIndex = "1";
    activeLayer = incomingLayer;
    zoomingIn = !zoomingIn;
  }
}

function setSlideshow() {
  sequenceVersion += 1;
  stopAnimations();
  currentScale = scaleLow;
  zoomingIn = true;
  slides.forEach((slide, index) => {
    slide.getAnimations().forEach((animation) => animation.cancel());
    slide.classList.toggle("is-active", index === activeLayer);
    slide.style.opacity = index === activeLayer ? "1" : "0";
    slide.style.transform = `scale(${scaleLow})`;
    slide.style.zIndex = index === activeLayer ? "1" : "0";
  });
  if (!reducedMotion.matches && slides.length === 2) {
    runSlideshow(sequenceVersion);
  }
}

const heroObserver = new IntersectionObserver(([entry]) => {
  heroIsVisible = entry.isIntersecting;
  updatePlaybackState();
}, { threshold: 0.01 });

heroObserver.observe(document.querySelector(".hero"));
document.addEventListener("visibilitychange", updatePlaybackState);
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

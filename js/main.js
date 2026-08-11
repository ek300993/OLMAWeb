// OLMA marketing site — scroll reveals + hero demo cycle

// Scroll-reveal via IntersectionObserver
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// SVG line-drawing reveal for feature visuals
const drawObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        drawObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.35 }
);

document.querySelectorAll(".draw").forEach((el) => drawObserver.observe(el));

// Hero phone demo — cycle through scan results in sync with the
// 3.4s scan-line animation so the verdict updates as each scan completes.
const demos = [
  { product: "Espresso maker",   verdict: "good", label: "Good deal",  local: "€64",    home: "€89",     fill: 32 },
  { product: "Trail runners",    verdict: "fair", label: "Fair price", local: "$118",   home: "$112",    fill: 55 },
  { product: "Noise-canc. buds", verdict: "high", label: "Overpriced", local: "£249",   home: "£179",    fill: 86 },
  { product: "Ceramic teapot",   verdict: "good", label: "Good deal",  local: "₩38,000", home: "₩61,000", fill: 26 },
];

const productEl = document.getElementById("demo-product");
const pillEl = document.getElementById("demo-pill");
const localEl = document.getElementById("demo-local");
const homeEl = document.getElementById("demo-home");
const barEl = document.getElementById("demo-bar");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (productEl && !reduceMotion) {
  let i = 0;
  // Initial bar fill after load
  requestAnimationFrame(() => {
    barEl.style.width = demos[0].fill + "%";
  });

  setInterval(() => {
    i = (i + 1) % demos.length;
    const d = demos[i];

    productEl.style.opacity = "0";
    setTimeout(() => {
      productEl.textContent = d.product;
      localEl.textContent = d.local;
      homeEl.textContent = d.home;
      productEl.style.opacity = "1";

      pillEl.className = "verdict-pill pop " + d.verdict;
      pillEl.textContent = d.label;
      setTimeout(() => pillEl.classList.remove("pop"), 400);

      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--" + d.verdict);
      barEl.style.background = color;
      barEl.style.width = d.fill + "%";
    }, 250);
  }, 3400);
}

// Play video when scrolled into view
const videoObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.play();
        videoObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.5 }
);

const storyVideo = document.getElementById("story-logo-video");
if (storyVideo) {
  videoObserver.observe(storyVideo);
}

// App Store links inside in-app browsers (Instagram, Facebook, TikTok, etc.)
//
// iOS only hands a tap on apps.apple.com off to the App Store app when the
// navigation is a real link activation. In-app webviews suppress that handoff,
// so the tap dead-ends and nothing happens. Navigating programmatically instead
// makes iOS render the App Store *web* page in the webview — which carries its
// own "View" button, and that tap does open the App Store app.
//
// Real browsers keep the default one-tap behaviour.
const IN_APP_BROWSER =
  /Instagram|FBAN|FBAV|FB_IAB|Messenger|TikTok|BytedanceWebview|Line\/|Snapchat|Pinterest|LinkedInApp|Twitter/i.test(
    navigator.userAgent
  );

if (IN_APP_BROWSER) {
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.('a[href*="apps.apple.com"]');
    if (!link || event.defaultPrevented) return;

    event.preventDefault();
    window.location.href = link.href;
  });
}

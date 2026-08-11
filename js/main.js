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
// These webviews refuse to navigate to apps.apple.com — the tap is a silent
// no-op whether it comes from a link activation or a JS navigation. Instagram
// exposes a private scheme, instagram://extbrowser?url=…, that hands the URL
// to the system browser; Safari then performs the App Store handoff normally.
// Other in-app browsers have no such escape, so they fall through to a sheet
// telling the user how to get out — better than a button that looks broken.
//
// Real browsers keep the default one-tap behaviour.
const IN_APP_BROWSER =
  /Instagram|FBAN|FBAV|FB_IAB|Messenger|TikTok|BytedanceWebview|Line\/|Snapchat|Pinterest|LinkedInApp|Twitter/i.test(
    navigator.userAgent
  );
const IS_INSTAGRAM = /Instagram/i.test(navigator.userAgent);

if (IN_APP_BROWSER) {
  let sheet = null;

  const buildSheet = (url) => {
    const el = document.createElement("div");
    el.className = "iab-sheet";
    el.innerHTML = `
      <div class="iab-scrim"></div>
      <div class="iab-card" role="dialog" aria-modal="true" aria-labelledby="iab-title">
        <h3 id="iab-title">Open in your browser</h3>
        <p>This app's built-in browser can't open the App Store. Tap the
           <strong>•••</strong> menu in the corner, then choose
           <strong>Open in browser</strong>.</p>
        <button type="button" class="btn btn-primary iab-copy">Copy link instead</button>
        <button type="button" class="btn btn-quiet iab-close">Close</button>
      </div>`;

    el.querySelector(".iab-copy").addEventListener("click", async (event) => {
      const button = event.currentTarget;
      try {
        await navigator.clipboard.writeText(url);
        button.textContent = "Copied — paste it in Safari";
      } catch {
        button.textContent = url;
      }
    });

    const close = () => el.classList.remove("in");
    el.querySelector(".iab-close").addEventListener("click", close);
    el.querySelector(".iab-scrim").addEventListener("click", close);

    document.body.appendChild(el);
    return el;
  };

  // Any of these means we successfully handed off and the webview is going
  // away — visibilityState alone is not reliable across these apps.
  let leaving = false;
  const markLeaving = () => { leaving = true; };
  window.addEventListener("pagehide", markLeaving);
  window.addEventListener("blur", markLeaving);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") markLeaving();
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.('a[href*="apps.apple.com"]');
    if (!link || event.defaultPrevented) return;

    event.preventDefault();
    const url = link.href;
    leaving = false;

    if (IS_INSTAGRAM) {
      // Instagram opens this in the system browser, which then hits the App Store.
      window.location.href = "instagram://extbrowser?url=" + encodeURIComponent(url);
    } else {
      // Costs nothing where the webview permits it.
      window.location.href = url;
    }

    setTimeout(() => {
      if (leaving || document.visibilityState === "hidden") return;
      sheet = sheet || buildSheet(url);
      sheet.classList.add("in");
    }, 1500);
  });
}

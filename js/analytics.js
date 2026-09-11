// Count App Store intent, not page scrolling or completed installs.
// Keep the existing event names so current GA4 / Meta reports continue working.
document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[href]");
  if (!link) return;
  const destination = new URL(link.href, window.location.href);
  if (destination.hostname !== "apps.apple.com") return;

  const details = {
    event_category: "engagement",
    page_path: window.location.pathname,
    cta_location: link.dataset.cta || link.closest("section")?.id || "navigation",
    link_url: destination.href,
    transport_type: "beacon",
  };
  if (!window["ga-disable-G-GTPLYG54S1"] && typeof window.gtag === "function") window.gtag("event", "download_click", details);
  if (typeof window.fbq === "function") window.fbq("trackCustom", "DownloadClick", {
    page_path: details.page_path,
    cta_location: details.cta_location,
  });
}, { capture: true });

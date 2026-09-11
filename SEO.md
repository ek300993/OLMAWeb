# SEO and download growth

The site is static HTML for the existing olmaapp.com hosting setup. No framework or hosting migration is required. These are local changes until deployed through the repository's existing publishing process.

## What changed

- Homepage title, description, heading, canonical URL, social cards, and iOS Smart App Banner describe the photo price comparison app.
- SoftwareApplication, Organization, and WebSite JSON-LD identify OLMA. Guide pages have BlogPosting and BreadcrumbList data matching visible content. There are no invented ratings, reviews, rankings, or savings claims in the new metadata.
- `/blog/` contains four distinct guides for photo price comparison, sale evaluation, shopping savings, and duty-free comparisons. Each has an answer summary, internal links, and an App Store CTA.
- All essential content is delivered as HTML and visible without JavaScript. Native FAQ disclosures work without JS. The Guides link is available on mobile.
- `robots.txt` permits crawling, including search crawlers, and points to `sitemap.xml`. The redirect helper `/get/` stays noindex and out of the sitemap.
- App Store links send the existing `download_click` GA4 and `DownloadClick` Meta events once per click, with `page_path` and `cta_location`. This fixes missing navigation tracking and the old scroll-as-download event. It does not measure an installed app or subscribe users to anything. The `/get/` automatic handoff is not counted by this listener.
- The homepage footer uses the existing static logo instead of automatically loading an 812 KB animation.

## Publishing and measurement

1. Deploy these files using the existing host. Verify that `/blog/`, all four article URLs, `/robots.txt`, and `/sitemap.xml` return successful responses on the canonical HTTPS domain. Verify the host's redirects for www/HTTP and the legacy `/privacy` and `/terms` links used in the App Store. Current website links use the actual `.html` files.
2. In the verified Google Search Console property for olmaapp.com, submit `https://olmaapp.com/sitemap.xml` and inspect the homepage plus guides. Do the same sitemap submission in Bing Webmaster Tools. Sitemap submission has not been performed here. The September 10 Analytics audit confirmed that the olmaapp.com Search Console domain property was already linked to the OLMA web stream.
3. Use GA4 DebugView or Realtime after deployment to confirm `download_click` on a real device. On September 10, 2026, `download_click` was marked as a key event and `cta_location` was registered as the event-scoped “CTA location” dimension in the OLMA property. Existing reporting may shift because clicks are now measured consistently. The website event is App Store intent, not an install.
4. Compare organic landing sessions, App Store clicks, and click-through rate (App Store clicks / landing sessions), keeping the date range and segment consistent. Use App Store Connect acquisition data to assess actual downloads; website click events alone cannot establish installation conversion.
5. Inspect impressions and queries after indexing, then choose further topics from actual audience demand. No keyword search-volume data or Search Console performance baseline was available for this change, so the initial topics are product-fit hypotheses, not proven traffic forecasts.

## Analytics audit — September 10, 2026

- GA4 property OLMA (`546342691`), web stream `15292104433`, measurement ID `G-GTPLYG54S1`; ID matches the published site and local source.
- After refreshing the old Analytics tab, stream status confirmed active collection in the last 48 hours. Enhanced measurement, including page views, scrolls, and outbound clicks, is enabled. Google’s installation test detected the tag on the published https://olmaapp.com site. Public response headers showed no Content-Security-Policy blocking collection.
- `download_click` is now a key event. The new event-scoped `CTA location` dimension maps to `cta_location`; the revised website must be deployed before production clicks carry that parameter.
- Search Console is already linked to the correct domain and stream (linked July 22, 2026).
- The published site still counts the “Start scanning” anchor as a download and misses the navigation App Store link. The prepared site fixes both; publishing remains necessary.
- All tagged pages now set the GA disable flag before loading the Google tag on any host other than `olmaapp.com` or `www.olmaapp.com`. The click listener also honors it. This excludes future local/preview GA traffic; it does not remove historical data or modify Meta tracking.
- Two real App Store link clicks were exercised on the published site during the audit, one in Chrome and one in the in-app browser. Neither appeared in Realtime during the observed window; this is an unresolved end-to-end verification gap, not proof of successful delivery. Realtime showed local-preview page titles instead. Recheck after publishing with Tag Assistant/DebugView on a real device; test events may still appear later.
- Internal Traffic filter is in Testing; no permanent exclusions were activated. Event retention is 2 months and user retention is 14 months; these settings were left unchanged.
- The automatic `/get/` redirect and iOS Smart App Banner are outside the website click listener; do not equate the event count to all outbound traffic or installations.

## Updating the guides

Edit `content/guides.json`, then run:

```sh
python3 scripts/build_guides.py
python3 scripts/check_site.py
node scripts/check_analytics.cjs
git diff --check
```

Commit the generated `blog/` HTML, updated homepage guide links, and sitemap along with the source. Generation is deterministic and needs only Python's standard library. Retired guide URLs need a redirect decision before removing their published HTML. Publication dates are deliberately omitted until an actual publication date is known; do not regenerate fake freshness dates.

Useful follow-up content should add evidence: permission-cleared screenshots of real scans, exact model names, retailer sources, dates, matched quantities, and total costs. Publish observed comparisons only after checking them; keep illustrative examples clearly labeled. Do not add bulk pages for every product or city without distinct useful content.

## AI search approach and sources

Google says existing SEO fundamentals apply to AI search features: accessible text, useful internal links, crawlability, and structured data that matches the page. Special AI files or special schema are not required. An `llms.txt` file is therefore not part of this change. Inclusion and ranking are not guaranteed, and hosting/firewall rules can still prevent a permitted crawler from accessing a page.

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [OLMA's App Store listing](https://apps.apple.com/us/app/olma-scan-compare/id6790042890), used to check platform availability and free scan allowance on September 10, 2026.
- [FTC: Online Shopping](https://consumer.ftc.gov/articles/online-shopping), linked in the sale guide for its advice on total costs and deal conditions.

Content makes no guaranteed ranking or download uplift claims. The next step after publishing is measurement and improving pages that attract relevant shoppers.

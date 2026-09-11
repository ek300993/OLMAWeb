#!/usr/bin/env python3
"""Render crawlable static guides. Run from any directory; no dependencies."""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://olmaapp.com"
APP = "https://apps.apple.com/us/app/olma-scan-compare/id6790042890"
GUIDES = json.loads((ROOT / "content/guides.json").read_text())


def schema(data):
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False).replace("<", "\\u003c") + '</script>'


def metadata(title, description, path, kind="website"):
    return f'''<title>{escape(title)}</title>
  <meta name="description" content="{escape(description, quote=True)}" />
  <link rel="canonical" href="{BASE}{path}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="apple-itunes-app" content="app-id=6790042890" />
  <meta property="og:site_name" content="OLMA" />
  <meta property="og:type" content="{kind}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="{escape(title, quote=True)}" />
  <meta property="og:description" content="{escape(description, quote=True)}" />
  <meta property="og:url" content="{BASE}{path}" />
  <meta property="og:image" content="{BASE}/assets/olma-logo.png" />
  <meta property="og:image:width" content="846" />
  <meta property="og:image:height" content="846" />
  <meta property="og:image:alt" content="OLMA's teal pebble logo" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{escape(title, quote=True)}" />
  <meta name="twitter:description" content="{escape(description, quote=True)}" />
  <meta name="twitter:image" content="{BASE}/assets/olma-logo.png" />'''


def card(g, heading="h3"):
    return f'''<article class="guide-card">
      <span class="kicker">{escape(g['category'])}</span>
      <{heading}><a href="/blog/{g['slug']}/">{escape(g['title'])}</a></{heading}>
      <p>{escape(g['description'])}</p>
    </article>'''


def cta(location):
    return f'''<aside class="article-cta" aria-label="Try OLMA">
      <h2>Check the price before you buy.</h2>
      <p>Turn a product photo into a price comparison with OLMA.</p>
      <a class="btn btn-primary" data-cta="{location}" href="{APP}">Download OLMA free</a>
      <small>For iPhone and iPad. 5 free scans per month. No account required.</small>
    </aside>'''


def page(title, description, path, body, data, kind="website"):
    # Reuse the site's existing analytics initialization without adding vendors.
    home = (ROOT / "index.html").read_text()
    analytics = home[home.index('  <!-- Google tag'):home.index('  <!-- Meta Pixel Code -->')]
    pixel = home[home.index('  <!-- Meta Pixel Code -->'):home.index('  <!-- End Meta Pixel Code -->')]
    # A noscript image is body content, not valid head content.
    pixel_script = pixel[:pixel.index('  <noscript>')] if '  <noscript>' in pixel else pixel
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  {metadata(title, description, path, kind)}
  <meta name="color-scheme" content="light" />
  <link rel="icon" href="/assets/olma-logo.png" />
  <link rel="stylesheet" href="/css/style.css" />
  <link rel="stylesheet" href="/css/guides.css" />
  {schema(data)}
{analytics}{pixel_script}
  <script src="/js/analytics.js" defer></script>
  <script src="/js/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <nav class="nav" aria-label="Main navigation"><div class="nav-inner">
    <a class="brand" href="/" aria-label="OLMA home"><img src="/assets/olma-logo-full.png" width="3338" height="846" alt="OLMA" class="main-logo-img" /></a>
    <div class="nav-links"><a href="/#how">How it works</a><a href="/#pricing">Pricing</a><a class="nav-guides" href="/blog/">Guides</a><a class="nav-cta" data-cta="navigation" href="{APP}">Download</a></div>
  </div></nav>
  {body}
  <footer><div class="wrap footer-inner"><a href="/" aria-label="OLMA home"><img src="/assets/olma-logo-full.png" alt="OLMA" width="3338" height="846" class="footer-logo-img" /></a><span><a href="/blog/">Shopping guides</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms of Use</a><a href="mailto:evan@olmaapp.com">Support</a></span></div></footer>
</body>
</html>
'''


def build():
    for g in GUIDES:
        path = f"/blog/{g['slug']}/"
        toc = ''.join(f'<li><a href="#{s["id"]}">{escape(s["title"])}</a></li>' for s in g['sections'])
        sections = ''.join(f'<h2 id="{s["id"]}">{escape(s["title"])}</h2>\n{s["html"]}\n' for s in g['sections'])
        related = ''.join(card(other) for other in GUIDES if other != g)
        body = f'''<main id="main" class="article-main"><article>
          <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Shopping guides</a></nav>
          <header><span class="kicker">{escape(g['category'])}</span><h1>{escape(g['title'])}</h1><p class="article-meta">By OLMA · Shopping guides from the makers of the app</p></header>
          <div class="article-summary"><strong>The quick answer</strong><p>{escape(g['summary'])}</p></div>
          <nav class="article-toc" aria-label="In this guide"><strong>In this guide</strong><ol>{toc}</ol></nav>
          <div class="article-body">{sections}</div>
          {cta('article_end')}
          </article><section class="related-guides" aria-labelledby="related"><h2 id="related">Keep shopping smarter</h2><div class="guide-grid">{related}</div></section></main>'''
        data = {"@context": "https://schema.org", "@graph": [
            {"@type": "BlogPosting", "@id": BASE+path+"#article", "headline": g['title'], "description": g['description'], "url": BASE+path,
             "mainEntityOfPage": BASE+path, "image": BASE+"/assets/olma-logo.png", "inLanguage": "en", "articleSection": g['category'],
             "author": {"@type": "Organization", "name": "OLMA", "url": BASE+"/"},
             "publisher": {"@id": BASE+"/#organization", "@type": "Organization", "name": "OLMA", "url": BASE+"/", "logo": {"@type": "ImageObject", "url": BASE+"/assets/olma-logo.png"}},
             "isPartOf": {"@id": BASE+"/blog/#blog"}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE+"/"},
                {"@type": "ListItem", "position": 2, "name": "Shopping guides", "item": BASE+"/blog/"},
                {"@type": "ListItem", "position": 3, "name": g['title'], "item": BASE+path}]}]}
        output = ROOT / path.strip('/') / 'index.html'
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(page(g['title']+' | OLMA', g['description'], path, body, data, 'article'))

    cards = ''.join(card(g) for g in GUIDES)
    index_cards = "".join(card(g, "h2") for g in GUIDES)
    body = f'''<main id="main" class="guides-main"><div class="wrap">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Shopping guides</span></nav>
      <header><span class="kicker">The OLMA shopping guides</span><h1>A little checking.<br />A smarter purchase.</h1><p class="lede">Practical ways to compare prices, spot a real deal, and save money at home or abroad. Start with the question on your mind.</p></header>
      <div class="guide-grid">{index_cards}</div>{cta('guides_index')}
      </div></main>'''
    data = {"@context": "https://schema.org", "@type": "Blog", "@id": BASE+"/blog/#blog", "name": "OLMA Shopping Guides", "url": BASE+"/blog/", "description": "Practical guides to comparing prices and saving money while shopping.", "blogPost": [{"@type": "BlogPosting", "headline": g['title'], "url": BASE+f"/blog/{g['slug']}/"} for g in GUIDES]}
    (ROOT / 'blog/index.html').write_text(page('Price Comparison & Money-Saving Shopping Guides | OLMA', 'Compare prices, spot real deals, and save money shopping. Practical OLMA guides for photo price checks, sale shopping, and duty-free comparisons.', '/blog/', body, data))

    home = ROOT / 'index.html'
    start, end = '<!-- GUIDES:START -->', '<!-- GUIDES:END -->'
    html = home.read_text()
    if start in html:
        before, rest = html.split(start, 1)
        _, after = rest.split(end, 1)
        home.write_text(before+start+'\n<div class="guide-grid">'+cards+'</div>\n'+end+after)

    paths = ['/', '/blog/'] + [f"/blog/{g['slug']}/" for g in GUIDES] + ['/privacy.html', '/terms.html']
    # Omit lastmod until publication dates are known; do not fabricate freshness.
    (ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{BASE}{p}</loc></url>\n' for p in paths)+'</urlset>\n')
    print(f"Built {len(GUIDES)} guides, the blog index, homepage links, and sitemap.")


if __name__ == '__main__':
    build()

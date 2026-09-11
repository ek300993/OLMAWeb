#!/usr/bin/env python3
"""Check published HTML, structured data, internal links, and sitemap offline."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://olmaapp.com'


class Page(HTMLParser):
    def __init__(self, file):
        super().__init__(convert_charrefs=True)
        self.file = file
        self.tags = []
        self.ids = set()
        self.json = []
        self.capture = None
        self.title = ''
        self.in_title = False
        self.feed(file.read_text())

    def handle_starttag(self, tag, attrs):
        names = [k for k, v in attrs]
        assert len(names) == len(set(names)), f'{self.file}: duplicate attributes on {tag}'
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'{self.file}: duplicate id {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.capture = ''
        if tag == 'title':
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == 'script' and self.capture is not None:
            self.json.append(json.loads(self.capture))
            self.capture = None
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.capture is not None:
            self.capture += data
        if self.in_title:
            self.title += data

    def match(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]


def route(file):
    path = '/' + file.relative_to(ROOT).as_posix()
    return path[:-10] if path.endswith('index.html') else path


def check():
    files = [ROOT / 'index.html', ROOT / 'privacy.html', ROOT / 'terms.html', ROOT / 'get/index.html', *sorted((ROOT / 'blog').rglob('*.html'))]
    pages = {route(f): Page(f) for f in files}
    titles = set()
    indexed = set()
    for path, page in pages.items():
        assert page.title and page.title not in titles, f'{path}: missing or duplicate title'
        titles.add(page.title)
        assert len(page.match('h1')) == 1, f'{path}: expected one h1'
        noindex = any('noindex' in a.get('content', '') for a in page.match('meta', name='robots'))
        if not noindex:
            indexed.add(BASE + path)
            assert len(page.match('link', rel='canonical')) == 1, f'{path}: canonical count'
            assert page.match('link', rel='canonical')[0]['href'] == BASE + path, f'{path}: wrong canonical'
            assert len(page.match('meta', name='description')) == 1, f'{path}: description count'
        if path == '/' or path.startswith('/blog/'):
            assert page.json, f'{path}: no structured data'
            assert page.match('meta', property='og:url')[0]['content'] == BASE + path
            assert len(page.match('script', src='/js/analytics.js')) == 1
            assert page.match('a', href='https://apps.apple.com/us/app/olma-scan-compare/id6790042890')
        for tag, attrs in page.tags:
            if tag == 'img':
                assert 'alt' in attrs, f'{path}: image missing alt'
            for key in ('href', 'src'):
                if key not in attrs:
                    continue
                url = urlsplit(urljoin(BASE + path, attrs[key]))
                if url.netloc != 'olmaapp.com' or url.scheme not in ('http', 'https'):
                    continue
                local = ROOT / unquote(url.path).lstrip('/')
                if local.is_dir():
                    local /= 'index.html'
                assert local.is_file(), f'{path}: broken link/asset {attrs[key]}'
                if url.fragment and url.path in pages:
                    assert unquote(url.fragment) in pages[url.path].ids, f'{path}: missing anchor {attrs[key]}'
    sitemap = ET.parse(ROOT / 'sitemap.xml')
    urls = [el.text for el in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    assert len(urls) == len(set(urls)), 'duplicate sitemap URLs'
    assert set(urls) == indexed, 'sitemap does not match indexable pages'
    assert 'Sitemap: ' + BASE + '/sitemap.xml' in (ROOT / 'robots.txt').read_text()
    assert '/get/' not in indexed
    print(f'PASS: {len(pages)} pages; {len(indexed)} sitemap URLs; unique titles, descriptions, canonicals, JSON-LD, local links, assets, anchors, and CTA wiring.')


if __name__ == '__main__':
    check()

// Exercise the real listener without contacting analytics vendors or the store.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const calls = [];
let onClick;
const window = {
  location: { href: 'https://olmaapp.com/blog/save-money-shopping/', pathname: '/blog/save-money-shopping/' },
  gtag: (...args) => calls.push(['ga', ...args]),
  fbq: (...args) => calls.push(['meta', ...args]),
};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../js/analytics.js'), 'utf8'), {
  window, URL,
  document: { addEventListener: (name, fn, options) => {
    assert.equal(name, 'click');
    assert.equal(options.capture, true); // Runs before the in-app browser handoff.
    onClick = fn;
  } },
});
function click(href, dataset = {}, section = null) {
  onClick({ target: { closest: () => ({ href, dataset, closest: () => section }) } });
}
click('https://olmaapp.com/#download');
click('https://example.com/?ref=apps.apple.com');
assert.equal(calls.length, 0, 'Scrolling and unrelated links must not count as downloads');
click('https://apps.apple.com/us/app/olma-scan-compare/id6790042890', { cta: 'article_end' });
assert.equal(calls.length, 2, 'Exactly one event per configured vendor');
assert.equal(calls[0][2], 'download_click');
assert.equal(calls[0][3].page_path, '/blog/save-money-shopping/');
assert.equal(calls[0][3].cta_location, 'article_end');
assert.equal(calls[1][2], 'DownloadClick');
click('https://apps.apple.com/us/app/olma-scan-compare/id6790042890', {}, { id: 'download' });
assert.equal(calls[2][3].cta_location, 'download');
window['ga-disable-G-GTPLYG54S1'] = true;
const gaCount = calls.filter(call => call[0] === 'ga').length;
click('https://apps.apple.com/us/app/olma-scan-compare/id6790042890');
assert.equal(calls.filter(call => call[0] === 'ga').length, gaCount, 'Disabled production Analytics must not record preview clicks');
delete window['ga-disable-G-GTPLYG54S1'];
delete window.gtag;
delete window.fbq;
assert.doesNotThrow(() => click('https://apps.apple.com/us/app/olma-scan-compare/id6790042890'));
assert.doesNotThrow(() => onClick({ target: {} }));
console.log('PASS: real App Store clicks only, one event per vendor, page/CTA attribution, and blocked analytics fallback.');

// Every tagged page must exclude previews before the asynchronous Google tag loads.
const path = require('node:path');
const root = path.join(__dirname, '..');
const pages = ['index.html', 'privacy.html', 'terms.html', 'blog/index.html'];
for (const guide of JSON.parse(fs.readFileSync(path.join(root, 'content/guides.json'), 'utf8'))) pages.push(`blog/${guide.slug}/index.html`);
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const guard = html.match(/<script>\s*(\/\/ Keep local development[\s\S]*?)<\/script>/);
  assert(guard, `${page}: missing preview guard`);
  assert(html.indexOf(guard[0]) < html.indexOf('https://www.googletagmanager.com/gtag/js'), `${page}: guard must run before Google tag`);
  for (const hostname of ['localhost', '127.0.0.1', '[::1]', 'preview.example.com', '', 'olmaapp.com', 'www.olmaapp.com']) {
    const previewWindow = {location:{hostname}};
    vm.runInNewContext(guard[1], {window:previewWindow});
    assert.equal(previewWindow['ga-disable-G-GTPLYG54S1'], !['olmaapp.com', 'www.olmaapp.com'].includes(hostname));
  }
}
console.log('PASS: all tagged pages exclude preview hosts and retain production collection.');

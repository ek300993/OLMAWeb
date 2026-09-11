// Original app previews. The first screen and all feature copy remain visible without JS.
(() => {
  if (!document.body.classList.contains('home')) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const captions = {
    scan: 'Spot something? Start with a photo.',
    compare: 'See the verdict and retailer prices together.',
    collection: 'Your finds, saved for another look.',
  };
  const controls = [...document.querySelectorAll('[data-preview]')];
  const screens = [...document.querySelectorAll('[data-screen]')];
  const caption = document.getElementById('preview-caption');
  const playback = document.getElementById('preview-playback');
  let autoplay = !reduceMotion.matches;
  let timer;
  const showPreview = (button, automatic = false) => {
    const key = button.dataset.preview;
    if (!captions[key]) return;
    controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    screens.forEach(screen => {
      screen.hidden = screen.dataset.screen !== key;
      screen.classList.remove('is-entering');
      if (!screen.hidden && !reduceMotion.matches) screen.classList.add('is-entering');
    });
    // Automatic changes should not interrupt screen reader users every five seconds.
    caption.setAttribute('aria-live', automatic ? 'off' : 'polite');
    caption.textContent = captions[key];
  };
  const schedulePreview = () => {
    clearTimeout(timer);
    if (!autoplay || document.hidden || !controls.length) return;
    timer = setTimeout(() => {
      const current = controls.findIndex(button => button.getAttribute('aria-pressed') === 'true');
      showPreview(controls[(current + 1) % controls.length], true);
      schedulePreview();
    }, 5000);
  };
  const updatePlayback = () => {
    playback.textContent = autoplay ? 'Pause' : 'Play';
    playback.setAttribute('aria-label', autoplay ? 'Pause automatic app previews' : 'Play automatic app previews');
    schedulePreview();
  };
  controls.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      showPreview(button);
      schedulePreview();
    });
  });
  playback.hidden = false;
  playback.addEventListener('click', () => {
    autoplay = !autoplay;
    updatePlayback();
  });
  reduceMotion.addEventListener('change', () => {
    autoplay = !reduceMotion.matches;
    updatePlayback();
  });
  document.addEventListener('visibilitychange', schedulePreview);
  updatePlayback();
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const link = links.find(a => a.hash === '#' + entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(a => a.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'location');
        } else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -60% 0px' });
    links.forEach(link => { const target = document.querySelector(link.hash); if (target) observer.observe(target); });
  }
})();

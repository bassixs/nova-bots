// The video is requested only when the introductory screen is actually shown.
export function runIntro() {
  const root = document.documentElement;
  const overlay = document.querySelector('#brand-intro');
  if (!root.classList.contains('intro-pending')) { overlay.remove(); return Promise.resolve(); }
  clearTimeout(window.novaIntroFallback);
  return new Promise(resolve => {
    const video = overlay.querySelector('video');
    const skip = overlay.querySelector('button');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const previousFocus = document.activeElement;
    const siblings = [...document.body.children].filter(el => el !== overlay && el.tagName !== 'SCRIPT');
    const originalInert = siblings.map(el => el.inert);
    let finished = false, loadingTimer, endTimer;
    siblings.forEach(el => { el.inert = true; });
    skip.focus({preventScroll:true});
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(loadingTimer); clearTimeout(endTimer);
      video.pause();
      document.removeEventListener('keydown', onKey);
      motion.removeEventListener('change', finish);
      try { sessionStorage.setItem('nova-intro-seen', '1'); } catch { /* Storage is optional. */ }
      document.body.classList.add('intro-played');
      overlay.classList.add('is-closing');
      setTimeout(() => {
        root.classList.remove('intro-pending');
        siblings.forEach((el, i) => { el.inert = originalInert[i]; });
        overlay.remove();
        if (previousFocus && previousFocus !== document.body) previousFocus.focus({preventScroll:true});
        resolve();
      }, motion.matches ? 0 : 550);
    }
    function onKey(event) {
      if (event.key === 'Escape') finish();
      if (event.key === 'Tab') { event.preventDefault(); skip.focus({preventScroll:true}); }
    }
    function guardLoading() { clearTimeout(loadingTimer); loadingTimer = setTimeout(finish, 3500); }
    skip.addEventListener('click', finish);
    document.addEventListener('keydown', onKey);
    motion.addEventListener('change', finish);
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);
    video.addEventListener('waiting', guardLoading);
    video.addEventListener('playing', () => { clearTimeout(loadingTimer); overlay.classList.add('is-playing'); });
    video.muted = true;
    video.src = '/assets/nova-intro.mp4?v=2';
    guardLoading();
    endTimer = setTimeout(finish, 15000);
    video.play().catch(finish);
  });
}

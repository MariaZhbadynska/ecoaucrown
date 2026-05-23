(() => {
  const ioReveal = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-reveal]').forEach(el => ioReveal.observe(el));
})();

function animateGauges() {
  document.querySelectorAll('.icard').forEach(card => {
    const target = Math.max(0, Math.min(100, +card.dataset.target || 0)); // 0..100
    const numEl  = card.querySelector('.icard__value .num');
    const prog   = card.querySelector('.igauge .prog');
    const bg     = card.querySelector('.igauge .bg');
    if (!prog || !bg || !numEl) return;

    const total = prog.getTotalLength();

    prog.style.strokeDasharray  = `${total}`;
    prog.style.strokeDashoffset = `${total}`;

    let p = 0;
    const tick = () => {
      p += (target - p) * 0.16;            
      if (p >= target - 0.5) p = target;
      numEl.textContent = Math.round(p);    
      prog.style.strokeDashoffset = total * (1 - p / 100);
      if (p < target) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

(() => {
  const impact = document.querySelector('#impact');
  if (!impact) return;
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateGauges();
      io.disconnect();
    }
  }, { threshold: 0.3 });
  io.observe(impact);
})();

(() => {
  const sec = document.querySelector('.press');
  if (!sec) return;

  const vp    = sec.querySelector('.press__viewport');
  const track = sec.querySelector('.press__track');
  const items = [...track.children];
  const prev  = sec.querySelector('[data-press-prev]');
  const next  = sec.querySelector('[data-press-next]');
  let i = 0;

  const setHeight = () => {
    const h = items[i].getBoundingClientRect().height;
    vp.style.height = h + 'px';
  };
  const go = (to) => {
    i = (to + items.length) % items.length;
    track.style.transform = `translateX(${-i * 100}%)`;
    setHeight();
  
  };
  

  window.addEventListener('load', () => go(0));
  window.addEventListener('resize', setHeight);

  prev && prev.addEventListener('click', () => go(i - 1));
  next && next.addEventListener('click', () => go(i + 1));

  sec.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(i - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
  });

  let x0 = null, t0 = 0, pid = null;
  vp.addEventListener('pointerdown', e => { x0 = e.clientX; t0 = Date.now(); pid = e.pointerId; vp.setPointerCapture(pid); });
  vp.addEventListener('pointerup', e => {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    const dt = Date.now() - t0;
    if (Math.abs(dx) > 40 && dt < 600) go(i + (dx < 0 ? 1 : -1));
    x0 = null; pid = null;
  });
})();



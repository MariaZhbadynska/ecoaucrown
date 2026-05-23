(function(){
    const $ = (s, r=document)=> r.querySelector(s);
    const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
  
    const grid = $('#tips-grid');
    const chips = $('#tips-chips');
    const qForm = $('#tips-search');
    const qInp = $('#tips-q');
  
    const overlay = $('#tips-overlay');
    const modal = $('#tips-modal');
    const closeBtn = $('#tm-close');
    const imgEl = $('#tm-img');
    const titleEl = $('#tm-title');
    const catEl = $('#tm-cat');
    const leadEl = $('#tm-lead');
    const stepsEl = $('#tm-steps');
    const blockEl = $('#tm-block');
    const copyEl = $('#tm-copy');
    const linkEl = $('#tm-link');
  
    let DATA = [];
    let VIEW = [];
  
    document.addEventListener('DOMContentLoaded', async () => {
      try { DATA = await fetch('./public/data/tips.json',{cache:'no-cache'}).then(r=>r.json()); } catch(e){ DATA = []; }
      VIEW = [...DATA];
      renderCards(VIEW);
    });
  
    function renderCards(list){
      if (!grid) return;
      grid.innerHTML = list.map(item => `
        <article class="tcard" data-cat="${esc(item.cat)}" data-title="${esc((item.title||'').toLowerCase())}">
          <div class="tcard__img"><img src="${esc(item.img)}" alt="${esc(item.title)}"></div>
          <div class="tcard__body">
            <div class="tcard__eyebrow">${prettyCat(item.cat)}</div>
            <h3 class="tcard__title">${esc(item.title)}</h3>
            <p class="tcard__txt">${esc(item.lead)}</p>
            <div class="tcard__meta"><span>${esc(item.read||'')}</span><button class="btn" data-open="${esc(item.id)}" type="button">Open</button></div>
          </div>
        </article>
      `).join('');
    }
  
    function prettyCat(c){
      if (c==='bulk') return 'Bulk foods';
      if (c==='home') return 'Home goods';
      return 'Skincare';
    }
  
    chips?.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', chips).forEach(x=>x.classList.remove('is-active'));
      b.classList.add('is-active');
      applyFilter();
    });
  
    qForm?.addEventListener('submit', e => {
      e.preventDefault();
      applyFilter();
    });
  
    function applyFilter(){
      const cat = $('.chip.is-active', chips)?.dataset.cat || 'all';
      const q = (qInp?.value||'').trim().toLowerCase();
      const list = DATA.filter(x => (cat==='all'||x.cat===cat) && (!q || (x.title||'').toLowerCase().includes(q)));
      VIEW = list;
      renderCards(list);
    }
  
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-open]');
      if (btn){
        const id = btn.getAttribute('data-open');
        const item = DATA.find(x=>x.id===id);
        if (item) openModal(item);
      }
      if (e.target === overlay) closeModal();
    });
  
    closeBtn?.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });
  
    copyEl?.addEventListener('click', () => {
      const ck = modal?.dataset.key;
      const item = DATA.find(x=>x.id===ck);
      if (!item) return;
      navigator.clipboard?.writeText(item.checklist||'');
      const t = copyEl.textContent;
      copyEl.textContent = 'Copied!';
      setTimeout(()=>copyEl.textContent=t, 900);
    });
  
    function openModal(item){
      modal.dataset.key = item.id;
      titleEl.textContent = item.title||'Tip';
      catEl.textContent = prettyCat(item.cat);
      leadEl.textContent = item.lead||'';
      imgEl.src = item.img||'';
      imgEl.alt = item.title||'';
      stepsEl.innerHTML = (item.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('');
      if (item.checklist){ blockEl.hidden=false; blockEl.textContent=item.checklist; } else { blockEl.hidden=true; blockEl.textContent=''; }
      linkEl.href = item.link||'#';
      overlay.hidden=false; modal.hidden=false;
      requestAnimationFrame(()=>{ overlay.classList.add('show'); modal.classList.add('open'); });
      $('.tm-body')?.scrollTo(0,0);
    }
  
    function closeModal(){
      overlay.classList.remove('show'); modal.classList.remove('open');
      setTimeout(()=>{ overlay.hidden=true; modal.hidden=true; }, 220);
    }
  
    function esc(s){ return String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }
  })();
  
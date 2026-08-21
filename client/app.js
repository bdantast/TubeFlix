// client/app.js
const API_BASE = window.location.origin;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const row = document.getElementById('row-populares');
const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');
const heroWatchBtn = document.getElementById('watch-btn');
const heroYoutubeBtn = document.getElementById('hero-youtube');
const searchInput = document.getElementById('search');
const modal = document.getElementById('player-modal');
const playerContainer = document.getElementById('player-container');
const closeModalBtn = document.getElementById('close-modal');

let ALL_ITEMS = [];
let currentQuery = '';

function thumbFor(it) {
  return it.thumb || `https://img.youtube.com/vi/${it.id}/hqdefault.jpg`;
}

function openModal(id) {
  if (!playerContainer || !modal) return;
  const openYoutubeBtn = document.getElementById('open-youtube');
  if (openYoutubeBtn) openYoutubeBtn.onclick = () => window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
  playerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen title="Player"></iframe>`;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modal || !playerContainer) return;
  modal.classList.add('hidden');
  playerContainer.innerHTML = '';
  document.body.style.overflow = '';
}

closeModalBtn && closeModalBtn.addEventListener('click', closeModal);
modal && modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function skeletonCard() {
  return `
    <div class="card skeleton">
      <div class="sk-thumb"></div>
      <div class="sk-line w80"></div>
      <div class="sk-line w60"></div>
    </div>`;
}

function renderSkeleton() {
  if (!row) return;
  row.innerHTML = `
    <div class="category-section">
      <div class="section-head"><div class="sk-heading"></div></div>
      <div class="row">${skeletonCard().repeat(6)}</div>
    </div>`;
}

function cardHTML(it) {
  return `
    <article class="card" data-open="${esc(it.id)}">
      <div class="thumb-wrap">
        <img class="card-thumb" src="${esc(thumbFor(it))}" alt="${esc(it.title || '')}" loading="lazy">
        <span class="play-badge">
          <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="rgba(229,9,20,.95)"/><path d="M9.5 7.5v9l8-4.5z"/></svg>
        </span>
      </div>
      <div class="card-body">
        <h4 class="card-title">${esc(it.title || '')}</h4>
        <p class="card-author">${esc(it.author_name || '')}</p>
        <p class="card-description">${esc(it.description || '')}</p>
        <button class="watch" data-open="${esc(it.id)}">Assistir</button>
      </div>
    </article>`;
}

function sectionHTML(cat, videos) {
  return `
    <div class="category-section">
      <div class="section-head">
        <h3>${esc(cat)}</h3>
        <span class="section-count">${videos.length} ${videos.length === 1 ? 'vídeo' : 'vídeos'}</span>
      </div>
      <button class="row-nav prev" aria-label="Voltar">‹</button>
      <button class="row-nav next" aria-label="Avançar">›</button>
      <div class="row">${videos.map(cardHTML).join('')}</div>
    </div>`;
}

function renderCatalog(items, query) {
  if (!row) return;

  if (query && !items.length) {
    row.innerHTML = `<div class="empty-state">Nenhum resultado para <strong>"${esc(query)}"</strong>.</div>`;
    return;
  }
  if (!ALL_ITEMS.length) {
    row.innerHTML = `<div class="empty-state">Catálogo vazio. Adicione vídeos pela <a href="./admin.html">página de admin</a>.</div>`;
    return;
  }

  const categories = {};
  items.forEach(it => {
    const cat = it.category || 'Diversos';
    (categories[cat] = categories[cat] || []).push(it);
  });
  const sortedCats = Object.keys(categories).sort((a, b) => {
    if (a === 'Diversos') return 1;
    if (b === 'Diversos') return -1;
    return a.localeCompare(b, 'pt-BR');
  });

  row.innerHTML = sortedCats.map(cat => sectionHTML(cat, categories[cat])).join('');
}

row && row.addEventListener('click', e => {
  const nav = e.target.closest('.row-nav');
  if (nav) {
    const scroller = nav.closest('.category-section').querySelector('.row');
    const dir = nav.classList.contains('prev') ? -1 : 1;
    scroller.scrollBy({ left: dir * scroller.clientWidth * 0.85, behavior: 'smooth' });
    return;
  }
  const openEl = e.target.closest('[data-open]');
  if (openEl) openModal(openEl.dataset.open);
});

searchInput && searchInput.addEventListener('input', () => {
  currentQuery = searchInput.value.trim().toLowerCase();
  applyFilter();
});

function applyFilter() {
  if (!currentQuery) return renderCatalog(ALL_ITEMS);
  const filtered = ALL_ITEMS.filter(it =>
    [it.title, it.author_name, it.category, it.description]
      .some(v => String(v || '').toLowerCase().includes(currentQuery))
  );
  renderCatalog(filtered, currentQuery);
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API_BASE}/api/catalog`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    ALL_ITEMS = data.items || [];
    renderCatalog(ALL_ITEMS);

    if (ALL_ITEMS.length) {
      const first = ALL_ITEMS[0];
      const hero = document.getElementById('hero');
      if (hero) hero.style.backgroundImage = `url('${thumbFor(first)}')`;
      if (heroTitle) heroTitle.textContent = first.title || '';
      if (heroDesc) heroDesc.textContent = first.description || first.author_name || '';
      if (heroWatchBtn) heroWatchBtn.onclick = () => openModal(first.id);
      if (heroYoutubeBtn) heroYoutubeBtn.onclick = () => window.open(`https://www.youtube.com/watch?v=${first.id}`, '_blank');
    }
  } catch (err) {
    console.error('Erro ao carregar catálogo', err);
    if (row) row.innerHTML = '<p class="empty-state">Erro ao carregar o catálogo. Tente recarregar a página.</p>';
  }
}

renderSkeleton();
window.addEventListener('load', () => loadCatalog());
window.__app = { loadCatalog, openModal, closeModal };

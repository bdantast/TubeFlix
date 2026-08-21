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
const PREVIEW_START = 750; // prévias começam em 12min30 do vídeo

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

// --- hero rotativo com vários destaques ---
let heroTimer = null;
let heroPreviewTimer = null;
let heroIndex = 0;
let heroSlides = [];

function clearHeroPreview() {
  clearTimeout(heroPreviewTimer);
  document.querySelectorAll('#hero-slides .hero-video').forEach(v => {
    v.innerHTML = '';
    v.classList.remove('playing');
  });
}

function showHeroSlide(i) {
  heroIndex = i;
  if (modal && !modal.classList.contains('hidden')) return;
  const it = heroSlides[i];
  if (!it) return;
  const bgs = document.querySelectorAll('#hero-slides .hero-bg');
  bgs.forEach((b, j) => b.classList.toggle('active', j === i));
  document.querySelectorAll('#hero-dots .hero-dot').forEach((d, j) => d.classList.toggle('active', j === i));
  if (heroTitle) heroTitle.textContent = it.title || '';
  if (heroDesc) heroDesc.textContent = [it.description, it.author_name].filter(Boolean).join(' · ');
  if (heroWatchBtn) heroWatchBtn.onclick = () => openModal(it.id);
  if (heroYoutubeBtn) heroYoutubeBtn.onclick = () => window.open(`https://www.youtube.com/watch?v=${it.id}`, '_blank');

  clearHeroPreview();
  heroPreviewTimer = setTimeout(() => {
    const holder = bgs[i] && bgs[i].querySelector('.hero-video');
    if (!holder || i !== heroIndex) return;
    holder.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(it.id)}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${encodeURIComponent(it.id)}&playsinline=1&start=${PREVIEW_START}" allow="autoplay; encrypted-media" frameborder="0" tabindex="-1" title="Prévia"></iframe>`;
    const frame = holder.querySelector('iframe');
    frame.addEventListener('load', () => { if (i === heroIndex) holder.classList.add('playing'); });
  }, 1000);
}

function startHeroRotation() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    if (modal && !modal.classList.contains('hidden')) return;
    showHeroSlide((heroIndex + 1) % heroSlides.length);
  }, 8000);
}

function setupHero(items) {
  const slidesEl = document.getElementById('hero-slides');
  const dotsEl = document.getElementById('hero-dots');
  clearInterval(heroTimer);
  if (!slidesEl || !dotsEl || !items.length) return;
  heroSlides = items.slice(0, Math.min(6, items.length));
  slidesEl.innerHTML = heroSlides.map((it, i) =>
    `<div class="hero-bg${i === 0 ? ' active' : ''}" style="background-image:url('${esc(thumbFor(it))}')"><div class="hero-video" aria-hidden="true"></div></div>`
  ).join('');
  dotsEl.innerHTML = heroSlides.map((_, i) =>
    `<button class="hero-dot${i === 0 ? ' active' : ''}" aria-label="Destaque ${i + 1}"></button>`
  ).join('');
  heroIndex = 0;
  showHeroSlide(0);
  startHeroRotation();
  dotsEl.onclick = e => {
    const dot = e.target.closest('.hero-dot');
    if (!dot) return;
    showHeroSlide([...dotsEl.children].indexOf(dot));
    startHeroRotation();
  };
}

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
        <div class="video-preview" aria-hidden="true"></div>
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
      <div class="card-hover-overlay">
        <h4 class="hp-title">${esc(it.title || '')}</h4>
        <p class="hp-author">${esc(it.author_name || '')}</p>
        <p class="hp-desc">${esc(it.description || 'Sem descrição.')}</p>
        <span class="hp-cat">${esc(it.category || 'Diversos')}</span>
        <div class="hp-actions">
          <button class="watch hp-watch" data-open="${esc(it.id)}">Assistir</button>
          <a class="hp-yt" href="https://www.youtube.com/watch?v=${encodeURIComponent(it.id)}" target="_blank" rel="noopener">YouTube ↗</a>
        </div>
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
  wireHoverPreviews();
}

// --- preview de vídeo ao passar o mouse ---
function wireHoverPreviews() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  row.querySelectorAll('.card').forEach(card => {
    const holder = card.querySelector('.video-preview');
    if (!holder) return;
    let timer;
    card.addEventListener('mouseenter', () => {
      timer = setTimeout(() => {
        const id = card.dataset.open;
        holder.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${encodeURIComponent(id)}&playsinline=1&start=${PREVIEW_START}" allow="autoplay; encrypted-media" frameborder="0" tabindex="-1" title="Prévia"></iframe>`;
      }, 800);
    });
    card.addEventListener('mouseleave', () => {
      clearTimeout(timer);
      holder.innerHTML = '';
    });
  });
}

row && row.addEventListener('click', e => {
  const nav = e.target.closest('.row-nav');
  if (nav) {
    const scroller = nav.closest('.category-section').querySelector('.row');
    const dir = nav.classList.contains('prev') ? -1 : 1;
    scroller.scrollBy({ left: dir * scroller.clientWidth * 0.85, behavior: 'smooth' });
    return;
  }
  if (e.target.closest('a')) return;
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
    setupHero(ALL_ITEMS);
  } catch (err) {
    console.error('Erro ao carregar catálogo', err);
    if (row) row.innerHTML = '<p class="empty-state">Erro ao carregar o catálogo. Tente recarregar a página.</p>';
  }
}

renderSkeleton();
window.addEventListener('load', () => loadCatalog());
window.__app = { loadCatalog, openModal, closeModal };

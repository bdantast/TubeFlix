// client/app.js - recuperação definitiva (thumbnails + player)
const API_BASE = 'http://localhost:4000';
const row = document.getElementById('row-populares');
const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');
const heroWatchBtn = document.getElementById('watch-btn');
const modal = document.getElementById('player-modal');
const playerContainer = document.getElementById('player-container');
const closeModalBtn = document.getElementById('close-modal');

function openModal(id){
  if (!playerContainer || !modal) return;
  const openYoutubeBtn = document.getElementById('open-youtube');
  if (openYoutubeBtn) openYoutubeBtn.onclick = () => window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
  playerContainer.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  modal.classList.remove('hidden');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  if (!modal || !playerContainer) return;
  modal.classList.remove('open');
  modal.classList.add('hidden');
  playerContainer.innerHTML = '';
  document.body.style.overflow = '';
}
closeModalBtn && closeModalBtn.addEventListener('click', closeModal);
modal && modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

async function loadCatalog(){
  try {
    const res = await fetch(`${API_BASE}/api/catalog`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const items = data.items || [];
    if (!row) return console.error('row-populares não encontrado');
    row.innerHTML = items.map(it => `
      <div class="card">
        <img src="${it.thumb || 'https://img.youtube.com/vi/' + it.id + '/hqdefault.jpg'}" alt="${it.title || ''}" class="card-thumb">
        <h3 class="card-title">${it.title || ''}</h3>
        <p class="card-author">${it.author_name || ''}</p>
        <button class="watch" data-id="${it.id}">Assistir</button>
      </div>
    `).join('');
    document.querySelectorAll('.watch').forEach(b => b.addEventListener('click', e => openModal(e.currentTarget.dataset.id)));
    // hero
    if (items.length) {
      const hero = document.getElementById('hero');
      if (hero && items[0].thumb) {
        hero.style.backgroundImage = `url('${items[0].thumb}')`;
      }
      if (heroTitle) heroTitle.textContent = items[0].title || '';
      if (heroDesc) heroDesc.textContent = items[0].author_name || '';
      if (heroWatchBtn) heroWatchBtn.onclick = () => openModal(items[0].id);
    }
  } catch (err) {
    console.error('Erro ao carregar catálogo', err);
    if (row) row.innerHTML = '<p>Erro ao carregar catálogo. Veja o console.</p>';
  }
}

window.addEventListener('load', () => loadCatalog());
window.__app = { loadCatalog, openModal, closeModal };
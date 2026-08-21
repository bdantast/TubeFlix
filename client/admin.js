// client/admin.js
const API_BASE = window.location.origin;
const TOKEN_KEY = 'tf_admin_token';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const newIdInput = document.getElementById('new-id');
const newThumbInput = document.getElementById('new-thumb');
const newCategoryInput = document.getElementById('new-category');
const newDescriptionInput = document.getElementById('new-description');
const tokenInput = document.getElementById('admin-token');
const addBtn = document.getElementById('add-btn');
const refreshBtn = document.getElementById('refresh-btn');
const idsList = document.getElementById('ids-list');

tokenInput.value = localStorage.getItem(TOKEN_KEY) || '';
tokenInput.addEventListener('input', () => localStorage.setItem(TOKEN_KEY, tokenInput.value.trim()));

function authHeaders() {
  const token = tokenInput.value.trim();
  return token ? { 'x-admin-token': token } : {};
}

async function fetchIds() {
  try {
    const res = await fetch(`${API_BASE}/api/ids`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Erro fetch ids', err);
    return [];
  }
}

function renderIds(items) {
  if (!items.length) {
    idsList.innerHTML = '<div class="empty-state">Nenhum vídeo no catálogo ainda.</div>';
    return;
  }
  idsList.innerHTML = items.map(item => {
    const thumb = item.thumb || `https://img.youtube.com/vi/${encodeURIComponent(item.id)}/hqdefault.jpg`;
    return `
      <div class="item">
        <img class="item-thumb" src="${esc(thumb)}" alt="" loading="lazy">
        <div class="item-info">
          <strong>${esc(item.id)}</strong>
          <small>Categoria: ${esc(item.category || 'Diversos')}</small>
          <small>Descrição: ${esc((item.description || '').substring(0, 70))}</small>
          ${item.thumb ? `<small>Thumb personalizada: ${esc(item.thumb)}</small>` : ''}
        </div>
        <button data-id="${esc(item.id)}" class="remove">Remover</button>
      </div>`;
  }).join('');
}

idsList.addEventListener('click', async e => {
  const btn = e.target.closest('.remove');
  if (!btn) return;
  await removeId(btn.dataset.id);
});

async function loadAndRender() {
  renderIds(await fetchIds());
}

async function addId(id, thumb, category, description) {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id, thumb, category, description })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    await loadAndRender();
    alert('ID adicionado com sucesso');
  } catch (err) {
    console.error('Erro ao adicionar', err);
    alert(err.message === '401' ? 'Token de administrador inválido ou ausente.' : `Erro ao adicionar: ${err.message}`);
  }
}

async function removeId(id) {
  if (!confirm('Remover ' + id + '?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/catalog/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    await loadAndRender();
    alert('ID removido');
  } catch (err) {
    console.error('Erro ao remover', err);
    alert(`Erro ao remover: ${err.message}`);
  }
}

addBtn.addEventListener('click', () => {
  const id = (newIdInput.value || '').trim();
  const thumb = (newThumbInput.value || '').trim();
  const category = (newCategoryInput.value || '').trim();
  const description = (newDescriptionInput.value || '').trim();
  if (!id) return alert('Digite um ID');
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return alert('ID inválido: deve ter exatamente 11 caracteres (letras, números, - ou _)');
  addId(id, thumb, category || 'Diversos', description);
  newIdInput.value = '';
  newThumbInput.value = '';
  newCategoryInput.value = '';
  newDescriptionInput.value = '';
});

refreshBtn.addEventListener('click', loadAndRender);

window.addEventListener('load', loadAndRender);

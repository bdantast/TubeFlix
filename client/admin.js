// client/admin.js
const API_BASE = 'http://localhost:4000';
const newIdInput = document.getElementById('new-id');
const newThumbInput = document.getElementById('new-thumb');
const addBtn = document.getElementById('add-btn');
const refreshBtn = document.getElementById('refresh-btn');
const idsList = document.getElementById('ids-list');

async function fetchIds(){
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

function renderIds(items){
  idsList.innerHTML = items.map(item => {
    const id = item.id || item;
    const thumb = item.thumb || '';
    return `
      <div class="item">
        <div style="flex: 1;">
          <strong>ID: ${id}</strong><br>
          <small>Thumb: ${thumb ? thumb.substring(0, 50) + '...' : '(padrão YouTube)'}</small>
        </div>
        <button data-id="${id}" class="remove">Remover</button>
      </div>
    `;
  }).join('');
  document.querySelectorAll('.remove').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.dataset.id;
    removeId(id);
  }));
}

async function loadAndRender(){
  const items = await fetchIds();
  renderIds(items);
}

async function addId(id, thumb){
  try {
    const res = await fetch(`${API_BASE}/api/catalog/add`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id, thumb })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    await loadAndRender();
    alert('ID adicionado');
  } catch (err) {
    console.error('Erro ao adicionar', err);
    alert('Erro ao adicionar. Veja console.');
  }
}

async function removeId(id){
  if (!confirm('Remover ' + id + ' ?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/catalog/remove`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    await loadAndRender();
    alert('ID removido');
  } catch (err) {
    console.error('Erro ao remover', err);
    alert('Erro ao remover. Veja console.');
  }
}

addBtn.addEventListener('click', () => {
  const id = (newIdInput.value || '').trim();
  const thumb = (newThumbInput.value || '').trim();
  if (!id) return alert('Digite um ID');
  addId(id, thumb);
  newIdInput.value = '';
  newThumbInput.value = '';
});

refreshBtn.addEventListener('click', loadAndRender);

window.addEventListener('load', loadAndRender);
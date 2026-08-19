// server/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const CATALOG_FILE = path.join(__dirname, 'catalog.json');
const DEFAULT_CATALOG = [
  { id: "DGZsRoKYXPI", thumb: "" },
  { id: "2MRcOdjY-QE", thumb: "" },
  { id: "vcPr9USr2tA", thumb: "" },
  { id: "2Vv-BfVoq4g", thumb: "" },
  { id: "kXYiU_JCYtU", thumb: "" },
  { id: "3JZ_D3ELwOQ", thumb: "" }
];

// --- utilitário de persistência simples ---
function readCatalogFile() {
  try {
    // Tenta ler do arquivo (funciona localmente)
    if (fs.existsSync(CATALOG_FILE)) {
      const raw = fs.readFileSync(CATALOG_FILE, 'utf8');
      const data = JSON.parse(raw);
      // Converter strings antigas para novo formato (compatibilidade)
      return Array.isArray(data) ? data.map(item => 
        typeof item === 'string' ? { id: item, thumb: '' } : item
      ) : data;
    }
  } catch (e) {
    console.log('Arquivo catalog.json não encontrado, usando padrão');
  }
  
  // Fallback para padrão (funciona no Vercel)
  return DEFAULT_CATALOG;
}

function writeCatalogFile(ids) {
  try {
    // Tenta salvar no arquivo (funciona localmente)
    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(ids, null, 2), 'utf8');
    }
  } catch (e) {
    console.log('Não foi possível salvar o arquivo (esperado no Vercel)');
  }
}

// --- catálogo em memória com persistência em arquivo ---
let CATALOG_ITEMS = readCatalogFile();

// --- cache simples para reduzir chamadas ao oEmbed ---
let cache = { ts: 0, items: [] };
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

// --- função que consulta oEmbed do YouTube ---
async function fetchOEmbed(item) {
  const id = item.id || item;
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    const res = await axios.get(url, { timeout: 5000 });
    return {
      id,
      title: res.data.title,
      author_name: res.data.author_name,
      thumb: item.thumb || res.data.thumbnail_url,
      html: res.data.html
    };
  } catch (err) {
    return { id, title: `Vídeo ${id}`, author_name: '', thumb: item.thumb || `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
  }
}

// --- endpoints públicos ---
app.get('/api/catalog', async (req, res) => {
  try {
    const now = Date.now();
    if (now - cache.ts < CACHE_TTL && cache.items.length) {
      return res.json({ items: cache.items, cached: true });
    }
    const promises = CATALOG_ITEMS.map(item => fetchOEmbed(item));
    const items = await Promise.all(promises);
    cache = { ts: now, items };
    res.json({ items, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao montar catálogo' });
  }
});

app.get('/api/ids', (req, res) => res.json({ items: CATALOG_ITEMS }));

app.post('/api/catalog/add', (req, res) => {
  const { id, thumb } = req.body;
  if (!id) return res.status(400).json({ error: 'id é obrigatório' });
  if (!CATALOG_ITEMS.find(i => (i.id || i) === id)) {
    CATALOG_ITEMS.push({ id, thumb: thumb || '' });
    writeCatalogFile(CATALOG_ITEMS);
    cache.ts = 0; // invalidar cache
  }
  res.json({ ok: true, items: CATALOG_ITEMS });
});

app.post('/api/catalog/remove', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id é obrigatório' });
  CATALOG_ITEMS = CATALOG_ITEMS.filter(x => (x.id || x) !== id);
  writeCatalogFile(CATALOG_ITEMS);
  cache.ts = 0;
  res.json({ ok: true, items: CATALOG_ITEMS });
});

// --- servir client estático e SPA fallback ---
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Garantir que qualquer rota desconhecida retorne index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// --- iniciar servidor ---
app.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`);
});
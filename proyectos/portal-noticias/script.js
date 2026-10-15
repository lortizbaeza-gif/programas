'use strict';

// La API Key vive en memoria: recargar la pestaña la elimina.
let apiKey = '';
let pendingQuery = '';
let searching = false;
let lastRequest = 0;
let favorites = [];
let showingFavorites = false;
let currentArticles = [];
let currentTitle = 'Descubre las noticias';
try {
  const saved = JSON.parse(localStorage.getItem('brujula-favoritas') || '[]');
  if (Array.isArray(saved)) favorites = saved.filter(a => a && typeof a === 'object' && safeURL(a.url));
} catch {}
const $ = (id) => document.getElementById(id);
const form = $('search-form');
const grid = $('news-grid');
const status = $('status');
const dialog = $('api-dialog');

function showStatus(title, message, type = 'empty', configure = false) {
  status.replaceChildren();
  status.className = `status ${type}`;
  const icon = document.createElement('span');
  icon.className = type === 'loading' ? 'loader' : 'empty-icon';
  icon.textContent = type === 'loading' ? '' : type === 'error' ? '!' : '↗';
  icon.setAttribute('aria-hidden', 'true');
  const heading = document.createElement('h3');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = message;
  status.append(icon, heading, text);
  if (configure) {
    const button = document.createElement('button');
    button.className = 'primary-button';
    button.textContent = 'Conectar mi API Key ↗';
    button.addEventListener('click', () => dialog.showModal());
    status.append(button);
  }
}

// Aceptamos solo URLs web. Los textos externos se insertan con textContent.
function safeURL(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function imageFallback(container) {
  container.replaceChildren();
  const fallback = document.createElement('div');
  fallback.className = 'image-fallback';
  const mark = document.createElement('span');
  mark.textContent = '↗';
  mark.setAttribute('aria-hidden', 'true');
  fallback.append(mark, document.createTextNode('El medio no ofrece una imagen disponible'));
  container.append(fallback);
}

function renderArticle(article, index) {
  const card = document.createElement('article');
  card.className = 'news-card';
  const imageWrap = document.createElement('div');
  imageWrap.className = 'image-wrap';
  const imageURL = safeURL(article.image);
  if (imageURL) {
    const img = document.createElement('img');
    img.className = 'news-image';
    img.alt = `Imagen del medio para: ${article.title || 'esta noticia'}`;
    img.loading = index === 0 ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => imageFallback(imageWrap), { once: true });
    img.src = imageURL;
    imageWrap.append(img);
  } else { imageFallback(imageWrap); }
  const body = document.createElement('div');
  body.className = 'card-body';
  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const source = document.createElement('span');
  source.className = 'source';
  source.textContent = article.source?.name || 'Fuente no indicada';
  const time = document.createElement('time');
  const date = new Date(article.publishedAt);
  if (article.publishedAt && !Number.isNaN(date.getTime())) {
    time.dateTime = date.toISOString();
    time.textContent = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  } else { time.textContent = 'Fecha no disponible'; }
  meta.append(source, time);
  const title = document.createElement('h3');
  title.textContent = article.title || 'Noticia sin título';
  const description = document.createElement('p');
  description.textContent = article.description || 'Consulta el artículo original para conocer todos los detalles.';
  body.append(meta, title, description);
  const originalURL = safeURL(article.url);
  if (originalURL) {
    const save = document.createElement('button');
    save.className = 'favorite-button';
    const update = () => {
      const selected = favorites.some(item => item.url === originalURL);
      save.textContent = selected ? '♥ Guardada en favoritas' : '♡ Guardar noticia';
      save.setAttribute('aria-pressed', String(selected));
      save.setAttribute('aria-label', `${selected ? 'Quitar de' : 'Guardar en'} favoritas: ${article.title || 'noticia'}`);
    };
    update();
    save.addEventListener('click', () => {
      const selected = favorites.some(item => item.url === originalURL);
      const next = selected ? favorites.filter(item => item.url !== originalURL) : [...favorites, { ...article, url: originalURL }];
      try { localStorage.setItem('brujula-favoritas', JSON.stringify(next)); }
      catch { alert('No se pudo guardar el cambio. Revisa los permisos o el espacio del navegador.'); return; }
      favorites = next;
      update();
      updateFavoritesCount();
      if (showingFavorites) displayFavorites();
    });
    body.append(save);
  }
  if (originalURL) {
    const link = document.createElement('a');
    link.className = 'read-link';
    link.href = originalURL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Leer noticia: ${article.title || 'artículo original'} (abre otra pestaña)`);
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    link.append(document.createTextNode('Leer noticia'), arrow);
    body.append(link);
  }
  card.append(imageWrap, body);
  return card;
}

function responseError(code) {
  const messages = {
    400: 'Revisa el tema y la API Key. GNews no pudo interpretar la petición.',
    401: 'La API Key no es válida. Comprueba la clave de tu cuenta en Configurar API.',
    403: 'Se alcanzó la cuota diaria de GNews. Consulta tu cuenta o inténtalo después del reinicio a las 00:00 UTC.',
    429: 'Se enviaron demasiadas consultas. Espera unos segundos antes de volver a buscar.',
    500: 'GNews tuvo un problema interno. Vuelve a intentarlo más tarde.',
    503: 'GNews está temporalmente fuera de servicio. Vuelve a intentarlo más tarde.'
  };
  return messages[code] || `No se pudieron obtener las noticias (HTTP ${code}).`;
}

// async permite usar await. try/catch captura errores HTTP, de red y de JSON.
async function buscarNoticias() {
  const tema = $('busqueda').value.trim();
  if (searching) return;
  if (!tema) {
    showStatus('Escribe un tema', 'Busca una palabra o una frase para descubrir noticias.');
    $('busqueda').focus();
    return;
  }
  if (!apiKey) { pendingQuery = tema; dialog.showModal(); return; }
  if (Date.now() - lastRequest < 1100) {
    showStatus('Un momento, por favor', 'Espera un segundo entre consultas para respetar el límite de GNews.');
    return;
  }
  searching = true;
  showingFavorites = false;
  currentArticles = [];
  updateFavoritesCount();
  lastRequest = Date.now();
  $('search-button').disabled = true;
  grid.setAttribute('aria-busy', 'true');
  grid.replaceChildren();
  $('results-title').textContent = `Noticias sobre “${tema}”`;
  currentTitle = $('results-title').textContent;
  $('result-count').textContent = 'Consultando GNews';
  showStatus('Buscando nuevas perspectivas…', 'Estamos consultando noticias en español.', 'loading');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const url = new URL('https://gnews.io/api/v4/search');
    // URLSearchParams codifica espacios, acentos y caracteres especiales.
    url.search = new URLSearchParams({ q: tema, lang: 'es', max: '10', apikey: apiKey }).toString();
    const respuesta = await fetch(url, { signal: controller.signal });
    if (!respuesta.ok) throw new Error(responseError(respuesta.status));
    const datos = await respuesta.json();
    if (!Array.isArray(datos.articles)) throw new Error('GNews devolvió un formato de respuesta inesperado.');
    const articles = datos.articles.filter((article) => article && typeof article === 'object').slice(0, 10);
    currentArticles = articles;
    $('result-count').textContent = `${articles.length} ${articles.length === 1 ? 'noticia encontrada' : 'noticias encontradas'}`;
    if (!articles.length) {
      showStatus('No encontramos noticias', 'Prueba un tema más general o una palabra diferente.');
    } else {
      status.replaceChildren();
      grid.replaceChildren(...articles.map(renderArticle));
    }
  } catch (error) {
    $('result-count').textContent = 'Consulta sin completar';
    let message = error.message;
    if (error.name === 'AbortError') message = 'La consulta tardó demasiado. Revisa tu conexión e inténtalo otra vez.';
    else if (error instanceof TypeError) message = 'No se pudo conectar con GNews. Revisa internet y abre este proyecto desde http://localhost; el plan gratuito restringe otros orígenes.';
    showStatus('No pudimos cargar las noticias', message, 'error');
  } finally {
    clearTimeout(timeout);
    searching = false;
    updateFavoritesCount();
    $('search-button').disabled = false;
    grid.setAttribute('aria-busy', 'false');
  }
}

form.addEventListener('submit', (event) => { event.preventDefault(); buscarNoticias(); });
$('settings').addEventListener('click', () => dialog.showModal());
$('close-dialog').addEventListener('click', () => { pendingQuery = ''; dialog.close(); });
dialog.addEventListener('cancel', () => { pendingQuery = ''; });
$('api-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const key = $('api-key').value.trim();
  if (!key) { $('api-message').textContent = 'Escribe una API Key para continuar.'; return; }
  apiKey = key;
  $('api-key').value = '';
  $('api-message').textContent = '';
  $('settings').firstChild.textContent = 'API configurada ';
  dialog.close();
  if (pendingQuery) { $('busqueda').value = pendingQuery; pendingQuery = ''; buscarNoticias(); }
  else showStatus('Todo listo para explorar', 'Escribe un tema y pulsa Buscar noticias para consultar GNews.');
});
document.querySelectorAll('[data-query]').forEach((button) => button.addEventListener('click', () => {
  $('busqueda').value = button.dataset.query;
  buscarNoticias();
}));
function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('theme').setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  $('theme').setAttribute('aria-pressed', String(dark));
}
setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
$('theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'dark'));
$('footer-year').textContent = new Date().getFullYear();
showStatus('Tu próxima lectura empieza aquí', 'Conecta la API Key de tu equipo y busca un tema. Aquí aparecerán noticias reales con sus imágenes, fuentes y fechas.', 'empty', true);

const favoritesNav = document.createElement('nav');
favoritesNav.className = 'favorites-nav';
favoritesNav.setAttribute('aria-label', 'Vista de noticias');
const resultsButton = document.createElement('button');
resultsButton.textContent = 'Resultados';
const favoritesButton = document.createElement('button');
favoritesNav.append(resultsButton, favoritesButton);
grid.parentNode.insertBefore(favoritesNav, status);
function updateFavoritesCount() {
  favoritesButton.textContent = `♥ Mis favoritas (${favorites.length})`;
  favoritesButton.setAttribute('aria-pressed', String(showingFavorites));
  resultsButton.setAttribute('aria-pressed', String(!showingFavorites));
  favoritesButton.disabled = searching;
  resultsButton.disabled = searching;
}
function displayFavorites() {
  showingFavorites = true;
  $('results-title').textContent = 'Tus noticias favoritas';
  $('result-count').textContent = `${favorites.length} guardadas en este navegador`;
  status.replaceChildren();
  grid.replaceChildren(...favorites.map(renderArticle));
  if (!favorites.length) showStatus('Tu colección empieza aquí', 'Busca noticias y pulsa Guardar noticia. Podrás volver a leerlas desde esta sección.');
  updateFavoritesCount();
}
favoritesButton.addEventListener('click', displayFavorites);
resultsButton.addEventListener('click', () => {
  showingFavorites = false;
  $('results-title').textContent = currentTitle;
  $('result-count').textContent = `${currentArticles.length} noticias encontradas`;
  status.replaceChildren();
  grid.replaceChildren(...currentArticles.map(renderArticle));
  if (!currentArticles.length) showStatus('Descubre nuevas noticias', 'Escribe un tema y busca noticias para empezar.');
  updateFavoritesCount();
});
updateFavoritesCount();

/* ══════════════════════════════════════════════════════
   SportsKeen — Frontend App
   ══════════════════════════════════════════════════════ */

const API = '/api';
const SPORTS = ['Football','Cricket','F1','Tennis','Basketball','Rugby','Golf','Athletics'];
const EMOJI = {
  Football: '⚽', Cricket: '🏏', F1: '🏎️',
  Tennis: '🎾', Basketball: '🏀', Rugby: '🏉',
  Golf: '⛳', Athletics: '🏃'
};
const GRAD = {
  Football: ['#064E3B','#16A34A'],
  Cricket: ['#78350F','#D97706'],
  F1: ['#7F1D1D','#DC2626'],
  Tennis: ['#3B0764','#7C3AED'],
  Basketball: ['#7C2D12','#EA580C'],
  Rugby: ['#0C4A6E','#0284C7'],
  Golf: ['#1A2E05','#65A30D'],
  Athletics: ['#4A044E','#A21CAF']
};

// ── Helpers ──────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
}

function sportClass(sport) {
  return (sport||'default').toLowerCase().replace(/[^a-z]/g,'');
}

const SPORT_SVG = {
  Football: '/images/sports/football.svg',
  Cricket: '/images/sports/cricket.svg',
  F1: '/images/sports/f1.svg',
  Tennis: '/images/sports/tennis.svg',
  Basketball: '/images/sports/basketball.svg',
  Rugby: '/images/sports/rugby.svg',
  Golf: '/images/sports/golf.svg',
  Athletics: '/images/sports/athletics.svg',
};

function placeholder(sport) {
  return SPORT_SVG[sport] || '/images/sports/football.svg';
}

function imgOrPlaceholder(article) {
  return article.image || placeholder(article.category || 'Sports');
}

function showToast(msg) {
  const t = document.getElementById('toastEl');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ── API ───────────────────────────────────────────────────

async function fetchNews({ category = '', limit = 40, page = 1 } = {}) {
  try {
    let url = `${API}/news?limit=${limit}&page=${page}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('fetchNews error:', e);
    return { articles: [], total: 0, totalPages: 0 };
  }
}

// ── Article navigation ────────────────────────────────────

function openArticle(article, allArticles) {
  try {
    sessionStorage.setItem('sk_article', JSON.stringify(article));
    if (allArticles && allArticles.length) {
      sessionStorage.setItem('sk_allArticles', JSON.stringify(allArticles));
    }
  } catch (e) { /* quota exceeded */ }
  window.location.href = 'article.html';
}

// ── Card builders ─────────────────────────────────────────

function makeHeroMain(article, allArticles) {
  const div = document.createElement('div');
  div.className = 'hero-card-main';
  const sport = article.category || 'Sports';
  div.innerHTML = `
    <img src="${esc(imgOrPlaceholder(article))}" alt="${esc(article.title)}" loading="lazy" onerror="this.src='${placeholder(sport)}'" />
    <div class="card-gradient"></div>
    <div class="card-body">
      <span class="sport-badge badge-${esc(sport)}">${esc(EMOJI[sport]||'')} ${esc(sport)}</span>
      <div class="card-title">${esc(article.title)}</div>
      <div class="card-meta">
        <span>${esc(article.source||'SportsKeen')}</span>
        <span class="meta-sep">·</span>
        <span>${timeAgo(article.pubDate)}</span>
      </div>
    </div>`;
  div.addEventListener('click', () => openArticle(article, allArticles));
  return div;
}

function makeHeroSide(article, allArticles) {
  const div = document.createElement('div');
  div.className = 'hero-card-side';
  const sport = article.category || 'Sports';
  div.innerHTML = `
    <img src="${esc(imgOrPlaceholder(article))}" alt="${esc(article.title)}" loading="lazy" onerror="this.src='${placeholder(sport)}'" />
    <div class="card-gradient"></div>
    <div class="card-body">
      <span class="sport-badge badge-${esc(sport)}">${esc(EMOJI[sport]||'')} ${esc(sport)}</span>
      <div class="card-title">${esc(article.title)}</div>
      <div class="card-meta">${esc(article.source||'SportsKeen')} · ${timeAgo(article.pubDate)}</div>
    </div>`;
  div.addEventListener('click', () => openArticle(article, allArticles));
  return div;
}

function makeFeaturedCard(article, allArticles) {
  const div = document.createElement('div');
  div.className = 'featured-card';
  const sport = article.category || 'Sports';
  div.innerHTML = `
    <img class="fc-img" src="${esc(imgOrPlaceholder(article))}" alt="${esc(article.title)}" loading="lazy" onerror="this.src='${placeholder(sport)}'" />
    <div class="fc-overlay"></div>
    <div class="fc-body">
      <span class="sport-badge badge-${esc(sport)}">${esc(EMOJI[sport]||'')} ${esc(sport)}</span>
      <div class="fc-title">${esc(article.title)}</div>
      <div class="fc-meta">${esc(article.source||'SportsKeen')} · ${timeAgo(article.pubDate)}</div>
    </div>`;
  div.addEventListener('click', () => openArticle(article, allArticles));
  return div;
}

function makeListCard(article, allArticles) {
  const div = document.createElement('div');
  div.className = 'list-card';
  const sport = article.category || 'Sports';
  div.innerHTML = `
    <div class="lc-img-wrap">
      <img class="lc-img" src="${esc(imgOrPlaceholder(article))}" alt="${esc(article.title)}" loading="lazy" onerror="this.src='${placeholder(sport)}'" />
      <span class="sport-badge badge-${esc(sport)}">${esc(EMOJI[sport]||'')}</span>
    </div>
    <div class="lc-body">
      <div class="lc-title">${esc(article.title)}</div>
      <div class="lc-meta">
        <span>${esc(article.source||'SportsKeen')}</span>
        <span class="meta-sep">·</span>
        <span>${timeAgo(article.pubDate)}</span>
      </div>
    </div>`;
  div.addEventListener('click', () => openArticle(article, allArticles));
  return div;
}

function makeGridCard(article, allArticles) {
  const div = document.createElement('div');
  div.className = 'grid-card';
  const sport = article.category || 'Sports';
  div.innerHTML = `
    <div class="gc-img-wrap">
      <img class="gc-img" src="${esc(imgOrPlaceholder(article))}" alt="${esc(article.title)}" loading="lazy" onerror="this.src='${placeholder(sport)}'" />
      <span class="sport-badge badge-${esc(sport)}">${esc(EMOJI[sport]||'')} ${esc(sport)}</span>
    </div>
    <div class="gc-body">
      <div class="gc-title">${esc(article.title)}</div>
      <div class="gc-meta">${esc(article.source||'SportsKeen')} · ${timeAgo(article.pubDate)}</div>
      ${article.summary ? `<div class="gc-summary">${esc(article.summary)}</div>` : ''}
    </div>`;
  div.addEventListener('click', () => openArticle(article, allArticles));
  return div;
}

// ── Section renderers ─────────────────────────────────────

function renderOriginals(articles) {
  const grid = document.getElementById('originalsGrid');
  const section = document.getElementById('originalsSection');
  if (!grid) return;
  const originals = articles.filter(a => a.original);
  if (!originals.length) {
    if (section) section.style.display = 'none';
    return;
  }
  grid.innerHTML = '';
  originals.forEach(a => grid.appendChild(makeGridCard(a, articles)));
}

function renderTicker(articles) {
  const track = document.getElementById('tickerTrack');
  if (!track || !articles.length) return;

  const items = articles.slice(0, 20);
  const inner = document.createElement('div');
  inner.className = 'ticker-inner';

  // Duplicate for seamless loop
  [items, items].forEach(arr => {
    arr.forEach(a => {
      const span = document.createElement('span');
      span.className = 'ticker-item';
      span.textContent = a.title;
      span.addEventListener('click', () => openArticle(a, articles));
      inner.appendChild(span);

      const sep = document.createElement('span');
      sep.className = 'ticker-sep';
      sep.textContent = '•';
      inner.appendChild(sep);
    });
  });

  track.innerHTML = '';
  track.appendChild(inner);
}

function renderTrendingBar(articles) {
  const bar = document.getElementById('trendingBar');
  if (!bar) return;
  bar.innerHTML = '';

  const top = articles.slice(0, 10);
  top.forEach(a => {
    const sport = a.category || 'Sports';
    const btn = document.createElement('button');
    btn.className = `trend-pill sport-${sportClass(sport)}`;
    btn.textContent = `${EMOJI[sport]||''} ${a.title.length > 40 ? a.title.slice(0,37)+'…' : a.title}`;
    btn.addEventListener('click', () => openArticle(a, articles));
    bar.appendChild(btn);
  });
}

function renderHero(articles) {
  const grid = document.getElementById('heroGrid');
  if (!grid || !articles.length) return;
  grid.innerHTML = '';

  const main = document.createElement('div');
  main.className = 'hero-main';
  main.appendChild(makeHeroMain(articles[0], articles));
  grid.appendChild(main);

  const side = document.createElement('div');
  side.className = 'hero-side';
  if (articles[1]) side.appendChild(makeHeroSide(articles[1], articles));
  if (articles[2]) side.appendChild(makeHeroSide(articles[2], articles));
  grid.appendChild(side);
}

function renderHomeSection(sport, articles, containerId, featuredCount, listCount) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Find the section header (keep it), clear the rest
  const header = container.querySelector('.section-header');
  container.innerHTML = '';
  if (header) container.appendChild(header);

  if (!articles || !articles.length) {
    const empty = document.createElement('p');
    empty.style.cssText = 'color:var(--text-muted);font-size:13px;padding:16px 0;';
    empty.textContent = 'No articles available.';
    container.appendChild(empty);
    return;
  }

  const fc = featuredCount || 1;
  const lc = listCount || 4;

  // Featured card
  if (articles[0]) {
    const wrap = document.createElement('div');
    wrap.className = 'col-featured';
    wrap.appendChild(makeFeaturedCard(articles[0], articles));
    container.appendChild(wrap);
  }

  // List cards
  if (articles.length > 1) {
    const listWrap = document.createElement('div');
    listWrap.className = 'col-list';
    articles.slice(fc, fc + lc).forEach(a => {
      listWrap.appendChild(makeListCard(a, articles));
    });
    container.appendChild(listWrap);
  }
}

// ── Search ────────────────────────────────────────────────

let searchDebounceTimer = null;
let cachedAllArticles = [];

function setupSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  const overlay = document.getElementById('searchOverlay');
  const resultsEl = document.getElementById('searchResults');
  const titleEl = document.getElementById('searchResultsTitle');
  const closeBtn = document.getElementById('closeSearch');

  if (!input) return;

  function doSearch(q) {
    if (!q || q.length < 2) {
      if (overlay) overlay.classList.add('hidden');
      return;
    }
    const ql = q.toLowerCase();
    const hits = cachedAllArticles.filter(a =>
      (a.title||'').toLowerCase().includes(ql) ||
      (a.summary||'').toLowerCase().includes(ql) ||
      (a.source||'').toLowerCase().includes(ql) ||
      (a.category||'').toLowerCase().includes(ql)
    ).slice(0, 20);

    if (titleEl) titleEl.textContent = `Search Results for "${q}" (${hits.length})`;
    if (resultsEl) {
      resultsEl.innerHTML = '';
      if (hits.length === 0) {
        resultsEl.innerHTML = '<p style="grid-column:1/-1;color:var(--text-muted);padding:20px 0;">No results found.</p>';
      } else {
        hits.forEach(a => resultsEl.appendChild(makeGridCard(a, cachedAllArticles)));
      }
    }
    if (overlay) overlay.classList.remove('hidden');
  }

  input.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => doSearch(input.value.trim()), 320);
  });

  if (btn) btn.addEventListener('click', () => doSearch(input.value.trim()));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch(input.value.trim());
    if (e.key === 'Escape') {
      if (overlay) overlay.classList.add('hidden');
      input.value = '';
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.add('hidden');
      input.value = '';
    });
  }
}

// ── Sticky AD ─────────────────────────────────────────────

function setupStickyAd() {
  const ad = document.getElementById('stickyBottomAd');
  const close = document.getElementById('stickyAdClose');
  if (!ad) return;
  setTimeout(() => {
    ad.classList.remove('hidden');
  }, 5000);
  if (close) {
    close.addEventListener('click', () => {
      ad.classList.add('hidden');
    });
  }
}

// ── Scroll to top ─────────────────────────────────────────

function setupScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Nav ───────────────────────────────────────────────────

function setupNav() {
  // On index.html, "All Sports" keeps active, others navigate to sport.html
  // Nav links are already href-based, so nothing extra needed for basic nav.
  // Active state is already set in HTML for index.html
}

// ── Refresh ───────────────────────────────────────────────

function setupRefresh() {
  const btn = document.getElementById('refreshBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.querySelector('svg').style.animation = 'spin 0.6s linear infinite';
    showToast('Refreshing news…');
    await init();
    btn.disabled = false;
    btn.querySelector('svg').style.animation = '';
    showToast('News updated!');
  });
}

// ── Newsletter forms ──────────────────────────────────────

function setupNewsletterForms() {
  ['newsletterFormSidebar','newsletterFormFooter'].forEach(id => {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;
      if (email) {
        showToast(`✅ Subscribed! Check ${email} for confirmation.`);
        form.reset();
      }
    });
  });
}

// ── Main init ─────────────────────────────────────────────

async function init() {
  // Fetch all articles (up to 200)
  const data = await fetchNews({ limit: 200, page: 1 });
  const allArticles = data.articles || [];
  cachedAllArticles = allArticles;

  // Group by sport
  const bySport = {};
  SPORTS.forEach(s => { bySport[s] = []; });
  allArticles.forEach(a => {
    const cat = a.category;
    if (cat && bySport[cat]) bySport[cat].push(a);
  });

  // Render ticker (all articles mixed)
  renderTicker(allArticles);

  // Trending bar (first 10 articles)
  renderTrendingBar(allArticles);

  // Hero (first 3 articles overall — best variety)
  renderHero(allArticles.slice(0, 3));

  // SportsKeen Originals section
  renderOriginals(allArticles);

  // Football section
  renderHomeSection('Football', bySport['Football'], 'footballSection', 1, 4);

  // Cricket section
  renderHomeSection('Cricket', bySport['Cricket'], 'cricketSection', 1, 4);

  // Sidebar
  renderSidebar(allArticles);

  // F1 section
  renderHomeSection('F1', bySport['F1'], 'f1Section', 1, 3);

  // Tennis section
  renderHomeSection('Tennis', bySport['Tennis'], 'tennisSection', 1, 3);

  // Basketball section
  renderHomeSection('Basketball', bySport['Basketball'], 'basketballSection', 1, 2);

  // Rugby section
  renderHomeSection('Rugby', bySport['Rugby'], 'rugbySection', 1, 2);

  // Golf section
  renderHomeSection('Golf', bySport['Golf'], 'golfSection', 1, 2);
}

// ── Sidebar ───────────────────────────────────────────────

function renderSidebar(allArticles) {
  const sidebar = document.getElementById('trendingSidebar');
  if (sidebar) {
    sidebar.innerHTML = '';
    allArticles.slice(0, 8).forEach(a => {
      const li = document.createElement('li');
      li.textContent = a.title;
      li.addEventListener('click', () => openArticle(a, allArticles));
      sidebar.appendChild(li);
    });
  }

  const mrList = document.getElementById('mostReadList');
  if (mrList) {
    mrList.innerHTML = '';
    const shuffled = [...allArticles].sort(() => Math.random() - 0.5);
    shuffled.slice(0, 5).forEach(a => {
      const li = document.createElement('li');
      li.className = 'most-read-item';
      const sport = a.category || 'Sports';
      li.innerHTML = `
        <div class="most-read-title">${esc(a.title)}</div>
        <div class="most-read-meta">
          <span class="sport-badge badge-${esc(sport)}" style="font-size:9px;padding:2px 5px;margin-bottom:0;">${esc(sport)}</span>
          &nbsp;${esc(a.source||'SportsKeen')}
        </div>`;
      li.addEventListener('click', () => openArticle(a, allArticles));
      mrList.appendChild(li);
    });
  }
}

// ── Boot ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupSearch();
  setupStickyAd();
  setupScrollTop();
  setupRefresh();
  setupNewsletterForms();
  init();
});

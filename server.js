const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
    ]
  },
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SportNewsBot/1.0)' }
});

// Decode HTML entities like &#39; &amp; &quot; etc.
function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const FEEDS = [
  // ── Sport-specific feeds (category is fixed) ──────────────
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',           source: 'BBC Football',   category: 'Football',   detect: false },
  { url: 'https://www.goal.com/feeds/en/news',                         source: 'Goal.com',       category: 'Football',   detect: false },
  { url: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml',            source: 'BBC Cricket',    category: 'Cricket',    detect: false },
  { url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', source: 'ESPNcricinfo',   category: 'Cricket',    detect: false },
  { url: 'https://feeds.bbci.co.uk/sport/tennis/rss.xml',             source: 'BBC Tennis',     category: 'Tennis',     detect: false },
  { url: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml',           source: 'BBC F1',         category: 'F1',         detect: false },
  { url: 'https://www.autosport.com/rss/feed/f1',                      source: 'Autosport',      category: 'F1',         detect: false },
  { url: 'https://feeds.bbci.co.uk/sport/basketball/rss.xml',         source: 'BBC Basketball', category: 'Basketball', detect: false },
  { url: 'https://feeds.bbci.co.uk/sport/rugby-union/rss.xml',        source: 'BBC Rugby',      category: 'Rugby',      detect: false },
  { url: 'https://feeds.bbci.co.uk/sport/golf/rss.xml',               source: 'BBC Golf',       category: 'Golf',       detect: false },
  { url: 'https://feeds.bbci.co.uk/sport/athletics/rss.xml',          source: 'BBC Athletics',  category: 'Athletics',  detect: false },

  // ── Multi-sport feeds (category auto-detected per article) ─
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml',                    source: 'BBC Sport',      category: 'Football',   detect: true  },
  { url: 'https://sports.yahoo.com/rss/',                              source: 'Yahoo Sports',   category: 'Football',   detect: true  },
  { url: 'https://www.espn.com/espn/rss/news',                         source: 'ESPN',           category: 'Football',   detect: true  },
  { url: 'https://www.skysports.com/rss/12040',                        source: 'Sky Sports',     category: 'Football',   detect: true  },
];

// ── Keyword-based sport detection ────────────────────────────
const SPORT_KEYWORDS = {
  Cricket:    ['cricket', 'wicket', 'batsman', 'batter', 'bowler', 'bowling', 'odi', 't20', 'test match',
               'ipl', 'innings', 'stumped', 'lbw', 'run chase', 'over ', 'espncricinfo', 'bcci',
               'virat', 'rohit', 'bumrah', 'anderson', 'stokes', 'bairstow', 'ashes'],
  Tennis:     ['tennis', 'wimbledon', 'grand slam', 'atp', 'wta', 'us open', 'australian open',
               'french open', 'roland garros', 'djokovic', 'nadal', 'federer', 'alcaraz',
               'sinner', 'swiatek', 'serve', 'backhand', 'forehand', 'deuce', 'set point'],
  F1:         ['formula 1', 'formula one', 'f1', 'grand prix', ' gp ', 'ferrari', 'red bull racing',
               'mercedes f1', 'mclaren', 'verstappen', 'hamilton', 'leclerc', 'norris',
               'pit stop', 'pole position', 'qualifying', 'fastest lap', 'race engineer'],
  Basketball: ['basketball', 'nba', 'lakers', 'celtics', 'warriors', 'bulls', 'nets', 'knicks',
               'lebron', 'curry', 'durant', 'slam dunk', 'three-pointer', 'rebound', 'playoffs nba'],
  Rugby:      ['rugby', 'six nations', 'premiership rugby', 'super rugby', 'try ', 'scrum',
               'lineout', 'fly-half', 'prop', 'hooker', 'all blacks', 'springboks', 'lions tour'],
  Golf:       ['golf', 'pga tour', 'masters', 'open championship', 'ryder cup', 'birdie', 'eagle',
               'bogey', 'par ', 'tee box', 'fairway', 'putting', 'mcilroy', 'woods', 'scheffler'],
  Athletics:  ['athletics', 'marathon', 'sprint', 'javelin', 'shot put', 'high jump', 'long jump',
               '100m', '200m', '400m', 'hurdles', 'decathlon', 'world championships athletics',
               'bolt', 'felix', 'duplantis'],
  Football:   ['football', 'soccer', 'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1',
               'champions league', 'europa league', 'fa cup', 'world cup', 'euro ', 'mls',
               'striker', 'midfielder', 'goalkeeper', 'wembley', 'anfield', 'old trafford',
               'transfer', 'signing', 'manager sacked', 'goal ', 'penalty', 'offside'],
};

function detectSport(title, summary, defaultCategory) {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return sport;
  }
  return defaultCategory; // fallback to feed default
}

// ── Default sport images (Unsplash) for original articles with no image ──
const SPORT_DEFAULT_IMAGES = {
  Football:   '/images/sports/football.svg',
  Cricket:    '/images/sports/cricket.svg',
  F1:         '/images/sports/f1.svg',
  Tennis:     '/images/sports/tennis.svg',
  Basketball: '/images/sports/basketball.svg',
  Rugby:      '/images/sports/rugby.svg',
  Golf:       '/images/sports/golf.svg',
  Athletics:  '/images/sports/athletics.svg',
};

// ── Load original SportsKeen articles from content/articles/ ─────
const CONTENT_DIR = path.join(__dirname, 'content', 'articles');

function loadOriginalArticles() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  try {
    return fs.readdirSync(CONTENT_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8')); }
        catch (e) { console.warn(`Bad article file: ${f}`, e.message); return null; }
      })
      .filter(Boolean)
      .map(a => ({
        ...a,
        original: true,
        source: 'SportsKeen',
        category: a.sport || a.category,
        image: a.image || SPORT_DEFAULT_IMAGES[a.sport] || null,
      }));
  } catch (e) {
    console.warn('Could not load original articles:', e.message);
    return [];
  }
}

// Cache to avoid hammering feeds on every request
let cache = { data: [], lastFetched: null };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchFeed(feed) {
  try {
    const result = await parser.parseURL(feed.url);
    return result.items.slice(0, 10).map(item => {
      const title   = decodeEntities(item.title || '');
      const summary = decodeEntities(
        (item.contentSnippet || item.summary || '')
          .replace(/<[^>]+>/g, '')
          .slice(0, 220)
      );
      // Auto-detect category for multi-sport feeds; fixed for sport-specific feeds
      const category = feed.detect
        ? detectSport(title, summary, feed.category)
        : feed.category;

      return {
        title,
        link: item.link || item.guid || '',
        pubDate: item.pubDate || item.isoDate || '',
        summary,
        source: feed.source,
        category,
        image: extractImage(item),
      };
    });
  } catch (err) {
    console.warn(`Feed failed [${feed.source}]:`, err.message);
    return [];
  }
}

function extractImage(item) {
  // 1. enclosure (podcasts/images attached to feed)
  if (item.enclosure && item.enclosure.url) {
    const t = item.enclosure.type || '';
    if (!t || t.startsWith('image')) return item.enclosure.url;
  }

  // 2. media:content
  const mc = item['media:content'];
  if (mc) {
    const arr = Array.isArray(mc) ? mc : [mc];
    for (const m of arr) {
      const url = m?.$ ?.url || m?.url;
      if (url) return url;
    }
  }

  // 3. media:thumbnail
  const mt = item['media:thumbnail'];
  if (mt) {
    const url = mt?.$ ?.url || mt?.url;
    if (url) return url;
  }

  // 4. Extract first <img> from content/description HTML
  const html = item['content:encoded'] || item.content || item.summary || '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1] && imgMatch[1].startsWith('http')) return imgMatch[1];

  return null;
}

async function fetchAllFeeds() {
  const now = Date.now();
  if (cache.lastFetched && now - cache.lastFetched < CACHE_TTL) {
    return cache.data;
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const raw = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Deduplicate by title
  const seen = new Set();
  const deduped = raw.filter(a => {
    const key = (a.title || '').slice(0, 80).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Merge originals (always re-read from disk so new articles appear instantly)
  const originals = loadOriginalArticles();
  const allArticles = [...originals, ...deduped]
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`Loaded ${originals.length} original + ${deduped.length} RSS articles`);
  cache = { data: allArticles, lastFetched: now };
  return allArticles;
}

app.get('/api/news', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 30 } = req.query;
    let articles = await fetchAllFeeds();
    // Always inject latest originals on top (disk read is fast, ensures instant publish)
    const originals = loadOriginalArticles();
    const rss = articles.filter(a => !a.original);
    // Pin originals at the top, RSS sorted by date below
    articles = [...originals, ...rss.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))];

    if (category && category !== 'All') {
      articles = articles.filter(a => a.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      );
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = articles.slice(start, start + limitNum);

    res.json({
      articles: paginated,
      total: articles.length,
      page: pageNum,
      totalPages: Math.ceil(articles.length / limitNum),
      lastUpdated: cache.lastFetched,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news', details: err.message });
  }
});

app.get('/api/categories', (req, res) => {
  const categories = ['All', ...new Set(FEEDS.map(f => f.category))];
  res.json(categories);
});

app.get('/api/refresh', async (req, res) => {
  cache = { data: [], lastFetched: null };
  const articles = await fetchAllFeeds();
  res.json({ success: true, count: articles.length });
});

app.get('/api/debug', (req, res) => {
  const exists = fs.existsSync(CONTENT_DIR);
  let files = [];
  if (exists) files = fs.readdirSync(CONTENT_DIR);
  res.json({ CONTENT_DIR, exists, files, __dirname });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sports News Portal running at http://localhost:${PORT}`));

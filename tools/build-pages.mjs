// Генератор статических страниц «Развилок».
// Запуск: node tools/build-pages.mjs
// Читает scenarios.js и создаёт:
//   tests/<id>/index.html, tests/index.html, about/index.html, sitemap.xml

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://razvilki.vercel.app';
const OG_IMAGE = SITE + '/og-image.png';
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const CSS_VERSION = '3';

const INTRO = {
  'session-panic': [
    'Две недели до первой сдачи, сорок вопросов в списке и полное ощущение, что времени нет. Знакомо? Этот тест не про знания, а про то, как ты распоряжаешься собой в самый плотный период года: сном, деньгами и репутацией в группе.',
    'Каждое решение здесь стоит чего-то: отдохнул — потерял темп, ушёл в ночную зубрёжку — потерял силы, попросил помощи — поставил на репутацию. Шесть шагов, три ресурса и четыре исхода — от «сессия сдана, ты в порядке» до «сессия прошла сквозь тебя».'
  ],
  'pet-project': [
    'Идея есть, срок — один месяц, а за спиной обычная жизнь с работой и делами. Этот сценарий про то, как распределить бюджет, энергию и доверие окружающих, когда очень хочется запустить своё.',
    'Тут нет «правильной» стратегии: можно купить инструмент и сэкономить неделю, можно собрать всё самому и выгореть, можно позвать друга в сооснователи и поделить долю. Шесть решений — и один из четырёх исходов, от «запустился и не выгорел» до «запуск случился еле-еле».'
  ],
  'till-payday': [
    'На карте три тысячи, до аванса восемь дней, а вокруг — друзья, доставка, сломанная стиралка и зуб, который решил заболеть именно сейчас. Тест про бытовую финансовую грамотность без нотаций: считать, договариваться, откладывать и вовремя говорить «нет».',
    'Каждый выбор двигает бюджет, энергию и комфорт. В конце видно, дожил ты до зарплаты человеком или это было выживание — и что именно пришлось отдать за то, чтобы дотянуть.'
  ],
  'first-car': [
    'Цена подозрительно низкая, продавец торопит, а в кармане первый серьёзный бюджет. Сценарий про решения под давлением: брать ли друга-механика, вестись ли на «есть ещё покупатель», экономить ли на оформлении и когда торговаться, а когда уходить.',
    'Нервы, деньги и надёжность — три шкалы, которые покажут, купил ты машину или набор проблем на колёсах. А заодно — сколько стоил урок.'
  ],
  'dacha-weekend': [
    'Суббота, шесть утра, список дел длиннее участка. Дача — это не только грядки, но и соседи, шашлыки, бардак в доме и вечный вопрос, где заканчивается отдых и начинается вторая работа.',
    'Тест про то, как распределить силы, порядок и настроение за два дня, чтобы в понедельник не хотелось всё бросить. Четыре исхода честно показывают цену «всё успеть».'
  ],
  'own-content': [
    'Алгоритмы просят цифр, а внутри просит голос. Этот сценарий — про канал, который надо вести, когда тренды, заказы и выгорание тянут в разные стороны.',
    'Идеи, охваты и терпение не бесконечны: за рост приходится платить, и не всегда деньгами. Шесть шагов, четыре исхода и один вопрос — останешься ли ты собой к концу эксперимента.'
  ]
};

const scenariosSrc = fs.readFileSync(path.join(ROOT, 'scenarios.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(scenariosSrc, sandbox);
const scenarios = sandbox.window.SCENARIOS;

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

function listJoin(items) {
  if (items.length < 2) return items[0] || '';
  return items.slice(0, -1).join(', ') + ' и ' + items[items.length - 1];
}

function breadcrumbs(prefix, current) {
  return '<nav class="breadcrumbs" aria-label="Хлебные крошки">' +
    '<a href="' + prefix + '">Главная</a> / ' +
    '<a href="' + prefix + 'tests/">Тесты</a> / ' +
    '<span class="current">' + esc(current) + '</span>' +
    '</nav>';
}

function page({ title, description, canonical, prefix, body, jsonLd }) {
  const icon = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E%3Crect%20width='64'%20height='64'%20rx='12'%20fill='%23B23A2A'/%3E%3Cpath%20d='M32%2052V32M32%2032L16%2014M32%2032L48%2014'%20stroke='%23FCFBF8'%20stroke-width='7'%20stroke-linecap='round'/%3E%3C/svg%3E";
  return '<!DOCTYPE html>\n' +
    '<html lang="ru">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + esc(title) + '</title>\n' +
    '  <meta name="description" content="' + esc(description) + '">\n' +
    '  <meta name="theme-color" content="#F5F3EE">\n' +
    '\n' +
    '  <meta property="og:type" content="website">\n' +
    '  <meta property="og:site_name" content="Развилки">\n' +
    '  <meta property="og:locale" content="ru_RU">\n' +
    '  <meta property="og:title" content="' + esc(title) + '">\n' +
    '  <meta property="og:description" content="' + esc(description) + '">\n' +
    '  <meta property="og:url" content="' + esc(canonical) + '">\n' +
    '  <meta property="og:image" content="' + OG_IMAGE + '">\n' +
    '  <meta property="og:image:type" content="image/png">\n' +
    '  <meta property="og:image:width" content="1200">\n' +
    '  <meta property="og:image:height" content="630">\n' +
    '\n' +
    '  <meta name="twitter:card" content="summary_large_image">\n' +
    '  <meta name="twitter:title" content="' + esc(title) + '">\n' +
    '  <meta name="twitter:description" content="' + esc(description) + '">\n' +
    '  <meta name="twitter:image" content="' + OG_IMAGE + '">\n' +
    '\n' +
    '  <link rel="canonical" href="' + esc(canonical) + '">\n' +
    '  <link rel="icon" type="image/svg+xml" href="' + icon + '">\n' +
    '\n' +
    '  <script>\n' +
    '    (function () {\n' +
    '      try {\n' +
    "        var saved = localStorage.getItem('razvilki_theme');\n" +
    "        var dark = saved ? saved === 'dark'\n" +
    "          : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);\n" +
    "        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');\n" +
    "        var meta = document.querySelector('meta[name=\"theme-color\"]');\n" +
    "        if (meta) meta.setAttribute('content', dark ? '#16171A' : '#F5F3EE');\n" +
    '      } catch (e) {}\n' +
    '    })();\n' +
    '  </script>\n' +
    '\n' +
    '  <link rel="stylesheet" href="' + prefix + 'style.css?v=' + CSS_VERSION + '">\n' +
    (jsonLd
      ? '  <script type="application/ld+json">\n' + JSON.stringify(jsonLd, null, 2) + '\n  </script>\n'
      : '') +
    '</head>\n' +
    '<body>\n' +
    '  <a class="skip-link" href="#main">Перейти к содержимому</a>\n' +
    '\n' +
    '  <header class="site-header">\n' +
    '    <div class="shell header-inner">\n' +
    '      <a class="brand" href="' + prefix + '" aria-label="На главную">\n' +
    '        <span class="brand-mark" aria-hidden="true">Р</span>\n' +
    '        <span class="brand-name">Развилки</span>\n' +
    '      </a>\n' +
    '      <div class="header-actions">\n' +
    '        <a class="theme-toggle" href="' + prefix + 'tests/">Все тесты</a>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </header>\n' +
    '\n' +
    '  <main class="shell landing" id="main">\n' +
    body +
    '\n  </main>\n' +
    '\n' +
    '  <footer class="site-footer">\n' +
    '    <div class="shell footer-inner">\n' +
    '      <span>Развилки — платформа интерактивных тестов-симуляторов выбора.</span>\n' +
    '      <nav class="footer-nav" aria-label="Разделы сайта">\n' +
    '        <a href="' + prefix + '">Главная</a>\n' +
    '        <a href="' + prefix + 'tests/">Все тесты</a>\n' +
    '        <a href="' + prefix + 'about/">О проекте</a>\n' +
    '      </nav>\n' +
    '      <span class="footer-note">Никаких правильных ответов. Только последствия.</span>\n' +
    '    </div>\n' +
    '  </footer>\n' +
    '</body>\n' +
    '</html>\n';
}

function scenarioBody(sc, prefix) {
  const intro = (INTRO[sc.id] || [sc.tagline])
    .map((p) => '    <p>' + esc(p) + '</p>')
    .join('\n');
  const steps = sc.steps.length;
  const endings = sc.endings.length;
  const endingsWord = endings === 4 ? 'четырёх' : endings;
  const others = scenarios
    .filter((other) => other.id !== sc.id)
    .map((other) =>
      '        <a class="test-link" href="' + prefix + 'tests/' + other.id + '/">' +
      '<b>' + esc(other.title) + '</b><span>' + esc(other.tagline) + '</span></a>'
    )
    .join('\n');

  return '' +
    '    ' + breadcrumbs(prefix, sc.title) + '\n' +
    '    <section class="landing-hero">\n' +
    '      <p class="hero-kicker">Тест-симулятор · ' + steps + ' шагов · примерно 2 минуты</p>\n' +
    '      <h1 class="hero-title">' + esc(sc.title) + '</h1>\n' +
    '      <p class="hero-sub">' + esc(sc.tagline) + '</p>\n' +
    '      <div class="cta-row">\n' +
    '        <a class="btn" href="' + prefix + '#/' + esc(sc.id) + '">Пройти тест</a>\n' +
    '        <span class="cta-note">Без регистрации · ' + endings + ' концовки · три ресурса</span>\n' +
    '      </div>\n' +
    '      <div class="card-meta">\n' +
    '        <span class="chip">' + steps + ' шагов</span>\n' +
    '        <span class="chip">' + esc(listJoin(sc.resources)) + '</span>\n' +
    '        <span class="chip">' + endings + ' концовки</span>\n' +
    '      </div>\n' +
    '    </section>\n' +
    '\n' +
    '    <div class="landing-text">\n' +
    intro + '\n' +
    '      <h2>Что на кону</h2>\n' +
    '      <p>Ты управляешь тремя ресурсами — ' + esc(listJoin(sc.resources)) + '. Каждый стартует с 50. Любое решение сдвигает шкалы: где-то прибавляет, где-то отнимает, и бесплатных ходов почти не бывает.</p>\n' +
    '      <p>Если один из ресурсов падает до нуля, тест заканчивается провалом. Если доходишь до последнего шага — получаешь один из ' + endingsWord + ' исходов, от сильного до очень слабого.</p>\n' +
    '      <h2>Как это работает</h2>\n' +
    '      <ol class="how-list">\n' +
    '        <li>Читаешь ситуацию и выбираешь один из трёх вариантов.</li>\n' +
    '        <li>Смотришь, как изменились ресурсы, и идёшь дальше.</li>\n' +
    '        <li>В конце — итог, разбор всех ходов и одна из ' + endingsWord + ' концовок.</li>\n' +
    '      </ol>\n' +
    '      <h2>Другие развилки</h2>\n' +
    '    </div>\n' +
    '    <div class="test-links">\n' + others + '\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="cta-row">\n' +
    '      <a class="btn" href="' + prefix + '#/' + esc(sc.id) + '">Пройти тест</a>\n' +
    '    </div>\n';
}

function scenarioJsonLd(sc) {
  const canonical = SITE + '/tests/' + sc.id + '/';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Тесты', item: SITE + '/tests/' },
      { '@type': 'ListItem', position: 3, name: sc.title, item: canonical }
    ]
  };
}

function testsIndexBody() {
  const cards = scenarios.map((sc) =>
    '      <a class="test-link" href="' + sc.id + '/">' +
    '<b>' + esc(sc.title) + '</b><span>' + esc(sc.tagline) + '</span></a>'
  ).join('\n');

  return '' +
    '    <nav class="breadcrumbs" aria-label="Хлебные крошки">\n' +
    '      <a href="../">Главная</a> / <span class="current">Все тесты</span>\n' +
    '    </nav>\n' +
    '    <section class="landing-hero">\n' +
    '      <p class="hero-kicker">Библиотека · 6 тестов</p>\n' +
    '      <h1 class="hero-title">Все тесты</h1>\n' +
    '      <p class="hero-sub">Шесть развилок — про сессию, первый пет-проект, жизнь до аванса, машину с рук, дачу и свой контент. В каждой три ресурса, шесть решений и четыре исхода. Без регистрации и правильных ответов.</p>\n' +
    '    </section>\n' +
    '    <div class="test-links">\n' + cards + '\n    </div>\n';
}

function testsIndexJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Тесты «Развилок»',
    itemListElement: scenarios.map((sc, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: SITE + '/tests/' + sc.id + '/',
      name: sc.title
    }))
  };
}

function aboutBody() {
  return '' +
    '    <nav class="breadcrumbs" aria-label="Хлебные крошки">\n' +
    '      <a href="../">Главная</a> / <span class="current">О проекте</span>\n' +
    '    </nav>\n' +
    '    <section class="landing-hero">\n' +
    '      <p class="hero-kicker">О проекте</p>\n' +
    '      <h1 class="hero-title">Развилки</h1>\n' +
    '      <p class="hero-sub">Интерактивные тесты-симуляторы выбора: здесь нет правильных ответов, есть только последствия.</p>\n' +
    '    </section>\n' +
    '    <div class="landing-text">\n' +
    '      <p>«Развилки» — это короткие истории, в которых нужно принимать решения. Не «какой ты персонаж», а «что ты сделаешь, когда через две недели сессия, а денег и сил уже нет».</p>\n' +
    '      <h2>Как устроены ресурсы</h2>\n' +
    '      <p>В каждом тесте три шкалы, и все стартуют с 50. Любое решение сдвигает их: где-то прибавляет, где-то отнимает. Бесплатных ходов почти нет — даже удачный выбор обычно чем-то платит.</p>\n' +
    '      <p>Если один из ресурсов падает до нуля, тест заканчивается провалом. Если доходишь до последнего шага — получаешь один из четырёх исходов: от «всё получилось» до «еле дожил».</p>\n' +
    '      <h2>Почему нет правильных ответов</h2>\n' +
    '      <p>В жизни одно и то же решение может оказаться и выигрышем, и ошибкой — зависит от того, что для тебя важнее. Поэтому в «Развилках» нет баллов за «правильный» вариант: ты видишь последствия и разбор собственных ходов.</p>\n' +
    '      <h2>Данные и приватность</h2>\n' +
    '      <p>На сайте нет аккаунтов, форм и персональных данных. Прогресс — открытые концовки, серия дней и настройки темы — хранится только в твоём браузере (localStorage) и никуда не отправляется.</p>\n' +
    '      <p>Для обезличенной статистики посещений используется Яндекс.Метрика, в том числе Вебвизор. Это нужно, чтобы понимать, какие тесты интересны, и улучшать сценарии.</p>\n' +
    '      <h2>Кто делает</h2>\n' +
    '      <p>«Развилки» — независимый проект. Сценарии основаны на обычных бытовых ситуациях, а не на научных тестах или психологических методиках.</p>\n' +
    '      <div class="cta-row">\n' +
    '        <a class="btn" href="../tests/">Выбрать тест</a>\n' +
    '        <a class="btn btn-ghost" href="../">На главную</a>\n' +
    '      </div>\n' +
    '    </div>\n';
}

function write(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  console.log('  ' + relativePath);
}

console.log('Страницы сценариев:');
for (const sc of scenarios) {
  const html = page({
    title: sc.title + ' — тест | Развилки',
    description: sc.tagline + ' Пройди тест-симулятор за две минуты.',
    canonical: SITE + '/tests/' + sc.id + '/',
    prefix: '../../',
    body: scenarioBody(sc, '../../'),
    jsonLd: scenarioJsonLd(sc)
  });
  write(path.join('tests', sc.id, 'index.html'), html);
}

console.log('Служебные страницы:');
write(path.join('tests', 'index.html'), page({
  title: 'Все тесты — Развилки',
  description: 'Шесть интерактивных тестов-симуляторов выбора: сессия, пет-проект, жизнь до аванса, первая машина, дача и свой контент.',
  canonical: SITE + '/tests/',
  prefix: '../',
  body: testsIndexBody(),
  jsonLd: testsIndexJsonLd()
}));

write(path.join('about', 'index.html'), page({
  title: 'О проекте — Развилки',
  description: 'Как устроены «Развилки»: три ресурса, решения с ценой, четыре исхода и никаких правильных ответов.',
  canonical: SITE + '/about/',
  prefix: '../',
  body: aboutBody(),
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'О проекте', item: SITE + '/about/' }
    ]
  }
}));

const urls = [
  { loc: SITE + '/', priority: '1.0', changefreq: 'weekly' },
  { loc: SITE + '/tests/', priority: '0.8', changefreq: 'weekly' },
  ...scenarios.map((sc) => ({ loc: SITE + '/tests/' + sc.id + '/', priority: '0.7', changefreq: 'monthly' })),
  { loc: SITE + '/about/', priority: '0.5', changefreq: 'monthly' }
];

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((url) =>
    '  <url>\n' +
    '    <loc>' + url.loc + '</loc>\n' +
    '    <lastmod>' + BUILD_DATE + '</lastmod>\n' +
    '    <changefreq>' + url.changefreq + '</changefreq>\n' +
    '    <priority>' + url.priority + '</priority>\n' +
    '  </url>\n'
  ).join('') +
  '</urlset>\n';

console.log('Sitemap:');
write('sitemap.xml', sitemap);

console.log('\nГотово: ' + (scenarios.length + 3) + ' файла и sitemap.xml');

(function () {
  'use strict';

  var METRIKA_ID = 114490918;
  var SITE_NAME = 'Развилки';

  var app = document.getElementById('app');
  var themeToggle = document.getElementById('themeToggle');
  var soundToggle = document.getElementById('soundToggle');
  var brandLink = document.getElementById('brandLink');

  var state = null;

  var FAIL_MESSAGES = {
    'Бюджет': 'Деньги кончились — дальше идти не на что.',
    'Силы': 'Ты выдохся. Без сна и отдыха сессия не сдаётся.',
    'Репутация': 'Реноме рухнуло — теперь никто не пойдёт навстречу.',
    'Энергия': 'Энергия на нуле — проект встал.',
    'Доверие': 'Тебе перестали верить — и проект это почувствовал.',
    'Комфорт': 'Уют закончился — так жить уже нельзя.',
    'Нервы': 'Нервы сдали — ни на что больше не хватает.',
    'Надёжность': 'Надёжность на нуле — на такой машине далеко не уедешь.',
    'Порядок': 'Порядок рухнул — дачный хаос победил.',
    'Настроение': 'Настроение на нуле — выходные окончательно испорчены.',
    'Идеи': 'Идеи кончились — писать больше не о чем.',
    'Охваты': 'Охваты упали в ноль — тебя просто перестали видеть.',
    'Терпение': 'Терпение лопнуло — продолжать уже нет сил.'
  };

  // ---------- Theme ----------
  var metaThemeColor = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#16171A' : '#F5F3EE');
    }
  }

  function systemTheme() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch (e) {}
    return 'light';
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('razvilki_theme'); } catch (e) {}
    var current = document.documentElement.getAttribute('data-theme');
    var theme = saved === 'dark' || saved === 'light'
      ? saved
      : (current === 'dark' || current === 'light' ? current : systemTheme());
    applyTheme(theme);
  }

  themeToggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('razvilki_theme', next); } catch (e) {}
  });

  brandLink.addEventListener('click', function (e) {
    e.preventDefault();
    renderMain();
  });

  // ---------- Routing ----------
  var SITE_TITLE = document.title;

  function parseRoute() {
    var hash = '';
    try { hash = location.hash || ''; } catch (e) { return { id: null, challenge: null }; }
    var match = hash.match(/^#\/?([a-z0-9-]+)(?:\?([^#]*))?$/i);
    if (!match) return { id: null, challenge: null };
    var challenge = null;
    if (match[2]) {
      var parts = match[2].split('&');
      for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split('=');
        if (pair[0] === 'challenge' && pair[1]) {
          try { challenge = decodeURIComponent(pair[1]); } catch (e) { challenge = pair[1]; }
        }
      }
    }
    return { id: match[1], challenge: challenge };
  }

  function routeId() {
    return parseRoute().id;
  }

  function navigate(id, challenge) {
    var target = '#/';
    if (id) {
      target = '#/' + id;
      if (challenge) target += '?challenge=' + encodeURIComponent(challenge);
    }
    try {
      if (location.hash !== target) location.hash = target;
    } catch (e) {}
  }

  // ---------- Screen readers & focus ----------
  var statusEl = document.getElementById('status');

  function announce(text) {
    if (!statusEl) return;
    statusEl.textContent = text;
  }

  function focusFirst(selector) {
    var el = app.querySelector(selector);
    if (!el || !el.focus) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  // ---------- Sound ----------
  var SOUND_KEY = 'razvilki_sound';
  var soundEnabled = true;
  var audioCtx = null;

  function updateSoundButton() {
    if (!soundToggle) return;
    soundToggle.textContent = soundEnabled ? 'Звук вкл.' : 'Звук выкл.';
    soundToggle.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
  }

  function initSound() {
    var saved = null;
    try { saved = localStorage.getItem(SOUND_KEY); } catch (e) {}
    soundEnabled = saved !== 'off';
    updateSoundButton();
  }

  function getAudioContext() {
    if (audioCtx) return audioCtx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      audioCtx = new Ctx();
    } catch (e) {
      audioCtx = null;
    }
    return audioCtx;
  }

  function playTone(freq, start, duration, volume, type) {
    var ctx = getAudioContext();
    if (!ctx) return;
    var at = ctx.currentTime + start;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + duration + 0.03);
  }

  function playSound(kind) {
    if (!soundEnabled) return;
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        var resumed = ctx.resume();
        if (resumed && typeof resumed.catch === 'function') resumed.catch(function () {});
      }

      if (kind === 'choice') {
        playTone(440, 0, 0.08, 0.035, 'sine');
      } else if (kind === 'final') {
        playTone(523.25, 0, 0.14, 0.045, 'sine');
        playTone(783.99, 0.12, 0.22, 0.045, 'sine');
      } else if (kind === 'fail') {
        playTone(220, 0, 0.16, 0.045, 'triangle');
        playTone(164.81, 0.12, 0.24, 0.045, 'triangle');
      } else if (kind === 'toggle') {
        playTone(660, 0, 0.07, 0.03, 'sine');
      }
    } catch (e) {}
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      try { localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off'); } catch (e) {}
      updateSoundButton();
      if (soundEnabled) playSound('toggle');
    });
  }

  // ---------- Analytics ----------
  function trackGoal(name, scenarioId) {
    if (typeof ym !== 'function') return;
    try {
      if (scenarioId) ym(METRIKA_ID, 'reachGoal', name, { scenario: scenarioId });
      else ym(METRIKA_ID, 'reachGoal', name);
    } catch (e) {}
  }

  // ---------- Helpers ----------
  function clampValue(value) {
    return Math.max(0, Math.min(100, value));
  }

  function barLevel(value) {
    if (value <= 15) return 'danger';
    if (value < 35) return 'warn';
    return 'good';
  }

  function formatDelta(res, delta) {
    var sign = delta > 0 ? '+' : '';
    return res + ' ' + sign + delta;
  }

  function findScenario(id) {
    for (var i = 0; i < window.SCENARIOS.length; i++) {
      if (window.SCENARIOS[i].id === id) return window.SCENARIOS[i];
    }
    return null;
  }

  // ---------- Opened endings ----------
  var ENDINGS_KEY = 'razvilki_endings';

  function loadOpenedEndings() {
    var raw = null;
    try { raw = localStorage.getItem(ENDINGS_KEY); } catch (e) {}
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveOpenedEnding(scenarioId, endingId) {
    var opened = loadOpenedEndings();
    var list = opened[scenarioId];
    if (!Array.isArray(list)) list = [];
    if (list.indexOf(endingId) === -1) {
      list.push(endingId);
      opened[scenarioId] = list;
      try { localStorage.setItem(ENDINGS_KEY, JSON.stringify(opened)); } catch (e) {}
    }
    return opened;
  }

  function countOpenedEndings(scenarioId) {
    var list = loadOpenedEndings()[scenarioId];
    return Array.isArray(list) ? list.length : 0;
  }

  // ---------- Dates, daily scenario, streak ----------
  var STREAK_KEY = 'razvilki_streak';

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function dateKey(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function dailyScenario() {
    var now = new Date();
    var start = new Date(2026, 0, 1);
    var days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000);
    var list = window.SCENARIOS;
    return list[((days % list.length) + list.length) % list.length];
  }

  function loadStreak() {
    var raw = null;
    try { raw = localStorage.getItem(STREAK_KEY); } catch (e) {}
    if (!raw) return { last: '', count: 0 };
    try {
      var parsed = JSON.parse(raw);
      return { last: parsed.last || '', count: parsed.count || 0 };
    } catch (e) {
      return { last: '', count: 0 };
    }
  }

  function bumpStreak() {
    var today = todayKey();
    var streak = loadStreak();
    if (streak.last === today) return streak;
    var yesterday = dateKey(new Date(Date.now() - 86400000));
    streak.count = streak.last === yesterday ? streak.count + 1 : 1;
    streak.last = today;
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(streak)); } catch (e) {}
    return streak;
  }

  function pluralDays(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
    return 'дней';
  }

  function findEnding(sc, id) {
    for (var i = 0; i < sc.endings.length; i++) {
      if (sc.endings[i].id === id) return sc.endings[i];
    }
    return null;
  }

  function dailyHtml() {
    var sc = dailyScenario();
    var date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return '<section class="daily">' +
      '<p class="daily-kicker">Развилка дня · ' + date + '</p>' +
      '<h2 class="daily-title">' + sc.title + '</h2>' +
      '<p class="daily-sub">' + sc.tagline + '</p>' +
      '<button class="btn" type="button" data-start="' + sc.id + '">Играть</button>' +
      '</section>';
  }

  function resourcesHtml(values) {
    var res = state.scenario.resources;
    var changed = state.lastChanged || {};
    var html = '<div class="resources">';
    for (var i = 0; i < res.length; i++) {
      var name = res[i];
      var value = values[name] == null ? 0 : values[name];
      var level = barLevel(value);
      var change = changed[name] ? ' changed ' + changed[name] : '';
      html += '<div class="resource ' + level + change + '">' +
        '<div class="resource-head"><span class="resource-name">' + name + '</span>' +
        '<span class="resource-value">' + value + '</span></div>' +
        '<div class="resource-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + clampValue(value) + '" aria-label="' + name + '">' +
        '<div class="resource-fill" style="width:' + clampValue(value) + '%"></div></div>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  // ---------- Main screen ----------
  function renderMain() {
    if (!window.SCENARIOS || !window.SCENARIOS.length) {
      app.innerHTML = '<p class="notice">Не удалось загрузить сценарии. Проверьте подключение и обновите страницу.</p>';
      return;
    }

    var hadState = !!state;
    state = null;
    if (routeId()) navigate(null);
    document.title = SITE_TITLE;

    var streak = loadStreak();
    var streakHtml = '';
    if (streak.count >= 2 && streak.last === todayKey()) {
      streakHtml = '<p class="streak">Серия: ' + streak.count + ' ' + pluralDays(streak.count) + ' подряд</p>';
    }

    var html = '<section class="hero">' +
      '<p class="hero-kicker">Интерактивные тесты-симуляторы</p>' +
      '<h1 class="hero-title">Развилки</h1>' +
      '<p class="hero-sub">Здесь нет правильных ответов. Каждое решение двигает шкалы ресурсов — и в конце ты получаешь свой, а не «единственно верный» исход.</p>' +
      streakHtml +
      '</section>';

    html += dailyHtml();

    html += '<div class="grid">';
    for (var i = 0; i < window.SCENARIOS.length; i++) {
      var sc = window.SCENARIOS[i];
      html += '<article class="card">' +
        '<span class="card-index">Тест ' + (i + 1) + ' / ' + window.SCENARIOS.length + '</span>' +
        '<h2 class="card-title">' + sc.title + '</h2>' +
        '<p class="card-tagline">' + sc.tagline + '</p>' +
        '<div class="card-meta">' +
        '<span class="chip">' + sc.steps.length + ' шагов</span>' +
        '<span class="chip chip-progress">Открыто концовок: ' + countOpenedEndings(sc.id) + ' из ' + sc.endings.length + '</span>';

      for (var r = 0; r < sc.resources.length; r++) {
        var rn = sc.resources[r];
        html += '<span class="chip">' + rn + ' <b>' + sc.startValues[rn] + '</b></span>';
      }

      html += '</div>' +
        '<div class="card-actions"><button class="btn" type="button" data-start="' + sc.id + '">Начать</button></div>' +
        '</article>';
    }
    html += '</div>';

    app.innerHTML = html;

    var starts = app.querySelectorAll('[data-start]');
    for (var s = 0; s < starts.length; s++) {
      starts[s].addEventListener('click', function () {
        startScenario(this.getAttribute('data-start'));
      });
    }

    if (hadState) {
      announce('Список тестов');
      focusFirst('.hero-title');
    }
  }

  // ---------- Test view ----------
  function startScenario(id, challenge) {
    var sc = findScenario(id);
    if (!sc) return;

    var validChallenge = challenge && findEnding(sc, challenge) ? challenge : null;

    var values = {};
    for (var k in sc.startValues) values[k] = sc.startValues[k];

    state = {
      scenario: sc,
      step: 0,
      values: values,
      history: [],
      failed: false,
      failedResource: null,
      lastChanged: {},
      challenge: validChallenge
    };

    navigate(sc.id, validChallenge);
    document.title = sc.title + ' — ' + SITE_NAME;
    trackGoal('test_started', sc.id);
    if (validChallenge) trackGoal('challenge_opened', sc.id);
    renderTest();
  }

  function renderTest() {
    var sc = state.scenario;
    var step = sc.steps[state.step];
    var total = sc.steps.length;

    var html = '<div class="view-head">' +
      '<h1 class="view-title">' + sc.title + '</h1>' +
      '<span class="step-counter">Шаг ' + (state.step + 1) + ' из ' + total + '</span>' +
      '</div>';

    html += resourcesHtml(state.values);

    var challenge = state.challenge ? findEnding(sc, state.challenge) : null;
    var challengeHtml = '';
    if (challenge && state.step === 0) {
      challengeHtml = '<p class="challenge-note">Друг прошёл этот тест и получил «' + challenge.title +
        '». Пройдёшь иначе?</p>';
    }

    html += '<div class="step-card">' +
      challengeHtml +
      '<p class="step-text" tabindex="-1">' + step.text + '</p>' +
      '<div class="choices">';

    for (var i = 0; i < step.choices.length; i++) {
      var choice = step.choices[i];
      var blocked = choiceBlockers(choice);

      if (blocked.length) {
        html += '<button class="choice" type="button" disabled>' + choice.text +
          '<span class="choice-reason">' + blocked[0] + '</span></button>';
      } else {
        html += '<button class="choice" type="button" data-choice="' + i + '">' + choice.text + '</button>';
      }
    }

    html += '</div></div>';

    app.innerHTML = html;

    var btns = app.querySelectorAll('[data-choice]');
    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener('click', function () {
        applyChoice(parseInt(this.getAttribute('data-choice'), 10));
      });
    }

    announce('Шаг ' + (state.step + 1) + ' из ' + total);
    focusFirst('.step-text');
  }

  function choiceBlockers(choice) {
    var reasons = [];
    if (!choice.requires) return reasons;
    for (var i = 0; i < choice.requires.length; i++) {
      var req = choice.requires[i];
      var value = state.values[req.resource] == null ? 0 : state.values[req.resource];
      if (value < req.min) {
        reasons.push(req.reason || ('Нужно минимум ' + req.min + ' «' + req.resource + '» (сейчас ' + value + ').'));
      }
    }
    return reasons;
  }

  function applyChoice(index) {
    var sc = state.scenario;
    var step = sc.steps[state.step];
    var choice = step.choices[index];
    if (!choice) return;

    playSound('choice');

    var effects = choice.effects || {};
    var deltas = [];
    state.lastChanged = {};

    for (var res in effects) {
      if (state.values[res] == null) state.values[res] = sc.startValues[res] || 0;
      state.values[res] = clampValue(state.values[res] + effects[res]);
      state.lastChanged[res] = effects[res] >= 0 ? 'up' : 'down';
      deltas.push(formatDelta(res, effects[res]));
    }

    state.history.push({
      step: state.step + 1,
      stepText: step.text,
      choiceText: choice.text,
      note: choice.note || '',
      deltas: deltas
    });

    for (var r = 0; r < sc.resources.length; r++) {
      if (state.values[sc.resources[r]] <= 0) {
        state.failed = true;
        state.failedResource = sc.resources[r];
        break;
      }
    }

    if (state.failed) {
      trackGoal('test_failed', sc.id);
      renderFail();
      return;
    }

    if (state.step + 1 >= sc.steps.length) {
      trackGoal('test_finished', sc.id);
      renderFinal();
    } else {
      state.step += 1;
      renderTest();
    }
  }

  // ---------- Final view ----------
  function pickEnding(sc, values) {
    for (var i = 0; i < sc.endings.length; i++) {
      if (sc.endings[i].test(values)) return sc.endings[i];
    }
    return sc.endings[sc.endings.length - 1];
  }

  function breakdownHtml(items) {
    var html = '<div class="breakdown">';
    for (var i = 0; i < items.length; i++) {
      var h = items[i];
      html += '<div class="breakdown-item">' +
        '<div class="breakdown-head">' +
        '<span class="breakdown-step">Шаг ' + h.step + '</span>' +
        '<span class="breakdown-choice">' + h.choiceText + '</span>' +
        '</div>';
      if (h.note) html += '<p class="breakdown-note">' + h.note + '</p>';
      html += '<span class="breakdown-delta">' + h.deltas.join(' · ') + '</span>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderFinal() {
    var sc = state.scenario;
    var ending = pickEnding(sc, state.values);
    var openedBefore = loadOpenedEndings()[sc.id];
    var wasNew = !Array.isArray(openedBefore) || openedBefore.indexOf(ending.id) === -1;
    saveOpenedEnding(sc.id, ending.id);
    var openedCount = countOpenedEndings(sc.id);
    var streak = bumpStreak();
    playSound('final');

    var challenge = state.challenge ? findEnding(sc, state.challenge) : null;
    var challengeHtml = '';
    if (challenge) {
      challengeHtml = '<p class="challenge-result">' +
        (challenge.id === ending.id
          ? 'Ты повторил исход друга — «' + challenge.title + '».'
          : 'Друг получил «' + challenge.title + '», а ты выбрал иначе.') +
        '</p>';
    }

    var html = '<div class="result-plate">' +
      '<p class="result-label">Итог</p>' +
      '<h1 class="result-title" tabindex="-1">' + ending.title + '</h1>' +
      '<p class="result-text">' + ending.text + '</p>' +
      challengeHtml +
      '</div>';

    html += resourcesHtml(state.values);

    html += '<p class="collection-note">Открыто концовок: <b>' + openedCount + ' из ' + sc.endings.length + '</b>' +
      (wasNew ? ' — эта новая!' : '') +
      (openedCount < sc.endings.length ? ' Осталось найти: ' + (sc.endings.length - openedCount) + '.' : ' Все собраны.') +
      '</p>';

    if (streak.count >= 2) {
      html += '<p class="collection-note">Серия: <b>' + streak.count + ' ' + pluralDays(streak.count) + ' подряд</b>.</p>';
    }

    html += '<h2 class="section-title">Разбор твоих ходов</h2>';
    html += breakdownHtml(state.history);

    var link = scenarioLink(sc.id, ending.id);
    var shareHtml = '';
    if (link) {
      shareHtml = '<div class="share-row">' +
        '<a class="share-btn" href="' + vkShareUrl(link, ending) + '" target="_blank" rel="noopener">ВКонтакте</a>' +
        '<a class="share-btn" href="' + tgShareUrl(link, ending) + '" target="_blank" rel="noopener">Telegram</a>' +
        '<a class="share-btn" href="' + waShareUrl(link, ending) + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '</div>';
    }

    html += '<div class="result-actions">' +
      '<button class="btn" type="button" id="copyResult">Скопировать итог для друзей</button>' +
      '<button class="btn btn-ghost" type="button" id="shareCard">Поделиться карточкой</button>' +
      '</div>';

    html += shareHtml;

    html += '<div class="result-actions">' +
      '<button class="btn btn-ghost" type="button" id="restartBtn">Пройти заново</button>' +
      '<button class="btn btn-ghost" type="button" id="toListBtn">К списку тестов</button>' +
      '</div>';

    app.innerHTML = html;

    document.title = 'Итог: ' + ending.title + ' — ' + SITE_NAME;
    announce('Итог: ' + ending.title);
    focusFirst('.result-title');

    document.getElementById('copyResult').addEventListener('click', function () {
      copyResult(this);
    });
    document.getElementById('shareCard').addEventListener('click', function () {
      shareResultCard(this);
    });
    var shares = app.querySelectorAll('.share-btn');
    for (var s = 0; s < shares.length; s++) {
      shares[s].addEventListener('click', function () {
        trackGoal('share_clicked', sc.id);
      });
    }
    document.getElementById('restartBtn').addEventListener('click', function () {
      trackGoal('test_restarted', sc.id);
      startScenario(sc.id);
    });
    document.getElementById('toListBtn').addEventListener('click', function () {
      renderMain();
    });
  }

  // ---------- Fail view ----------
  function renderFail() {
    var sc = state.scenario;
    var res = state.failedResource;
    playSound('fail');

    var html = '<div class="result-plate danger-plate">' +
      '<p class="result-label">Провал</p>' +
      '<h1 class="result-title" tabindex="-1">' + res + ' на нуле</h1>' +
      '<p class="result-text">' + (FAIL_MESSAGES[res] || 'Один из ресурсов иссяк — на этом этапе ты не вытянул.') + '</p>' +
      '</div>';

    html += resourcesHtml(state.values);

    html += '<h2 class="section-title">Как это случилось</h2>';
    html += breakdownHtml(state.history);

    html += '<div class="result-actions">' +
      '<button class="btn" type="button" id="restartBtn">Попробовать ещё раз</button>' +
      '<button class="btn btn-ghost" type="button" id="toListBtn">К списку тестов</button>' +
      '</div>';

    app.innerHTML = html;

    document.title = 'Провал — ' + SITE_NAME;
    announce('Провал: ресурс «' + res + '» на нуле');
    focusFirst('.result-title');

    document.getElementById('restartBtn').addEventListener('click', function () {
      trackGoal('test_restarted', sc.id);
      startScenario(sc.id);
    });
    document.getElementById('toListBtn').addEventListener('click', function () {
      renderMain();
    });
  }

  // ---------- Copy result ----------
  function siteLink() {
    if (location.protocol === 'file:') return '';
    try {
      if (location.origin && location.pathname) return location.origin + location.pathname;
      return location.href;
    } catch (e) {
      return '';
    }
  }

  function scenarioLink(id, challenge) {
    var base = siteLink();
    if (!base) return '';
    var link = base.split('#')[0] + '#/' + id;
    if (challenge) link += '?challenge=' + encodeURIComponent(challenge);
    return link;
  }

  function shareTitle(ending) {
    return 'Развилки — ' + ending.title;
  }

  function vkShareUrl(link, ending) {
    return 'https://vk.com/share.php?url=' + encodeURIComponent(link) +
      '&title=' + encodeURIComponent(shareTitle(ending));
  }

  function tgShareUrl(link, ending) {
    return 'https://t.me/share/url?url=' + encodeURIComponent(link) +
      '&text=' + encodeURIComponent(shareTitle(ending));
  }

  function waShareUrl(link, ending) {
    return 'https://wa.me/?text=' + encodeURIComponent(shareTitle(ending) + ': ' + link);
  }

  function buildResultText() {
    var sc = state.scenario;
    var ending = pickEnding(sc, state.values);
    var lines = [];

    lines.push('«' + sc.title + '» — ' + ending.title);

    var resLine = [];
    for (var r = 0; r < sc.resources.length; r++) {
      var name = sc.resources[r];
      resLine.push(name + ' ' + state.values[name]);
    }
    lines.push(resLine.join(' · '));

    lines.push('');
    lines.push('Мои решения:');
    for (var i = 0; i < state.history.length; i++) {
      lines.push((i + 1) + '. ' + state.history[i].choiceText);
    }

    var link = scenarioLink(sc.id, ending.id);
    if (link) {
      lines.push('');
      lines.push('Проверь свой исход: ' + link);
    }

    return lines.join('\n');
  }

  function copyResult(btn) {
    var text = buildResultText();
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;

    var done = function () {
      btn.textContent = 'Скопировано!';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = btn.dataset.label;
        btn.classList.remove('copied');
      }, 1600);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        fallbackCopy(text, done);
      });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (ok) done();
  }

  // ---------- Result card ----------
  var CARD_WIDTH = 1200;
  var CARD_HEIGHT = 630;
  var FONT_SERIF = 'Georgia, "Times New Roman", "PT Serif", serif';
  var FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  var CARD_FALLBACK = {
    light: {
      bg: '#F5F3EE', surface: '#FCFBF8', surface2: '#EDE9DF', text: '#16171A',
      muted: '#6C675D', border: '#D8D2C5', accent: '#B23A2A', accentInk: '#1F2326',
      ok: '#2F6B4F', warn: '#C48A1B', danger: '#B23A2A'
    },
    dark: {
      bg: '#16171A', surface: '#1D1F22', surface2: '#24262A', text: '#F2F0EA',
      muted: '#9B968C', border: '#34363B', accent: '#D85A43', accentInk: '#F2F0EA',
      ok: '#4E9C77', warn: '#D9A13B', danger: '#E05A44'
    }
  };

  function cssColor(styles, name, fallback) {
    var value = '';
    try { value = styles.getPropertyValue(name); } catch (e) {}
    value = value ? value.trim() : '';
    return value || fallback;
  }

  function cardColors() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var fallback = dark ? CARD_FALLBACK.dark : CARD_FALLBACK.light;
    var styles = null;
    try { styles = window.getComputedStyle(document.documentElement); } catch (e) {}
    if (!styles) return fallback;

    return {
      bg: cssColor(styles, '--bg', fallback.bg),
      surface: cssColor(styles, '--surface', fallback.surface),
      surface2: cssColor(styles, '--surface-2', fallback.surface2),
      text: cssColor(styles, '--text', fallback.text),
      muted: cssColor(styles, '--muted', fallback.muted),
      border: cssColor(styles, '--border', fallback.border),
      accent: cssColor(styles, '--accent', fallback.accent),
      accentInk: cssColor(styles, '--accent-ink', fallback.accentInk),
      ok: cssColor(styles, '--ok', fallback.ok),
      warn: cssColor(styles, '--warn', fallback.warn),
      danger: cssColor(styles, '--danger', fallback.danger)
    };
  }

  function drawRoundRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function wrapCanvasText(ctx, text, maxWidth, maxLines) {
    var words = String(text == null ? '' : text).split(/\s+/);
    var lines = [];
    var current = '';

    for (var i = 0; i < words.length; i++) {
      var test = current ? current + ' ' + words[i] : words[i];
      if (current && ctx.measureText(test).width > maxWidth) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    if (lines.length <= maxLines) return lines;

    var limited = lines.slice(0, maxLines);
    var last = limited[maxLines - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
      last = last.slice(0, -1);
    }
    limited[maxLines - 1] = last.replace(/\s+$/, '') + '…';
    return limited;
  }

  function drawResultCard(ctx, sc, ending, values) {
    var colors = cardColors();
    var W = ctx.canvas.width;
    var H = ctx.canvas.height;
    var P = 64;
    var contentW = W - P * 2;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);

    drawRoundRect(ctx, P, 52, 44, 44, 8);
    ctx.fillStyle = colors.accentInk;
    ctx.fill();

    ctx.fillStyle = colors.bg;
    ctx.font = '700 26px ' + FONT_SERIF;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Р', P + 22, 75);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = colors.text;
    ctx.font = '700 26px ' + FONT_SERIF;
    ctx.fillText('Развилки', P + 60, 58);

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P, 124);
    ctx.lineTo(W - P, 124);
    ctx.stroke();

    ctx.fillStyle = colors.accent;
    ctx.font = '700 14px ' + FONT_SANS;
    ctx.fillText('ИТОГ ТЕСТА', P, 156);

    var scenarioLines = wrapCanvasText(ctx, sc.title, contentW, 1);
    ctx.fillStyle = colors.muted;
    ctx.font = '600 22px ' + FONT_SANS;
    ctx.fillText(scenarioLines[0] || '', P, 182);

    var titleTop = 224;
    var titleLineHeight = 54;
    ctx.font = '700 46px ' + FONT_SERIF;
    var titleLines = wrapCanvasText(ctx, ending.title, contentW, 2);
    ctx.fillStyle = colors.text;
    for (var i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], P, titleTop + i * titleLineHeight);
    }

    var descTop = titleTop + titleLines.length * titleLineHeight + 14;
    var descLineHeight = 30;
    ctx.font = '400 21px ' + FONT_SANS;
    var descLines = wrapCanvasText(ctx, ending.text, contentW, 3);
    ctx.fillStyle = colors.muted;
    for (i = 0; i < descLines.length; i++) {
      ctx.fillText(descLines[i], P, descTop + i * descLineHeight);
    }

    var resTop = Math.max(descTop + descLines.length * descLineHeight + 26, 452);
    var gap = 24;
    var cardW = (contentW - gap * 2) / 3;
    var cardH = 108;

    for (i = 0; i < sc.resources.length; i++) {
      var name = sc.resources[i];
      var value = values[name] == null ? 0 : values[name];
      var x = P + i * (cardW + gap);
      var levelColor = colors.ok;
      if (value <= 15) levelColor = colors.danger;
      else if (value < 35) levelColor = colors.warn;

      drawRoundRect(ctx, x, resTop, cardW, cardH, 12);
      ctx.fillStyle = colors.surface;
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = colors.muted;
      ctx.font = '700 12px ' + FONT_SANS;
      ctx.fillText(name.toUpperCase(), x + 20, resTop + 18);

      ctx.fillStyle = levelColor;
      ctx.font = '700 34px ' + FONT_SERIF;
      ctx.fillText(String(value), x + 20, resTop + 40);

      var trackX = x + 20;
      var trackY = resTop + cardH - 26;
      var trackW = cardW - 40;

      drawRoundRect(ctx, trackX, trackY, trackW, 8, 4);
      ctx.fillStyle = colors.surface2;
      ctx.fill();

      var fillW = clampValue(value) / 100 * trackW;
      if (fillW > 0) {
        drawRoundRect(ctx, trackX, trackY, fillW, 8, 4);
        ctx.fillStyle = levelColor;
        ctx.fill();
      }
    }

    ctx.fillStyle = colors.accent;
    ctx.font = '700 18px ' + FONT_SANS;
    ctx.fillText('ПРОВЕРЬ СВОЙ ИСХОД · RAZVILKI.VERCEL.APP', P, 584);
  }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(',');
    var mimeMatch = parts[0].match(/:(.*?);/);
    var mime = mimeMatch ? mimeMatch[1] : 'image/png';
    var binary = atob(parts[1]);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function buildResultCard(sc, ending, values) {
    try {
      var canvas = document.createElement('canvas');
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      var ctx = canvas.getContext('2d');
      if (!ctx) return null;

      drawResultCard(ctx, sc, ending, values);
      return dataUrlToBlob(canvas.toDataURL('image/png'));
    } catch (e) {
      return null;
    }
  }

  function downloadBlob(blob, filename) {
    try {
      if (window.URL && window.URL.createObjectURL) {
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { window.URL.revokeObjectURL(url); }, 1000);
        return;
      }
    } catch (e) {}

    try {
      var reader = new FileReader();
      reader.onload = function () {
        var link = document.createElement('a');
        link.href = reader.result;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsDataURL(blob);
    } catch (e) {}
  }

  function canShareFiles(file) {
    if (!navigator.share) return false;
    if (!navigator.canShare) return true;
    try {
      return navigator.canShare({ files: [file] });
    } catch (e) {
      return false;
    }
  }

  function shareResultCard(btn) {
    if (!state || !btn) return;

    var sc = state.scenario;
    var ending = pickEnding(sc, state.values);
    trackGoal('share_clicked', sc.id);
    var values = state.values;
    var shareText = buildResultText();
    var filename = 'razvilki-' + sc.id + '-' + (ending.id || 'result') + '.png';
    var blob = buildResultCard(sc, ending, values);

    if (!blob) {
      var original = btn.textContent;
      btn.textContent = 'Не удалось создать';
      btn.classList.add('is-error');
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove('is-error');
      }, 1800);
      return;
    }

    var file = null;
    try {
      if (window.File) file = new File([blob], filename, { type: 'image/png' });
    } catch (e) {
      file = null;
    }

    if (file && canShareFiles(file)) {
      try {
        btn.disabled = true;
        navigator.share({
          files: [file],
          title: 'Развилки — ' + ending.title,
          text: shareText
        }).then(function () {
          btn.disabled = false;
        }, function (err) {
          btn.disabled = false;
          if (err && err.name === 'AbortError') return;
          downloadBlob(blob, filename);
        });
        return;
      } catch (e) {
        btn.disabled = false;
      }
    }

    downloadBlob(blob, filename);
  }

  window.addEventListener('hashchange', function () {
    if (!window.SCENARIOS || !window.SCENARIOS.length) return;
    var route = parseRoute();
    if (!route.id) {
      if (state) renderMain();
      return;
    }
    if (!findScenario(route.id)) {
      renderMain();
      return;
    }
    if (state && state.scenario.id === route.id && state.challenge === route.challenge) return;
    startScenario(route.id, route.challenge);
  });

  initTheme();
  initSound();

  var initialRoute = parseRoute();
  if (initialRoute.id && window.SCENARIOS && findScenario(initialRoute.id)) {
    startScenario(initialRoute.id, initialRoute.challenge);
  } else {
    renderMain();
  }
})();

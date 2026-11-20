(function () {
  'use strict';

  var METRIKA_ID = 114394691;

  var app = document.getElementById('app');
  var themeToggle = document.getElementById('themeToggle');
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
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('razvilki_theme'); } catch (e) {}
    applyTheme(saved === 'dark' ? 'dark' : 'light');
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

  // ---------- Analytics ----------
  function trackGoal(name) {
    if (typeof ym === 'function') {
      try { ym(METRIKA_ID, 'reachGoal', name); } catch (e) {}
    }
  }

  // ---------- Helpers ----------
  function clampBar(value) {
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

  function resourcesHtml(values) {
    var res = state.scenario.resources;
    var html = '<div class="resources">';
    for (var i = 0; i < res.length; i++) {
      var name = res[i];
      var value = values[name] == null ? 0 : values[name];
      var level = barLevel(value);
      html += '<div class="resource ' + level + '">' +
        '<div class="resource-head"><span class="resource-name">' + name + '</span>' +
        '<span class="resource-value">' + value + '</span></div>' +
        '<div class="resource-track"><div class="resource-fill" style="width:' + clampBar(value) + '%"></div></div>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  // ---------- Main screen ----------
  function renderMain() {
    state = null;
    var html = '<section class="hero">' +
      '<p class="hero-kicker">Интерактивные тесты-симуляторы</p>' +
      '<h1 class="hero-title">Развилки</h1>' +
      '<p class="hero-sub">Здесь нет правильных ответов. Каждое решение двигает шкалы ресурсов — и в конце ты получаешь свой, а не «единственно верный» исход.</p>' +
      '</section>';

    html += '<div class="grid">';
    for (var i = 0; i < window.SCENARIOS.length; i++) {
      var sc = window.SCENARIOS[i];
      html += '<article class="card">' +
        '<span class="card-index">Тест ' + (i + 1) + ' / ' + window.SCENARIOS.length + '</span>' +
        '<h2 class="card-title">' + sc.title + '</h2>' +
        '<p class="card-tagline">' + sc.tagline + '</p>' +
        '<div class="card-meta">' +
        '<span class="chip">' + sc.steps.length + ' шагов</span>';

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
  }

  // ---------- Test view ----------
  function startScenario(id) {
    var sc = findScenario(id);
    if (!sc) return;

    var values = {};
    for (var k in sc.startValues) values[k] = sc.startValues[k];

    state = {
      scenario: sc,
      step: 0,
      values: values,
      history: [],
      failed: false,
      failedResource: null
    };

    trackGoal('test_started');
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

    html += '<div class="step-card">' +
      '<p class="step-text">' + step.text + '</p>' +
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

    var effects = choice.effects || {};
    var deltas = [];

    for (var res in effects) {
      if (state.values[res] == null) state.values[res] = sc.startValues[res] || 0;
      state.values[res] += effects[res];
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
      trackGoal('test_finished');
      renderFail();
      return;
    }

    if (state.step + 1 >= sc.steps.length) {
      trackGoal('test_finished');
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

  function renderFinal() {
    var sc = state.scenario;
    var ending = pickEnding(sc, state.values);

    var html = '<div class="result-plate">' +
      '<p class="result-label">Итог</p>' +
      '<h1 class="result-title">' + ending.title + '</h1>' +
      '<p class="result-text">' + ending.text + '</p>' +
      '</div>';

    html += resourcesHtml(state.values);

    html += '<h2 class="section-title">Разбор твоих ходов</h2>';
    html += '<div class="breakdown">';

    for (var i = 0; i < state.history.length; i++) {
      var h = state.history[i];
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

    html += '<div class="result-actions">' +
      '<button class="btn" type="button" id="copyResult">Скопировать итог для друзей</button>' +
      '</div>';

    html += '<div class="yandex-slot" id="yandex_rtb_result" aria-hidden="true">Рекламный блок</div>';

    html += '<div class="result-actions">' +
      '<button class="btn btn-ghost" type="button" id="restartBtn">Пройти заново</button>' +
      '<button class="btn btn-ghost" type="button" id="toListBtn">К списку тестов</button>' +
      '</div>';

    app.innerHTML = html;

    document.getElementById('copyResult').addEventListener('click', function () {
      copyResult(this);
    });
    document.getElementById('restartBtn').addEventListener('click', function () {
      trackGoal('test_restarted');
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

    var html = '<div class="result-plate danger-plate">' +
      '<p class="result-label">Провал</p>' +
      '<h1 class="result-title">' + res + ' на нуле</h1>' +
      '<p class="result-text">' + (FAIL_MESSAGES[res] || 'Один из ресурсов иссяк — на этом этапе ты не вытянул.') + '</p>' +
      '</div>';

    html += resourcesHtml(state.values);

    html += '<h2 class="section-title">Как это случилось</h2>';
    html += '<div class="breakdown">';

    for (var i = 0; i < state.history.length; i++) {
      var h = state.history[i];
      html += '<div class="breakdown-item">' +
        '<div class="breakdown-head">' +
        '<span class="breakdown-step">Шаг ' + h.step + '</span>' +
        '<span class="breakdown-choice">' + h.choiceText + '</span>' +
        '</div>' +
        '<span class="breakdown-delta">' + h.deltas.join(' · ') + '</span>' +
        '</div>';
    }

    html += '</div>';

    html += '<div class="result-actions">' +
      '<button class="btn" type="button" id="restartBtn">Попробовать ещё раз</button>' +
      '<button class="btn btn-ghost" type="button" id="toListBtn">К списку тестов</button>' +
      '</div>';

    app.innerHTML = html;

    document.getElementById('restartBtn').addEventListener('click', function () {
      trackGoal('test_restarted');
      startScenario(sc.id);
    });
    document.getElementById('toListBtn').addEventListener('click', function () {
      renderMain();
    });
  }

  // ---------- Copy result ----------
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

    return lines.join('\n');
  }

  function copyResult(btn) {
    var text = buildResultText();

    var done = function () {
      var old = btn.textContent;
      btn.textContent = 'Скопировано!';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = old;
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

  initTheme();
  renderMain();
})();

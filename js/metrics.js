/* ============================================================
   ATLAS HEALTH — Live Metrics
   5 велнес-метрик + кольцо общего статуса + контекстный narrative.
   Каждая метрика рассчитывается детерминированно из времени суток
   и известных событий дня (имитация wearables).
   ============================================================ */

(function(){
  'use strict';

  // Кривая «дневной энергии» — нормализованная 0-100, по часам
  // Пик в 10 и 16, спады в 14 и 22
  const ENERGY_CURVE = {
     6: 35,  7: 55,  8: 70,  9: 82, 10: 90, 11: 85,
    12: 70, 13: 55, 14: 60, 15: 75, 16: 88, 17: 82,
    18: 70, 19: 65, 20: 55, 21: 45, 22: 32, 23: 22, 24: 18
  };

  // Кривая фокуса — производное от энергии, спадает быстрее после обеда
  function focusAt(h){
    const e = energyAt(h);
    // Фокус падает сильнее при спадах
    if (h >= 13 && h < 15) return Math.round(e * 0.78);
    if (h >= 20) return Math.round(e * 0.6);
    return e;
  }

  function energyAt(h){
    const h0 = Math.floor(h);
    const h1 = Math.min(24, h0 + 1);
    const t = h - h0;
    const v0 = ENERGY_CURVE[h0] != null ? ENERGY_CURVE[h0] : ENERGY_CURVE[24];
    const v1 = ENERGY_CURVE[h1] != null ? ENERGY_CURVE[h1] : v0;
    return Math.round(v0 * (1-t) + v1 * t);
  }

  // Пульс — зависит от активности и времени суток
  // База 60 (ночь), 65 (утро), пики после еды/тренировки
  function heartAt(h){
    let base = 62;
    if (h >= 6 && h < 10) base = 68;
    else if (h >= 10 && h < 13) base = 74;
    else if (h >= 13 && h < 15) base = 80;  // после обеда
    else if (h >= 15 && h < 18) base = 72;
    else if (h >= 18 && h < 22) base = 70;
    else if (h >= 22 || h < 6) base = 58;
    // Пики на событиях (из MOOD/EVENTS)
    if (h >= 12 && h < 13) base += 18;  // силовая
    if (h >= 17 && h < 18) base += 12;  // прогулка
    return base;
  }

  // Накопленная нагрузка за день (у.е.) — Strain-метрика Whoop
  function loadAt(h){
    if (h < 6) return 0;
    // Каждый час прибавляется, спады/еда — спады, тренировка — пик
    let load = 0;
    const start = 6;
    const end = Math.min(h, 24);
    for (let hr = start; hr < end; hr++){
      if (hr >= 8 && hr < 12) load += 35;       // рабочее утро
      else if (hr >= 12 && hr < 13) load += 95; // тренировка
      else if (hr >= 13 && hr < 14) load += 25; // восстановление
      else if (hr >= 14 && hr < 17) load += 40; // рабочий день
      else if (hr >= 17 && hr < 18) load += 50; // прогулка
      else if (hr >= 18 && hr < 22) load += 30; // вечер
      else load += 15;
    }
    return Math.round(load);
  }

  // Гидратация (0-100, цель 100% = 2л). Падает ~5%/час, растёт в часы еды/питья
  function hydrationAt(h){
    let v = 95;  // старт дня — наполнен
    const start = 6;
    const end = Math.min(h, 24);
    for (let hr = start; hr < end; hr++){
      v -= 4.5;  // падение
      if (hr === 8 || hr === 11 || hr === 14 || hr === 17 || hr === 20) v += 22;  // приёмы жидкости
      if (hr === 12) v += 8; // обед
    }
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  // Кофеин в крови (мг). T½ ~ 5ч, метаболизируется
  function caffeineAt(h){
    if (h < 6) return 0;
    // Предположим: кофе в 7, 9, 14 (по 80мг)
    const intakes = [
      { at: 7,  mg: 80 },
      { at: 9,  mg: 80 },
      { at: 14, mg: 60 }
    ];
    let total = 0;
    for (const i of intakes){
      if (h >= i.at){
        const hoursAgo = h - i.at;
        total += i.mg * Math.pow(0.5, hoursAgo / 5);
      }
    }
    return Math.round(total);
  }

  // Шаги нарастающим итогом
  function stepsAt(h){
    if (h < 6) return 0;
    const end = Math.min(h, 24);
    let total = 0;
    for (let hr = 6; hr < end; hr++){
      let perHour = 0;
      if (hr >= 7 && hr < 9) perHour = 350;       // утренняя активность
      else if (hr >= 9 && hr < 12) perHour = 600;  // работа/ходьба
      else if (hr >= 12 && hr < 13) perHour = 200; // обед
      else if (hr >= 13 && hr < 17) perHour = 550; // дневная активность
      else if (hr >= 17 && hr < 18) perHour = 900; // прогулка
      else if (hr >= 18 && hr < 22) perHour = 250; // вечер
      else perHour = 50;
      total += perHour;
    }
    return Math.round(total);
  }

  // Сидячее время за день (часы)
  function sittingAt(h){
    if (h < 6) return 0;
    let sit = 0;
    const end = Math.min(h, 24);
    for (let hr = 6; hr < end; hr++){
      if (hr >= 9 && hr < 12) sit += 0.8;       // работа
      else if (hr >= 13 && hr < 17) sit += 0.7; // работа
      else if (hr >= 19 && hr < 22) sit += 0.5; // вечер
      else sit += 0.1;
    }
    return Math.round(sit * 10) / 10;
  }

  // Настроение (0-100) — берём из timeline.js если есть, иначе симулируем
  // Эта версия — fallback, реальное значение передаётся снаружи
  function defaultMoodAt(h){
    const h0 = Math.floor(h);
    const base = {
       6:60, 7:70, 8:75, 9:80, 10:82, 11:75,
      12:65, 13:50, 14:58, 15:72, 16:85, 17:80,
      18:75, 19:72, 20:65, 21:55, 22:45, 23:35, 24:25
    };
    return base[h0] || 50;
  }

  // Обобщённый статус (0-100) — комбинация mood + energy + focus
  function overallStatus(mood, energy, focus){
    return Math.round(mood * 0.35 + energy * 0.4 + focus * 0.25);
  }

  // Текстовая подпись под кольцом («готов», «пик», «спад»)
  // Контекстная подпись под кольцом: к чему конкретно относится статус
  // nextEvent — {label, minutesUntil} ближайшего события
  function statusLabel(status, h, nextEvent){
    const timeOfDay = h < 9 ? 'к утру' : h < 12 ? 'к обеду' : h < 14 ? 'к фокусу' : h < 17 ? 'к пику' : h < 20 ? 'к вечеру' : h < 22 ? 'ко сну' : 'к отдыху';

    // Если есть ближайшее событие — относим готовность к нему
    if (nextEvent && nextEvent.minutesUntil != null && nextEvent.minutesUntil <= 180){
      const ev = (nextEvent.label || '').toLowerCase();
      let obj = null;
      if (ev.indexOf('завтрак') >= 0) obj = 'завтраку';
      else if (ev.indexOf('обед') >= 0) obj = 'обеду';
      else if (ev.indexOf('ужин') >= 0) obj = 'ужину';
      else if (ev.indexOf('силов') >= 0 || ev.indexOf('тренир') >= 0) obj = 'тренировке';
      else if (ev.indexOf('прогулк') >= 0) obj = 'прогулке';
      else if (ev.indexOf('сон') >= 0 || ev.indexOf('рутин') >= 0 || ev.indexOf('ветинг') >= 0) obj = 'сну';
      else if (ev.indexOf('check') >= 0 || ev.indexOf('check-in') >= 0) obj = 'чек-ину';
      if (obj){
        if (status >= 80) return 'к ' + obj;
        if (status >= 65) return 'к ' + obj;
        if (status >= 50) return 'норм к ' + obj;
        if (status >= 35) return 'спад к ' + obj;
        return 'тяжело к ' + obj;
      }
    }

    // Без контекста события — общее
    if (h >= 22 || h < 6) return 'отдых';
    if (status >= 80) return 'пик';
    if (status >= 65) return 'готов';
    if (status >= 50) return 'норма';
    if (status >= 35) return 'спад';
    return 'тяжело';
  }

  // Дельта к предыдущему часу — для подписей вроде «↑+6 за час»
  function delta(prev, curr, scale){
    scale = scale || 1;
    const d = Math.round((curr - prev) * scale);
    if (d > 2) return { dir:'up', val:'+'+d };
    if (d < -2) return { dir:'down', val:''+d };
    return { dir:'flat', val:'0' };
  }

  // Narrative — короткая фраза о моменте
  function narrative(metrics, h){
    if (h < 7)  return 'Пробуждение. Готовность растёт.';
    if (h >= 9 && h < 12){
      if (metrics.energy >= 80) return 'Пик утра. Время для важных задач.';
      return 'Утро. Набирай темп.';
    }
    if (h >= 12 && h < 14){
      if (metrics.energy < 65) return 'Спад после обеда — норма. Лёгкое движение вернёт тонус.';
      return 'Середина дня.';
    }
    if (h >= 14 && h < 17) return 'Пик дня. Лучшее время для фокуса.';
    if (h >= 17 && h < 20) return 'Спад. Переключись на лёгкое.';
    if (h >= 20 && h < 22){
      if (metrics.caffeine > 50) return 'Кофеин ещё в крови — повлияет на засыпание.';
      return 'Подготовка ко сну.';
    }
    if (h >= 22) return 'Время спать.';
    return '';
  }

  // ====== Главная функция ======
  function metricsAt(h, externalMood, nextEvent){
    const hClamped = Math.max(0, Math.min(24, h));
    const mood = (externalMood != null) ? externalMood : defaultMoodAt(hClamped);
    const energy = energyAt(hClamped);
    const focus  = focusAt(hClamped);
    const status = overallStatus(mood, energy, focus);

    // Сравнение с предыдущим часом
    const prevH = Math.max(0, hClamped - 1);
    const prevEnergy = energyAt(prevH);

    return {
      mood: Math.round(mood),
      energy: energy,
      focus: focus,
      heart: heartAt(hClamped),
      load: loadAt(hClamped),
      hydration: hydrationAt(hClamped),
      caffeine: caffeineAt(hClamped),
      steps: stepsAt(hClamped),
      sitting: sittingAt(hClamped),
      status: status,
      statusLabel: statusLabel(status, hClamped, nextEvent),
      energyDelta: delta(prevEnergy, energy),
      hydrationWarn: hydrationAt(hClamped) < 50,
      caffeineWarn: caffeineAt(hClamped) > 100,
      loadPeak: loadAt(hClamped) > 300,
      narrative: ''
    };
  }

  // Заполняем narrative после расчёта остальных метрик
  function withNarrative(m){
    m.narrative = narrative(m, m._h || 12);
    return m;
  }

  // ====== PUBLIC API ======
  window.AtlasMetrics = {
    metricsAt,
    withNarrative,
    energyAt, focusAt, heartAt, loadAt,
    hydrationAt, caffeineAt, stepsAt, sittingAt,
    defaultMoodAt, overallStatus, statusLabel
  };
})();

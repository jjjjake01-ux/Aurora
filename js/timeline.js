(function(){
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_W = 700;
  const SVG_H = 180;
  const TL_LEFT_PAD = 6;
  const TL_RIGHT_PAD = 18;
  let DAY_START = 6;
  let DAY_END = 24;
  const FULL_DAY_START = 6;
  const FULL_DAY_END = 24;

  // ============================================================
  // MOOD CURVE — эмоциональный ландшафт дня
  // ============================================================
  const MOOD = [
    { h:6,    v:60, label:'сон',         state:'rest' },
    { h:7,    v:75, label:'восстановление', state:'good' },
    { h:8,    v:80, label:'бодро',         state:'good' },
    { h:9,    v:85, label:'отлично',       state:'good' },
    { h:10,   v:78, label:'хорошо',        state:'good' },
    { h:11,   v:72, label:'норма',         state:'warn' },
    { h:12,   v:55, label:'нагрузка',      state:'load' },
    { h:13,   v:42, label:'тяжело',        state:'bad'  },
    { h:14,   v:62, label:'восстановление',state:'good' },
    { h:15,   v:78, label:'хорошо',        state:'good' },
    { h:16,   v:88, label:'пик',           state:'good' },
    { h:17,   v:85, label:'отлично',       state:'good' },
    { h:18,   v:72, label:'хорошо',        state:'good' },
    { h:19,   v:80, label:'хорошо',        state:'good' },
    { h:20,   v:75, label:'норма',         state:'warn' },
    { h:21,   v:60, label:'спад',          state:'warn' },
    { h:22,   v:42, label:'усталость',     state:'bad'  },
    { h:23,   v:30, label:'тяжело',        state:'bad'  },
    { h:24,   v:25, label:'сон',           state:'rest' }
  ];

  // События — теперь с явной стороной (top/bottom) и набором иконок
  const EVENTS = [
    { id:'sleep-am',  start:6,    end:8,    label:'Сон',         side:'top',    icon:'moon' },
    { id:'wake',     start:8.5,         label:'Подъём',     side:'top',    icon:'sunrise' },
    { id:'meal-b',   start:9,            label:'Завтрак',    side:'top',    icon:'meal' },
    { id:'workout',  start:12,    end:13,  label:'Силовая',    side:'bottom', icon:'workout' },
    { id:'meal-l',   start:14,          label:'Обед',       side:'top',    icon:'meal' },
    { id:'checkin',  start:16,          label:'Check-in',   side:'top',    icon:'heart' },
    { id:'walk',     start:17,          label:'Прогулка',   side:'bottom', icon:'walk' },
    { id:'meal-d',   start:19,          label:'Ужин',       side:'top',    icon:'meal' },
    { id:'winddown', start:21,          label:'Рутина',     side:'bottom', icon:'wind' },
    { id:'sleep-pm', start:22.5,        label:'Сон',         side:'bottom', icon:'moon' }
  ];

  const METRICS = {
    energy: { 6:60, 9:78, 12:75, 15:62, 18:75, 21:65, 24:45 },
    steps:  { 6:0,  9:1200, 12:2400, 15:4200, 18:6800, 21:8400, 24:9200 }
  };

  const STATE_COLORS = {
    good: '#2FBF9B',
    load: '#F0764B',
    warn: '#F2A037',
    bad:  '#D06552',
    rest: '#7B74D6'
  };

  const EVENT_ICON = {
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    sunrise: '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v6"/><path d="M4.22 10.22l1.42 1.42"/><path d="M1 18h2"/><path d="M21 18h2"/><path d="M18.36 11.64l1.42-1.42"/><path d="M8 6l4-4 4 4"/><path d="M2 22h20"/>',
    moon:    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    meal:    '<path d="M3 2v8a4 4 0 0 0 8 0V2"/><path d="M7 2v20"/><path d="M16 11h2a3 3 0 0 1 0 6h-2v-6z"/><path d="M16 17v5"/>',
    workout: '<path d="M6.5 6.5h11v11h-11z"/><path d="M3.5 9.5v5M20.5 9.5v5M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3"/>',
    heart:   '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    walk:    '<circle cx="13" cy="4" r="2"/><path d="M5 22l3-7 3-2-2-4 4-2 2 4 3 2"/><path d="M14 18l-3-3"/>',
    wind:    '<path d="M3 8h12a3 3 0 1 0-3-3"/><path d="M3 16h16a3 3 0 1 1-3 3"/><path d="M3 12h9"/>'
  };

  const NOW = new Date();
  const pad2 = n => n<10 ? '0'+n : ''+n;
  const hoursNow = () => NOW.getHours() + NOW.getMinutes()/60;
  const fmtTime = h => pad2(Math.floor(h))+':'+pad2(Math.round((h-Math.floor(h))*60));
  const xFromHour = h => TL_LEFT_PAD + ((h-DAY_START)/(DAY_END-DAY_START))*(SVG_W - TL_LEFT_PAD - TL_RIGHT_PAD);
  const hourFromX = x => {
    const t = (x - TL_LEFT_PAD)/(SVG_W - TL_LEFT_PAD - TL_RIGHT_PAD);
    const h = DAY_START + t*(DAY_END-DAY_START);
    return Math.max(DAY_START, Math.min(DAY_END, h));
  };

  // === ZOOM STATE (pinch-to-zoom на шкале) ===
  // zoom = 1.0 → весь день (6-24), zoom = 4.0 → 4.5ч
  // zoomCenter — час, который остаётся в центре экрана при зуме
  let ZOOM = 1.0;
  let ZOOM_CENTER = 12;
  function applyZoom(){
    const svg = document.querySelector('.timeline-svg');
    if (!svg) return;
    // Видимая ширина в SVG-юнитах = SVG_W / zoom
    const visW = SVG_W / ZOOM;
    const cx = xFromHour(ZOOM_CENTER);
    const vbX = cx - visW/2;
    svg.setAttribute('viewBox', `${vbX} 0 ${visW} 200`);
  }
  function setZoom(zoom, centerHour){
    ZOOM = Math.max(1, Math.min(6, zoom));
    if (centerHour != null) ZOOM_CENTER = Math.max(DAY_START, Math.min(DAY_END, centerHour));
    applyZoom();
    // Перепаковываем и перерисовываем события с учётом нового масштаба
    const svg = document.querySelector('.timeline-svg');
    if (svg){
      const gTop = document.getElementById('tlEventsTopInner');
      const gBot = document.getElementById('tlEventsBottomInner');
      if (gTop) gTop.innerHTML = '';
      if (gBot) gBot.innerHTML = '';
      renderEvents(svg, ZOOM);
    }
    const axis = document.getElementById('timelineAxis');
    if (axis) axis.classList.toggle('is-zoomed', ZOOM > 1.05);
  }

  // ===== Период дня (Утро / День / Вечер / Ночь) =====
  const PERIODS = {
    day:     { start:  6, end: 24, label: 'Весь день' },
    morning: { start:  6, end: 12, label: 'Утро' },
    daypart: { start: 12, end: 17, label: 'День' },
    evening: { start: 17, end: 22, label: 'Вечер' },
    night:   { start: 22, end: 24, label: 'Ночь' }
  };
  let ACTIVE_PERIOD = 'day';
let PERIOD_MODE = false;

  function applyPeriod(periodKey){
      const period = PERIODS[periodKey] || PERIODS.day;
      ACTIVE_PERIOD = periodKey;
      PERIOD_MODE = (periodKey !== 'day');

      if (PERIOD_MODE){
        DAY_START = period.start;
        DAY_END   = period.end;
      } else {
        DAY_START = FULL_DAY_START;
        DAY_END   = FULL_DAY_END;
      }

      // 1) Сбрасываем viewBox на полный
      const svg = document.querySelector('.timeline-svg');
      if (svg){
        svg.setAttribute('viewBox', `0 0 ${SVG_W} 200`);
        ZOOM = 1;
      }
      // 2) Перерисовываем события с фильтром по периоду
      const gTop = document.getElementById('tlEventsTopInner');
      const gBot = document.getElementById('tlEventsBottomInner');
      if (gTop) gTop.innerHTML = '';
      if (gBot) gBot.innerHTML = '';
      if (svg){
        renderMoodPath(svg);
        renderTodLabels(svg);
        renderEvents(svg, 1, period);
      }
      // 3) Scrubber → на текущий час (если в окне) или центр периода
      const nowH = hoursNow();
      const focus = (nowH >= period.start && nowH <= period.end) ? nowH : (period.start + period.end) / 2;
      setMomentHour(focus, true);
      // 4) Edge labels под период
      updateEdgeLabels(period);
      // 5) UI: подсветка чипа
      document.querySelectorAll('.th-period').forEach(b => {
        const isActive = b.dataset.period === periodKey;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      // 6) Убираем is-zoomed (period — отдельный режим)
      const axis = document.getElementById('timelineAxis');
      if (axis) axis.classList.remove('is-zoomed');
    }

  function updateEdgeLabels(period){
    const left = document.querySelector('.timeline-edge-l');
    const center = document.querySelector('.timeline-edge-c');
    const right = document.querySelector('.timeline-edge-r');
    if (!left || !center || !right) return;
    left.textContent   = pad2(Math.floor(period.start));
    center.textContent = pad2(Math.floor((period.start + period.end) / 2));
    right.textContent  = pad2(Math.floor(period.end));
  }
  const el = (n, a, t) => {
    const e = document.createElementNS(SVG_NS, n);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    if (t != null) e.textContent = t;
    return e;
  };

  // Маппинг mood value (0-100) в Y-координату: 0 → 150 (низ), 100 → 30 (верх)
  const moodY = v => 30 + ((100 - v) / 100) * 120;
  const clampY = y => Math.max(28, Math.min(155, y));

  // Ширина pill-карточки: иконка + время. Лейблы убраны — события в часовом диапазоне
  // и так очевидны, иначе пилюли склеиваются в стеки.
  const PILL_W = 44;
  const PILL_H = 30;
  const PILL_GAP = 8;
  const PILL_ROW_H = 28;

  // Минимальный горизонтальный зазор между карточками на стороне (в SVG-юнитах).
  // Если два события ближе — склеиваем в стек (counter "+N").
  // PILL_W=44 шире 1 часа (37.5), поэтому плотные часы корректно склеиваются в стек,
  // а popover разворачивает список.
  const STACK_THRESHOLD = 50;

  // Сгруппировать события по стороне (top/bottom), упаковать в строки и стеки.
  // visualScale = 1.0 в обычном режиме, > 1.0 при зуме — пороги сжаты.
  function packEvents(visualScale, eventsSrc){
    visualScale = visualScale || 1;
    const src = eventsSrc || EVENTS;
    const stackThreshold = STACK_THRESHOLD / visualScale; // при зуме порог меньше
    function pack(list){
      // 1) Сортируем по X
      const sorted = list.slice().sort((a,b) => a.x - b.x);
      // 2) Группируем в стеки
      const stacks = [];
      let cur = null;
      sorted.forEach(ev => {
        if (!cur || (ev.x - cur.lastX) < stackThreshold){
          if (!cur){ cur = { items: [], lastX: ev.x }; stacks.push(cur); }
          ev.stack = cur.items.length;
          cur.items.push(ev);
          cur.lastX = ev.x;
        } else {
          cur = { items: [ev], lastX: ev.x };
          ev.stack = 0;
          stacks.push(cur);
        }
      });
      // 3) Bounding box каждого стека
      const packItems = stacks.map(s => {
        const xMin = s.items[0].x;
        const xMax = s.items[s.items.length-1].x;
        const xCenter = (xMin + xMax) / 2;
        const w = Math.max(PILL_W, xMax - xMin + PILL_W);
        return { x:xCenter, w, stack:s, items:s.items };
      });
      // 4) Pack по строкам
      const rows = [];
      packItems.forEach(p => {
        const left  = p.x - p.w/2;
        const right = p.x + p.w/2;
        let placed = false;
        for (let r=0; r<rows.length; r++){
          const lastRight = rows[r].lastRight;
          if (left - lastRight >= PILL_GAP){
            p.row = r;
            rows[r].lastRight = right;
            rows[r].push(p);
            placed = true;
            break;
          }
        }
        if (!placed){
          p.row = rows.length;
          const row = [p];
          row.lastRight = right;
          rows.push(row);
        }
      });
      packItems.forEach(p => {
        p.items.forEach(ev => { ev.row = p.row; });
      });
      return { list, stacks, packItems, rows };
    }

    const tops = src.filter(e => e.side === 'top').map(e => ({...e, x: xFromHour(e.start)}));
    const bots = src.filter(e => e.side === 'bottom').map(e => ({...e, x: xFromHour(e.start)}));
    return { top: pack(tops), bottom: pack(bots) };
  }

  function greetingForHour(h){
    if (h>=5 && h<12)  return { text:'Доброе утро',  icon:'sunrise', color:'#F2C037' };
    if (h>=12 && h<17) return { text:'Добрый день',  icon:'sun',     color:'#F2A037' };
    if (h>=17 && h<22) return { text:'Добрый вечер', icon:'sunset',  color:'#E5677E' };
    return                    { text:'Доброй ночи', icon:'moon',    color:'#7B74D6' };
  }
  function periodForHour(h){
    if (h>=5 && h<8)   return 'dawn';
    if (h>=8 && h<11)  return 'morning';
    if (h>=11 && h<16) return 'day';
    if (h>=16 && h<19) return 'sunset';
    if (h>=19 && h<22) return 'evening';
    return 'night';
  }

  const ICONS = {
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    sunrise: '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v6"/><path d="M4.22 10.22l1.42 1.42"/><path d="M1 18h2"/><path d="M21 18h2"/><path d="M18.36 11.64l1.42-1.42"/><path d="M8 6l4-4 4 4"/><path d="M2 22h20"/>',
    sunset:  '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 9V2"/><path d="M4.22 10.22l1.42 1.42"/><path d="M1 18h2"/><path d="M21 18h2"/><path d="M18.36 11.64l1.42-1.42"/><path d="M16 5l-4 4-4-4"/><path d="M2 22h20"/>',
    moon:    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
  };

  function metricAt(metric, h){
    const keys = Object.keys(METRICS[metric]).map(Number).sort((a,b)=>a-b);
    let prev = keys[0], next = keys[keys.length-1];
    for (const k of keys){
      if (k <= h) prev = k;
      if (k >= h){ next = k; break; }
    }
    if (prev === next) return METRICS[metric][prev];
    const t = (h - prev) / (next - prev);
    return Math.round(METRICS[metric][prev]*(1-t) + METRICS[metric][next]*t);
  }

  function moodAt(h){
    let prev = MOOD[0], next = MOOD[MOOD.length-1];
    for (let i=0; i<MOOD.length-1; i++){
      if (MOOD[i].h <= h && MOOD[i+1].h >= h){
        prev = MOOD[i]; next = MOOD[i+1]; break;
      }
    }
    if (prev === next){
      return { h, v:prev.v, label:prev.label, state:prev.state };
    }
    const t = (h - prev.h) / (next.h - prev.h);
    return {
      h, v: prev.v*(1-t) + next.v*t,
      label: t < 0.5 ? prev.label : next.label,
      state: t < 0.5 ? prev.state : next.state
    };
  }
  function moodLabel(v){
    if (v >= 80) return 'отлично';
    if (v >= 65) return 'хорошо';
    if (v >= 50) return 'нормально';
    if (v >= 35) return 'тяжело';
    return 'ужасно';
  }
  function moodState(v){
    if (v >= 80) return 'good';
    if (v >= 65) return 'good';
    if (v >= 50) return 'warn';
    if (v >= 35) return 'bad';
    return 'bad';
  }

  function nearestEvent(h){
    let best = null, bestDist = Infinity;
    for (const ev of EVENTS){
      const c = (ev.start + (ev.end || ev.start))/2;
      const d = Math.abs(c - h);
      if (d < bestDist){ bestDist = d; best = ev; }
    }
    return { event:best, dist:bestDist };
  }

  function momentFor(h){
    const { event } = nearestEvent(h);
    const eTo = metricAt('energy', h);
    const eFrom = metricAt('energy', Math.max(DAY_START, h-0.5));
    const s     = metricAt('steps', h);
    const deltas = [
      { label:'Энергия', from:eFrom, to:eTo, lag:'сейчас', suffix:'%', bar:eTo },
      { label:'Шаги',    from:Math.max(0,s-800), to:s, lag:'сегодня', suffix:'', bar:Math.min(100,Math.round(s/90)) }
    ];
    return { event, deltas, insight: makeInsight(event, h) };
  }

  function makeInsight(event, h){
    // 1) Контекстный insight из patterns.js (на основе реальных наблюдений)
    if (window.AtlasPatterns){
      const hist = window.AtlasPatterns.getHistory();
      const today = hist[hist.length - 1];
      const last  = hist[hist.length - 2] || today;
      const ctx = window.AtlasPatterns.contextualInsight(
        h, last ? last.sleep : null,
        today ? today.steps : 0,
        today ? today.caffeine : 0
      );
      if (ctx) return ctx.text;
    }
    // 2) Fallback — event-based insights
    if (event){
      if (event.id === 'meal-l')  return 'Плотный обед с углеводами — к 15:00 возможен спад. Прогулка в 15:30 вернёт тонус.';
      if (event.id === 'workout') return 'Силовая снизит стресс через 1-2ч. Пик восстановления — к 16:00.';
      if (event.id === 'checkin') return 'Хороший момент проверить самочувствие. Запись займёт 10 секунд.';
      if (event.id === 'sleep-am')return 'Сон 7ч 12м, качество 78%. Восстановление хорошее — день будет сильным.';
      if (event.id === 'meal-d')  return 'Лёгкий ужин за 3ч до сна улучшит качество отдыха.';
      if (event.id === 'sleep-pm')return 'Ложись до 23:00 — завтра готовность +8.';
      if (event.id === 'wake')    return 'Подъём. Готовность высокая. Тренируйся в полную силу.';
    }
    if (h >= 20) return 'Вечер. Лучшее время для расслабления. Рутина в 21:00 улучшит сон.';
    if (h >= 12) return 'Середина дня. Активность на пике.';
    if (h >= 8)  return 'Утро. Набирай темп.';
    return 'Раннее утро.';
  }

  function describeEvent(event, h){
    if (!event){
      if (h >= 22) return 'Поздний вечер. Готовься ко сну.';
      if (h >= 19) return 'Вечер. Расслабься.';
      if (h >= 16) return 'После обеда. Следи за энергией.';
      if (h >= 12) return 'Середина дня.';
      if (h >= 8)  return 'Утро.';
      return 'Раннее утро.';
    }
    if (event.id === 'sleep-am') return 'Сон 7ч 12м · качество 78%';
    if (event.id === 'wake')     return 'Подъём. Готовность высокая';
    if (event.id === 'workout')  return 'Силовая 45 мин · интенсивность 7/10';
    if (event.id === 'meal-l' || event.id === 'meal-b')   return 'Сбалансированный обед · 580 ккал';
    if (event.id === 'meal-d')   return 'Лёгкий ужин · 420 ккал';
    if (event.id === 'checkin')  return 'Микро-пауза. Отметь, как ты сейчас';
    if (event.id === 'sleep-pm') return 'Подготовка ко сну';
    if (event.id === 'walk')     return 'Прогулка 20 мин';
    if (event.id === 'winddown') return 'Рутина расслабления';
    return '';
  }

  // ============================================================
  // RENDER: TIMELINE V4 — Apple/Whoop/Oura premium
  // ============================================================
  function renderMoodPath(svg){
      // Фильтруем точки по текущему диапазону DAY_START..DAY_END
      const filtered = MOOD.filter(p => p.h >= DAY_START - 0.01 && p.h <= DAY_END + 0.01);
      const points = filtered.map(p => ({ x: xFromHour(p.h), y: clampY(moodY(p.v)) }));
      if (points.length < 2) return;
      let d = `M${points[0].x} ${points[0].y}`;
      for (let i=1; i<points.length; i++){
        const prev = points[i-1], cur = points[i];
        const cp1x = prev.x + (cur.x - prev.x) * 0.4;
        const cp2x = prev.x + (cur.x - prev.x) * 0.6;
        d += ` C${cp1x} ${prev.y} ${cp2x} ${cur.y} ${cur.x} ${cur.y}`;
      }
    const moodPath = document.getElementById('tlMoodPath');
    if (moodPath) moodPath.setAttribute('d', d);

    const last = points[points.length-1];
    const first = points[0];
    const areaD = d + ` L${last.x} 170 L${first.x} 170 Z`;
    const moodArea = document.getElementById('tlMoodArea');
    if (moodArea) moodArea.setAttribute('d', areaD);
  }

  function renderMoodDots(svg){
    const g = el('g');
    // Маленькие точки на кривой в экстремумах
    const extrems = [
      { h:9,  v:85, label:'пик' },
      { h:13, v:42, label:'спад' },
      { h:16, v:88, label:'пик' },
      { h:23, v:30, label:'дно' }
    ];
    extrems.forEach(e => {
      const x = xFromHour(e.h);
      const y = clampY(moodY(e.v));
      g.appendChild(el('circle', { cx:x, cy:y, r:3, fill:'#fff', stroke: STATE_COLORS[moodState(e.v)], 'stroke-width':1.5 }));
    });
    svg.appendChild(g);
  }

  function renderTodLabels(svg){
    const g = el('g');
    const labels = [
      { h:6,  text:'рассвет' },
      { h:8,  text:'утро' },
      { h:12, text:'день' },
      { h:17, text:'закат' },
      { h:20, text:'вечер' }
    ].filter(l => l.h >= DAY_START - 0.01 && l.h <= DAY_END + 0.01);
    labels.forEach(l => {
      const x = xFromHour(l.h);
      g.appendChild(el('text', { x:x, y:14, class:'tl-tod-label' }, l.text));
    });
    svg.appendChild(g);
  }

  function renderEvents(svg, visualScale, period){
    let eventsFiltered = EVENTS;
    if (period){
      eventsFiltered = EVENTS.filter(ev => ev.start < period.end && (ev.end || ev.start) > period.start);
    }
    const packed = packEvents(visualScale || 1, eventsFiltered);

    // Helper: одна видимая «единица» — либо full card, либо stack counter.
    // packItem = { x, w, row, items:[ev, ev, ...], stack }
    function renderUnit(g, packItem, side){
      const items = packItem.items;
      const isStack = items.length > 1;
      const lead = items[0];
      const xCenter = packItem.x;
      const mood = moodAt(lead.start);
      const color = STATE_COLORS[mood.state] || STATE_COLORS.good;
      const moodYVal = clampY(moodY(mood.v));

      const rowOffset = (packItem.row || 0) * PILL_ROW_H;
      const pillTop  = side === 'top' ? 6 + rowOffset : 140 + rowOffset;
      const anchorY  = side === 'top' ? pillTop + PILL_H : pillTop;

      const grp = el('g', {
        class:'tl-event tl-event-'+side + (isStack ? ' tl-event-stack' : ''),
        'data-stack-size': items.length,
        'data-event-id': lead.id
      });

      // Стебли: по одному на каждое событие в стеке
      items.forEach((it, i) => {
        const xStem = packItem.x - (packItem.w - PILL_W)/2 + (i / Math.max(1, items.length - 1)) * (packItem.w - 4);
        const yStem = side === 'top' ? anchorY : anchorY;
        grp.appendChild(el('line', {
          x1:xStem, y1:yStem, x2:xStem, y2:moodYVal,
          stroke: STATE_COLORS[moodAt(it.start).state] || color,
          'stroke-width':.6, opacity:.3,
          class:'tl-pill-stem'
        }));
        // Маленькая точка привязки (для стеков)
        grp.appendChild(el('circle', {
          cx:xStem, cy:moodYVal, r:2,
          fill:'#fff', stroke: STATE_COLORS[moodAt(it.start).state] || color, 'stroke-width':1
        }));
      });

      if (!isStack){
        // === FULL CARD (compact: icon + time, без лейбла) ===
        const pillX = xCenter - PILL_W/2;
        const pillY = pillTop;
        grp.appendChild(el('rect', {
          x:pillX, y:pillY, width:PILL_W, height:PILL_H, rx:8, ry:8,
          class:'tl-pill-bg'
        }));
        // Цветная полоска слева
        grp.appendChild(el('rect', {
          x:pillX, y:pillY, width:3, height:PILL_H, rx:1.5, ry:1.5,
          fill: color, opacity:.95
        }));
        // Иконка по центру сверху
        const iconCx = xCenter;
        const iconCy = pillY + 9;
        grp.appendChild(el('circle', {
          cx:iconCx, cy:iconCy, r:6,
          fill: color, class:'tl-pill-icon-bg'
        }));
        grp.appendChild(el('g', {
          transform:'translate('+(iconCx-4.5)+' '+(iconCy-4.5)+') scale(.38)',
          class:'tl-pill-icon', style:'stroke:#fff'
        })).innerHTML = EVENT_ICON[lead.icon] || EVENT_ICON.sun;
        // Время под иконкой
        grp.appendChild(el('text', {
          x:xCenter, y:pillY + PILL_H - 6, class:'tl-pill-time', 'text-anchor':'middle'
        }, fmtTime(lead.start)));
        grp.addEventListener('click', () => setMomentHour(lead.start, true));
      } else {
        // === STACK COUNTER "+N" — крупнее, чтобы было видно и понятно «тапни» ===
        const r = 14;
        const cy = pillTop + PILL_H/2;
        grp.appendChild(el('circle', {
          cx:xCenter, cy, r,
          fill:'#fff', stroke: color, 'stroke-width':1.6,
          class:'tl-stack-bg', filter:'url(#pillShadow)'
        }));
        // Полоска акцента сверху
        grp.appendChild(el('rect', {
          x:xCenter - r, y:cy - r, width:r*2, height:3, rx:1.5, ry:1.5,
          fill: color, opacity:.95
        }));
        grp.appendChild(el('text', {
          x:xCenter, y:cy + 4,
          class:'tl-stack-count', 'text-anchor':'middle'
        }, '+'+items.length));
        grp.addEventListener('click', () => openStackPopover(items, xCenter, pillTop, side));
      }

      g.appendChild(grp);
    }

    // ====== POPOVER для раскрытия стека ======
    let popover = null;
    function openStackPopover(items, xSvg, ySvg, side){
      // Закрыть предыдущий
      if (popover){ popover.remove(); popover = null; }
      const axisEl = document.getElementById('timelineAxis');
      if (!axisEl) return;
      const rect = axisEl.getBoundingClientRect();
      const scale = rect.width / SVG_W;
      const leftPx = xSvg * scale;
      const topPx  = ySvg * (rect.height / 200);

      popover = document.createElement('div');
      popover.className = 'tl-stack-popover';
      popover.style.left = leftPx + 'px';
      popover.style.top  = (side === 'top' ? (topPx + 22) : (topPx - 8)) + 'px';
      popover.style.transform = side === 'top' ? 'translateX(-50%)' : 'translate(-50%, -100%)';

      const arrow = document.createElement('div');
      arrow.className = 'tl-stack-popover-arrow';
      popover.appendChild(arrow);

      items.forEach((it, i) => {
        const mood = moodAt(it.start);
        const color = STATE_COLORS[mood.state] || STATE_COLORS.good;
        const row = document.createElement('button');
        row.className = 'tl-stack-row';
        row.type = 'button';
        row.innerHTML =
          '<span class="tl-stack-row-time">'+fmtTime(it.start)+'</span>'+
          '<span class="tl-stack-row-icon" style="background:'+color+'">'+
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
              (EVENT_ICON[it.icon] || EVENT_ICON.sun)+
            '</svg>'+
          '</span>'+
          '<span class="tl-stack-row-label">'+it.label+'</span>';
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          setMomentHour(it.start, true);
          if (popover){ popover.remove(); popover = null; }
        });
        popover.appendChild(row);
      });

      const close = document.createElement('button');
      close.className = 'tl-stack-close';
      close.type = 'button';
      close.setAttribute('aria-label', 'Закрыть');
      close.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
      close.addEventListener('click', () => { popover.remove(); popover = null; });
      popover.appendChild(close);

      document.querySelector('.timeline-stage').appendChild(popover);
      // Закрытие по клику вне
      setTimeout(() => {
        const onDoc = (e) => {
          if (popover && !popover.contains(e.target)){
            popover.remove(); popover = null;
            document.removeEventListener('click', onDoc);
          }
        };
        document.addEventListener('click', onDoc);
      }, 0);
    }

    // Рендерим одиночные элементы и стеки
    const gTop = el('g', { id:'tlEventsTopInner' });
    packed.top.packItems.forEach(p => renderUnit(gTop, p, 'top'));
    svg.appendChild(gTop);

    const gBot = el('g', { id:'tlEventsBottomInner' });
    packed.bottom.packItems.forEach(p => renderUnit(gBot, p, 'bottom'));
    svg.appendChild(gBot);
  }

  function setScrubber(h, snap){
    const x = xFromHour(Math.max(DAY_START, Math.min(DAY_END, h)));
    const scrub = document.getElementById('tlScrubber');
    if (scrub) scrub.setAttribute('transform', 'translate('+x+',0)');

    // Scrubber-bubble (Apple-style pill с временем)
    const bubble = document.getElementById('scrubberBubble');
    if (bubble){
      const axisEl = document.getElementById('timelineAxis');
      if (axisEl){
        const rect = axisEl.getBoundingClientRect();
        const axisW = rect.width;
        const pct = (x - TL_LEFT_PAD) / (SVG_W - TL_LEFT_PAD - TL_RIGHT_PAD);
        const leftPx = Math.max(34, Math.min(axisW - 34, pct * axisW));
        bubble.style.left = leftPx + 'px';
      }
      const tsbTime = document.getElementById('tsbTime');
      if (tsbTime) tsbTime.textContent = fmtTime(h);
      bubble.classList.add('is-visible');
    }

    // Маскот
    updateMascot(h);
  }

  function updateVitalCards(h) {
    if (!window.AtlasMetrics) return;

    const m = AtlasMetrics.metricsAt(h);
    const hrv = AtlasMetrics.hrvAt(h);
    const rhr = AtlasMetrics.rhrAt(h);
    const recovery = AtlasMetrics.recoveryAt(h);
    const strain = AtlasMetrics.strainAt(h);
    const hydration = AtlasMetrics.hydrationAt(h);

    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    const timeStr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    const timeOfDay = h < 9 ? 'Утро' : h < 12 ? 'Утро' : h < 14 ? 'День' : h < 17 ? 'День' : h < 21 ? 'Вечер' : 'Ночь';

    // === VITAL INDEX ===
    const viScore = document.getElementById('viScore');
    const viFill = document.getElementById('viFill');
    const viTrend = document.getElementById('viTrend');
    const viTime = document.getElementById('viTime');

    if (viScore) viScore.textContent = m.status;
    if (viTime) viTime.textContent = timeOfDay + ' · ' + timeStr;

    const prevH = Math.max(6, h - 1);
    const prevM = AtlasMetrics.metricsAt(prevH);
    if (viTrend) {
      const diff = m.status - prevM.status;
      if (diff > 2) viTrend.textContent = '↑ +' + diff + ' · на подъёме';
      else if (diff < -2) viTrend.textContent = '↓ ' + diff + ' · на спаде';
      else viTrend.textContent = '· стабильно';
    }

    if (viFill) {
      const circumference = 427.26;
      const offset = circumference - (m.status / 100) * circumference;
      viFill.style.strokeDashoffset = offset;
      const viColor = m.status >= 65
        ? 'url(#viGrad)'
        : m.status >= 50
          ? 'url(#viWarnGrad)'
          : 'url(#viBadGrad)';
      viFill.setAttribute('stroke', viColor);
    }

    // === BODY SCORE ===
    const hrvScore = Math.min(100, Math.max(0, (hrv - 30) / 40 * 100));
    const rhrScore = Math.min(100, Math.max(0, (80 - rhr) / 30 * 100));
    const bodyScore = Math.round((hrvScore + rhrScore + recovery) / 3);

    const bodyScoreEl = document.getElementById('bodyScore');
    const bodyRing = document.getElementById('bodyRing');
    const bodyRingNum = document.getElementById('bodyRingNum');
    if (bodyScoreEl) bodyScoreEl.textContent = bodyScore + '%';
    if (bodyRingNum) bodyRingNum.textContent = bodyScore;

    if (bodyRing) {
      const circumference = 301.59;
      const offset = circumference - (bodyScore / 100) * circumference;
      bodyRing.style.strokeDashoffset = offset;
      const bodyColor = bodyScore >= 70
        ? 'url(#bodyGrad)'
        : bodyScore >= 50
          ? 'url(#bodyWarnGrad)'
          : 'url(#bodyBadGrad)';
      bodyRing.setAttribute('stroke', bodyColor);
    }

    const bodyHrv = document.getElementById('bodyHrv');
    const bodySteps = document.getElementById('bodySteps');
    const bodyRecovery = document.getElementById('bodyRecovery');
    const bodyStrain = document.getElementById('bodyStrain');

    if (bodyHrv) bodyHrv.textContent = hrv + ' мс';
    if (bodySteps) bodySteps.textContent = Math.round(m.steps / 1000 * 10) / 10 + 'k';
    if (bodyRecovery) bodyRecovery.textContent = recovery + '%';
    if (bodyStrain) {
      bodyStrain.textContent = strain.toFixed(1);
      bodyStrain.style.color = strain > 3 ? '#F0764B' : strain > 1.5 ? '#F2A037' : '#2FBF9B';
    }

    const bodyHrvBar = document.getElementById('bodyHrvBar');
    const bodyRecoveryBar = document.getElementById('bodyRecoveryBar');
    const bodyStepsBar = document.getElementById('bodyStepsBar');
    const bodyStrainBar = document.getElementById('bodyStrainBar');

    if (bodyHrvBar) {
      bodyHrvBar.style.width = Math.min(100, Math.max(0, (hrv - 30) / 40 * 100)) + '%';
      bodyHrvBar.style.background = hrv >= 60 ? '#2FBF9B' : hrv >= 45 ? '#F2A037' : '#F0764B';
    }
    if (bodyRecoveryBar) {
      bodyRecoveryBar.style.width = recovery + '%';
      bodyRecoveryBar.style.background = recovery >= 70 ? '#2FBF9B' : recovery >= 50 ? '#F2A037' : '#F0764B';
    }
    if (bodyStepsBar) {
      bodyStepsBar.style.width = Math.min(100, m.steps / 8000 * 100) + '%';
      bodyStepsBar.style.background = m.steps >= 8000 ? '#2FBF9B' : m.steps >= 4000 ? '#F2A037' : '#F0764B';
    }
    if (bodyStrainBar) {
      bodyStrainBar.style.width = Math.min(100, strain / 5 * 100) + '%';
      bodyStrainBar.style.background = strain <= 2 ? '#2FBF9B' : strain <= 3 ? '#F2A037' : '#F0764B';
    }

    // === MIND SCORE ===
    const mindScore = Math.round((m.energy + m.focus + m.mood) / 3);

    const mindScoreEl = document.getElementById('mindScore');
    if (mindScoreEl) mindScoreEl.textContent = mindScore + '%';

    const mindEnergy = document.getElementById('mindEnergy');
    const mindFocus = document.getElementById('mindFocus');
    const mindMood = document.getElementById('mindMood');
    const mindClarity = document.getElementById('mindClarity');

    if (mindEnergy) mindEnergy.textContent = m.energy + '%';
    if (mindFocus) mindFocus.textContent = m.focus + '%';
    if (mindMood) mindMood.textContent = m.mood + '%';
    if (mindClarity) mindClarity.textContent = Math.round((m.energy + m.focus) / 2) + '%';

    const mindEnergyBar = document.getElementById('mindEnergyBar');
    const mindFocusBar = document.getElementById('mindFocusBar');
    const mindMoodBar = document.getElementById('mindMoodBar');
    const mindClarityBar = document.getElementById('mindClarityBar');

    if (mindEnergyBar) {
      mindEnergyBar.style.width = m.energy + '%';
      mindEnergyBar.style.background = m.energy >= 80 ? '#2FBF9B' : m.energy >= 60 ? '#F2A037' : '#F0764B';
    }
    if (mindFocusBar) {
      mindFocusBar.style.width = m.focus + '%';
      mindFocusBar.style.background = m.focus >= 80 ? '#2FBF9B' : m.focus >= 60 ? '#F2A037' : '#F0764B';
    }
    if (mindMoodBar) {
      mindMoodBar.style.width = m.mood + '%';
      mindMoodBar.style.background = m.mood >= 80 ? '#2FBF9B' : m.mood >= 60 ? '#F2A037' : '#F0764B';
    }
    if (mindClarityBar) {
      const clarity = Math.round((m.energy + m.focus) / 2);
      mindClarityBar.style.width = clarity + '%';
      mindClarityBar.style.background = clarity >= 80 ? '#2FBF9B' : clarity >= 60 ? '#F2A037' : '#F0764B';
    }

    // Wave visualization — 7 bars representing last 7 hours
    const mindWave = document.getElementById('mindWave');
    if (mindWave) {
      const bars = mindWave.querySelectorAll('.vc-wave-bar');
      bars.forEach((bar, i) => {
        const histH = Math.max(6, h - 6 + i);
        const e = AtlasMetrics.energyAt(histH);
        bar.style.height = e + '%';
        bar.style.background = e >= 80
          ? 'linear-gradient(180deg,#5CC4A0,#2FBF9B)'
          : e >= 60
            ? 'linear-gradient(180deg,#F5C037,#F2A037)'
            : 'linear-gradient(180deg,#F0764B,#D06552)';
      });
    }

    // === BALANCE SCORE ===
    const stressScore = Math.min(100, Math.max(0, 100 - (strain - 1) * 50));
    const balanceScore = Math.round((stressScore + recovery + hydration) / 3);

    const balanceScoreEl = document.getElementById('balanceScore');
    const balanceScaleFill = document.getElementById('balanceScaleFill');
    if (balanceScoreEl) balanceScoreEl.textContent = balanceScore + '%';
    if (balanceScaleFill) {
      balanceScaleFill.style.width = balanceScore + '%';
      const balColor = balanceScore >= 70
        ? 'linear-gradient(90deg,#5CC4A0,#2FBF9B)'
        : balanceScore >= 50
          ? 'linear-gradient(90deg,#F5C037,#F2A037)'
          : 'linear-gradient(90deg,#F0764B,#D06552)';
      balanceScaleFill.style.background = balColor;
    }

    const balanceStress = document.getElementById('balanceStress');
    const balanceSleep = document.getElementById('balanceSleep');
    const balanceWater = document.getElementById('balanceWater');
    const balanceRecovery = document.getElementById('balanceRecovery');

    if (balanceStress) {
      balanceStress.textContent = strain.toFixed(1);
      balanceStress.style.color = strain > 3 ? '#F0764B' : strain > 1.5 ? '#F2A037' : '#2FBF9B';
    }
    if (balanceSleep) balanceSleep.textContent = m.sleepMin ? (m.sleepMin / 60).toFixed(1) + ' ч' : '—';
    if (balanceWater) balanceWater.textContent = hydration + '%';
    if (balanceRecovery) balanceRecovery.textContent = recovery + '%';

    const balanceStressBar = document.getElementById('balanceStressBar');
    const balanceSleepBar = document.getElementById('balanceSleepBar');
    const balanceWaterBar = document.getElementById('balanceWaterBar');
    const balanceRecoveryBar = document.getElementById('balanceRecoveryBar');

    if (balanceStressBar) {
      const stressPct = Math.min(100, Math.max(0, 100 - (strain - 1) * 50));
      balanceStressBar.style.width = stressPct + '%';
      balanceStressBar.style.background = stressPct >= 70 ? '#2FBF9B' : stressPct >= 50 ? '#F2A037' : '#F0764B';
    }
    if (balanceSleepBar) {
      const sleepPct = m.sleepMin ? Math.min(100, (m.sleepMin / (8 * 60)) * 100) : 0;
      balanceSleepBar.style.width = sleepPct + '%';
      balanceSleepBar.style.background = sleepPct >= 75 ? '#2FBF9B' : sleepPct >= 50 ? '#F2A037' : '#F0764B';
    }
    if (balanceWaterBar) {
      balanceWaterBar.style.width = hydration + '%';
      balanceWaterBar.style.background = hydration >= 70 ? '#2FBF9B' : hydration >= 50 ? '#F2A037' : '#F0764B';
    }
    if (balanceRecoveryBar) {
      balanceRecoveryBar.style.width = recovery + '%';
      balanceRecoveryBar.style.background = recovery >= 70 ? '#2FBF9B' : recovery >= 50 ? '#F2A037' : '#F0764B';
    }

    // === CONTEXT ===
    const vcEvent = document.getElementById('vcEvent');
    const vcInsight = document.getElementById('vcInsight');
    const { event } = nearestEvent(h);

    if (vcEvent) {
      if (event) {
        vcEvent.textContent = event.label + ' · ' + timeStr;
      } else {
        vcEvent.textContent = timeOfDay + ' · ' + timeStr;
      }
    }
    if (vcInsight) {
      vcInsight.textContent = makeInsight(event, h) || '';
    }
  }

  function setMomentHour(h, snap){
    setScrubber(h, snap);
    renderMoment(h);
  }

  function renderMoment(h){
    const m = momentFor(h);
    const timeEl = document.getElementById('momentTime');
    const titleEl = document.getElementById('momentTitle');
    const descEl = document.getElementById('momentDesc');
    const insightEl = document.getElementById('momentInsight');

    if (timeEl) timeEl.textContent = fmtTime(h);
    if (titleEl) titleEl.textContent = m.event ? m.event.label : 'Сейчас';
    if (descEl) descEl.textContent = describeEvent(m.event, h);

    // Vitals: временно отключено, чтобы не ломать timeline
    // renderMomentVitals(h, m);

    // momentNext скрыт — дубль с nextAction (тренер уже говорит «до X мин»)
    // renderMomentNext(h);

    // Narrative (одна фраза про архетип момента)
    renderMomentNarrative(h);

    // Прогноз до конца дня (обновляет dynamics-card)
    updateDynamics(h);

    // Vital Section — 4 cards (Vital Index + Body + Mind + Balance)
    updateVitalCards(h);

    if (insightEl){
      insightEl.innerHTML =
        '<span class="mi-ic">'+
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-4 12.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26A7 7 0 0 0 12 2z"/><path d="M9 21h6"/></svg>'+
        '</span>'+
        '<span>'+m.insight+'</span>';
    }
  }

  // ============== VITALS RENDER ==============
  // Кольцо обновляется через stroke-dasharray
  // Числа — count-up анимация (300мс)
  const _vitalsState = { h: null, vals: {} };

  function countUpTo(el, from, to, duration){
    if (!el) return;
    if (from === null || from === undefined) from = 0;
    if (from === to){ el.textContent = to; return; }
    const start = performance.now();
    const dur = Math.max(120, duration || 320);
    function step(now){
      const t = Math.min(1, (now - start) / dur);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      el.textContent = v;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function renderMomentVitals(h, m){
    if (!window.AtlasMetrics) return;
    const mood = window.AtlasMetrics.defaultMoodAt(h);
    // Найдём ближайшее событие для контекстной подписи кольца
    let nextEv = null;
    for (const ev of EVENTS){
      if (ev.start > h + 0.1){ nextEv = ev; break; }
    }
    const nextEvent = nextEv
      ? { label: nextEv.label, minutesUntil: Math.round((nextEv.start - h) * 60) }
      : null;
    const metrics = window.AtlasMetrics.metricsAt(h, mood, nextEvent);
    const prev = _vitalsState.vals;

    // Vitals ring (3 кольца)
    // Окружность радиуса r = 2πr
    const setRing = (sel, pct) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const r = +el.getAttribute('r');
      const C = 2 * Math.PI * r;
      // 0% → dasharray "0 C" (пусто), 100% → "C 0"
      const filled = (pct / 100) * C;
      el.style.strokeDasharray = filled + ' ' + C;
    };
    setRing('.vring-energy', metrics.energy);
    setRing('.vring-focus',  metrics.focus);
    setRing('.vring-mood',   metrics.mood);

    // Центр кольца — общий статус
    const numEl = document.getElementById('vringNum');
    const labEl = document.getElementById('vringLabel');
    if (numEl){
      countUpTo(numEl, prev.status != null ? prev.status : 0, metrics.status, 350);
      numEl.classList.remove('is-good','is-warn','is-bad');
      if (metrics.status >= 65) numEl.classList.add('is-good');
      else if (metrics.status >= 50) numEl.classList.add('is-warn');
      else numEl.classList.add('is-bad');
    }

    // Контекстный лейбл в центре кольца: «Сейчас» если scrubber на текущем часе,
    // иначе — контекст часа (Сон/Утро/День/Вечер) + время.
    if (labEl){
      const nowH = hoursNow();
      const isCurrent = Math.abs(h - nowH) < 0.5;
      if (isCurrent){
        labEl.textContent = 'Сейчас';
      } else {
        const hh = Math.floor(h);
        const mm = Math.round((h - hh) * 60);
        const tod = h < 8 ? 'Сон' : h < 12 ? 'Утро' : h < 17 ? 'День' : h < 22 ? 'Вечер' : 'Сон';
        labEl.textContent = tod + ' · ' + pad2(hh) + ':' + pad2(mm);
      }
    }

    // Метрики: count-up (energy/focus/mood теперь на кольцах, в плитках только heart/load/hydration)
    // Плитки (пульс/нагрузка/гидратация) убраны из момент-card —
    // теперь живут в drilldown «Подробнее» (HRV/Сон/Стресс/Восстановление/Нагрузка/Энергия).

    // Goal rings + chips: дневные цели
    renderGoals(metrics);

    // Next action: тренер-рекомендация
    renderNextAction(h, metrics, nextEvent);

    // Сохраняем для следующего count-up
    _vitalsState.h = h;
    _vitalsState.vals = {
      status: metrics.status
    };
  }

  // ===== GOALS — дневные цели (4 кольца + 3 чипа + sleep) =====
  function renderGoals(metrics){
    // Окружность для маленьких колец (r=16): 2π·16 ≈ 100.53
    const C = 2 * Math.PI * 16;
    const setRing = (sel, pct) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const filled = Math.max(0, Math.min(C, (pct / 100) * C));
      el.style.strokeDasharray = filled + ' ' + C;
    };

    // 1) Шаги
    const stepsGoal = 8000;
    const stepsPct = Math.min(100, Math.round((metrics.steps / stepsGoal) * 100));
    setRing('#grStepsFill', stepsPct);
    const stepsNumEl = document.getElementById('grStepsNum');
    if (stepsNumEl) stepsNumEl.textContent = Math.round(metrics.steps / 1000) + 'k';
    const stepsItemEl = document.querySelector('.gr-item[data-key="steps"]');
    if (stepsItemEl){
      stepsItemEl.classList.remove('is-done','is-warn','is-bad');
      if (stepsPct >= 100) stepsItemEl.classList.add('is-done');
    }

    // 2) Активные минуты
    const activeGoal = 22;
    const activePct = Math.min(100, Math.round((metrics.activeMin / activeGoal) * 100));
    setRing('#grActiveFill', activePct);
    const activeNumEl = document.getElementById('grActiveNum');
    if (activeNumEl) activeNumEl.textContent = metrics.activeMin + 'м';
    const activeItemEl = document.querySelector('.gr-item[data-key="active"]');
    if (activeItemEl){
      activeItemEl.classList.remove('is-done','is-warn','is-bad');
      if (activePct >= 100) activeItemEl.classList.add('is-done');
    }

    // 3) Вода
    const waterPct = Math.min(100, metrics.hydration);
    setRing('#grWaterFill', waterPct);
    const waterMl = Math.round((waterPct / 100) * 2500);
    const waterNumEl = document.getElementById('grWaterNum');
    if (waterNumEl) waterNumEl.textContent = (waterMl / 1000).toFixed(1);
    const waterItemEl = document.querySelector('.gr-item[data-key="water"]');
    if (waterItemEl){
      waterItemEl.classList.remove('is-done','is-warn','is-bad');
      if (waterPct >= 100) waterItemEl.classList.add('is-done');
    }

    // 4) Сидячее время (инвертированный)
    const SIT_LIMIT = 6;
    const sitH = metrics.sitting;
    const sitPct = Math.min(100, Math.round((sitH / SIT_LIMIT) * 100));
    setRing('#grSitFill', sitPct);
    const hh = Math.floor(sitH);
    const mm = Math.round((sitH - hh) * 60);
    const sitNumEl = document.getElementById('grSitNum');
    if (sitNumEl) sitNumEl.textContent = hh + 'ч';
    const sitItemEl = document.querySelector('.gr-item[data-key="sitting"]');
    if (sitItemEl){
      sitItemEl.classList.remove('is-done','is-warn','is-bad');
      if (sitH > 5) sitItemEl.classList.add('is-bad');
      else if (sitH > 4) sitItemEl.classList.add('is-warn');
    }

    // ===== ЧИПЫ: «что осталось до цели» =====
    // Шаги
    const stepsChip = document.querySelector('.gc-chip[data-key="steps"]');
    const gcSteps = document.getElementById('gcSteps');
    if (stepsChip && gcSteps){
      stepsChip.classList.remove('is-done','is-warn','is-bad');
      if (stepsPct >= 100){
        stepsChip.classList.add('is-done');
        gcSteps.textContent = 'Цель закрыта — ' + (metrics.steps - stepsGoal).toLocaleString('ru-RU') + ' сверх';
      } else {
        const left = (stepsGoal - metrics.steps);
        gcSteps.textContent = 'Ещё ' + left.toLocaleString('ru-RU') + ' до цели';
      }
    }
    // Активность
    const activeChip = document.querySelector('.gc-chip[data-key="active"]');
    const gcActive = document.getElementById('gcActive');
    if (activeChip && gcActive){
      activeChip.classList.remove('is-done','is-warn','is-bad');
      if (activePct >= 100){
        activeChip.classList.add('is-done');
        gcActive.textContent = 'Норма закрыта — отличный день';
      } else {
        const left = activeGoal - metrics.activeMin;
        gcActive.textContent = 'Быстрая ходьба ' + left + ' мин закроет норму';
        if (left > 18) activeChip.classList.add('is-warn');
      }
    }
    // Вода
    const waterChip = document.querySelector('.gc-chip[data-key="water"]');
    const gcWater = document.getElementById('gcWater');
    if (waterChip && gcWater){
      waterChip.classList.remove('is-done','is-warn','is-bad');
      if (waterPct >= 100){
        waterChip.classList.add('is-done');
        gcWater.textContent = 'Норма воды выполнена';
      } else {
        const leftMl = 2500 - waterMl;
        const leftL = (leftMl / 1000).toFixed(1);
        gcWater.textContent = 'Ещё ' + leftL + ' L до дневной нормы';
        if (metrics.hydration < 30) waterChip.classList.add('is-warn');
      }
    }

    // ===== SLEEP: countdown до 23:00 =====
    const sleepBlock = document.getElementById('goalSleep');
    if (sleepBlock){
      if (metrics.sleepMin != null && metrics.sleepMin > 0){
        sleepBlock.hidden = false;
        // Сброс анимации
        sleepBlock.style.animation = 'none';
        sleepBlock.offsetHeight; // reflow
        sleepBlock.style.animation = '';
        const sh = Math.floor(metrics.sleepMin / 60);
        const sm = metrics.sleepMin % 60;
        const titleEl = document.getElementById('gsTitle');
        const subEl = document.getElementById('gsSub');
        if (titleEl) titleEl.textContent = 'До сна ' + sh + 'ч ' + (sm < 10 ? '0' : '') + sm + 'м';
        if (subEl) subEl.textContent = sh <= 1 ? 'Пора начинать рутину' : 'Лучше лечь к 23:00';
      } else {
        sleepBlock.hidden = true;
      }
    }
  }

  // ===== NEXT ACTION — тренер говорит, что делать =====
  // Приоритеты (по убыванию):
  //   1. Сидим > 60 мин — встать и пройтись
  //   2. Вечер + кофеин > 0 — не пить больше
  //   3. Утро + вода < 30% — выпить стакан
  //   4. Шаги < 30% от цели + день — пройтись
  //   5. Энергия низкая + день — перерыв 10 мин
  function renderNextAction(h, metrics, nextEvent){
    const wrap = document.getElementById('nextAction');
    if (!wrap) return;
    const titleEl = document.getElementById('nextActionTitle');
    const subEl   = document.getElementById('nextActionSub');
    const icEl    = document.getElementById('nextActionIc');
    const btnEl   = document.getElementById('nextActionBtn');

    // 1) Сидячий alarm
    if (metrics.sitting > 60){
      wrap.className = 'next-action is-bad';
      titleEl.textContent = 'Ты сидишь ' + Math.round(metrics.sitting) + ' мин без перерыва';
      subEl.textContent = '5 минут ходьбы восстановят кровоток и фокус';
      btnEl.textContent = 'Встать';
      icEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4v8m0 0l-3-3m3 3l3-3M5 21h14M7 17l-2 4m12-4l2 4"/></svg>';
      return;
    }

    // 2) Вечер + кофеин
    if (h >= 16 && metrics.caffeine > 50){
      wrap.className = 'next-action is-warn';
      titleEl.textContent = 'Кофеин ещё в крови — сон будет поверхностным';
      subEl.textContent = 'Лучшее время для последней чашки — до 15:00';
      btnEl.textContent = 'Понял';
      icEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>';
      return;
    }

    // 3) Утро + мало воды
    if (h >= 6 && h < 11 && metrics.hydration < 30){
      wrap.className = 'next-action is-warn';
      titleEl.textContent = 'Утро без воды — кровь гуще, фокус медленнее';
      subEl.textContent = 'Стакан воды сейчас = +8% к концентрации через 20 мин';
      btnEl.textContent = 'Выпить';
      icEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"/></svg>';
      return;
    }

    // 4) Шаги отстают
    if (h >= 14 && metrics.steps < 2400){
      wrap.className = 'next-action';
      titleEl.textContent = 'До вечера ещё 4 часа — шаги пока отстают';
      subEl.textContent = 'Прогулка 15 минут закроет треть дневной цели';
      btnEl.textContent = 'Пройтись';
      icEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4l3 5-3 5 4 6M9 20l-2-4 4-3-2-4 3-5"/></svg>';
      return;
    }

    // 5) Энергия низкая в середине дня
    if (h >= 13 && h < 16 && metrics.energy < 50){
      wrap.className = 'next-action is-warn';
      titleEl.textContent = 'Послеобеденный спад — норма';
      subEl.textContent = '10 минут тишины и воды вернут фокус лучше кофе';
      btnEl.textContent = 'Отдохнуть';
      icEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      return;
    }

    // По умолчанию — позитивная рекомендация
    wrap.className = 'next-action';
    titleEl.textContent = nextEvent
      ? 'До ' + nextEvent.label + ' ещё ' + nextEvent.minutesUntil + ' мин'
      : 'Хороший темп — продолжай в том же духе';
    subEl.textContent = 'Лёгкая прогулка или вода усилят эффект';
    btnEl.textContent = 'Ок';
    icEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  }

  // Контекст: следующее событие в ближайший час
  function renderMomentNext(h){
    const wrap = document.getElementById('momentNext');
    if (!wrap) return;
    let nextEv = null;
    for (const ev of EVENTS){
      if (ev.start > h + 0.1){ nextEv = ev; break; }
    }
    if (!nextEv){
      wrap.hidden = true;
      return;
    }
    // (s - h) * 60 — minutes between scrubber and event.
    // Math.round после умножения — избегаем дрейфа при дробных h.
    // Пример: h=17.5, event=18.2 → 0.7 * 60 = 42.0 → 42м.
    const minutesUntil = Math.max(1, Math.round((nextEv.start - h) * 60));
    let timeTxt;
    if (minutesUntil < 60) timeTxt = minutesUntil + 'м';
    else {
      const hInt = Math.floor(minutesUntil / 60);
      const mInt = minutesUntil % 60;
      timeTxt = mInt > 0 ? (hInt + 'ч ' + mInt + 'м') : (hInt + 'ч');
    }
    const t = document.getElementById('mnTime');
    const tx = document.getElementById('mnText');
    if (t) t.textContent = 'через ' + timeTxt;
    if (tx) tx.textContent = nextEv.label + ' в ' + fmtTime(nextEv.start);
    wrap.hidden = false;
  }

  // Narrative — одна фраза про архетип момента (отдельный блок)
  function renderMomentNarrative(h){
    const el = document.getElementById('momentNarrative');
    if (!el || !window.AtlasMetrics) return;
    const mood = window.AtlasMetrics.defaultMoodAt(h);
    const metrics = window.AtlasMetrics.metricsAt(h, mood);
    // Тон — мягкая забота, согласован с маскотом. Без директив.
    let phrase = '';
    if (h < 7)        phrase = 'Пробуждение. Организм просыпается.';
    else if (h < 9)   phrase = 'Утро. Готовность растёт.';
    else if (h < 12)  phrase = metrics.energy >= 80 ? 'Пик утра — время для важного.' : 'Утро. Набирай темп.';
    else if (h < 14)  phrase = metrics.energy < 65 ? 'Естественный спад после обеда — небольшое движение поможет.' : 'Середина дня.';
    else if (h < 17)  phrase = 'Пик дня. Время для фокуса.';
    else if (h < 20)  phrase = 'Вечер. Можно переключиться на лёгкое.';
    else if (h < 22)  phrase = metrics.caffeine > 50 ? 'Кофеин ещё в крови — стоит подождать с последней чашкой.' : 'Подготовка ко сну.';
    else if (h < 24)  phrase = 'Время отдыхать.';
    if (phrase){
      el.textContent = phrase;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  function renderNextEvent(h){
    let nextEv = null;
    for (const ev of EVENTS){
      if (ev.start > h){ nextEv = ev; break; }
    }
    const t = document.getElementById('neTime');
    const tt = document.getElementById('neTitle');
    const ts = document.getElementById('neSub');
    if (t && tt && ts && nextEv){
      t.textContent = fmtTime(nextEv.start);
      tt.textContent = nextEv.label;
      ts.textContent = nextEv.id === 'checkin' ? 'Как ты сейчас?' :
                       nextEv.id.indexOf('meal') === 0 ? 'Приём пищи' :
                       nextEv.id === 'workout' ? 'Силовая' :
                       nextEv.id === 'sleep-pm' ? 'Подготовка ко сну' : 'Запланировано';
    }
  }

  // Прогноз до конца дня (Пик / Сейчас / К 24:00)
  function updateDynamics(h){
    // Находим пик в MOOD[] (максимум v за оставшийся день)
    const hClamped = Math.max(0, Math.min(24, h));
    let peakEv = MOOD[0];
    for (const m of MOOD){
      if (m.h >= hClamped && m.v >= peakEv.v) peakEv = m;
    }
    // Если пик уже в прошлом — берём фактический
    const peakTime = peakEv.h >= hClamped ? peakEv.h : peakEv.h;
    // Конец дня — последний MOOD
    const eod = MOOD[MOOD.length-1];
    // Сейчас — moodAt(hClamped)
    const cur = moodAt(hClamped);
    const dynPeak = document.getElementById('dynPeak');
    const dynNow  = document.getElementById('dynNow');
    const dynEod  = document.getElementById('dynEod');
    const dynTrend = document.getElementById('dynamicsTrend');
    if (dynPeak) dynPeak.textContent = fmtTime(peakEv.h);
    if (dynNow)  dynNow.textContent  = Math.round(cur.v) + '%';
    if (dynEod)  dynEod.textContent  = '~' + Math.round(eod.v) + '%';
    if (dynTrend){
      const d = eod.v - cur.v;
      dynTrend.textContent = 'к концу ' + (d >= 0 ? '+' : '') + Math.round(d) + '%';
      dynTrend.classList.toggle('is-down', d < -5);
    }
  }

  // ============================================================
  // MASCOT — premium multi-state character
  // ============================================================
  // Тон маскота согласован с narrative: забота + контекст, не оценка.
  // Это не «как я себя чувствую» (это уже narrative), а «что я с тобой рядом».
  const MASCOT_SPEECH = {
    morning_happy:  'Доброе утро!',
    morning_calm:   'Чай с лимоном…',
    morning_sad:    'Не выспался…',
    day_happy:      'Отличный день!',
    day_calm:       'Продуктивно иду',
    day_tired:      'Нужен перерыв',
    day_sad:        'Сил нет…',
    evening_happy:  'В хорошем темпе',
    evening_calm:   'Держимся',
    evening_tired:  'Отдыхай',
    evening_sad:    'Тяжёлый вечер',
    night_happy:    'Время спать!',
    night_calm:     'Спокойной ночи',
    night_tired:    'Совсем нет сил',
    night_sad:      'Тяжёлый день'
  };

  // Items held in arms depending on time+mood
  const HELD_ITEMS = {
    morning: { good:'☕', load:'💧', bad:'💧' },   // cup
    day:     { good:'📱', load:'🎧', bad:'📓' },   // phone / headphones / notebook
    evening: { good:'📖', load:'🛁', bad:'🛋️' },   // book / bath / sofa
    night:   { good:'🌙', load:'🛏️', bad:'🛏️' }    // moon / bed
  };

  const MASCOT_EMOJI = {
    good:'♥', load:'!', bad:'~', heart:'♥', drop:'~'
  };

  let particleTicker = 0;

  function setMascotItem(timeMood, moodKey){
    const item = document.getElementById('mItem');
    if (!item) return;
    const t = timeMood.split('-')[0];
    const m = timeMood.split('-')[1];
    const group = HELD_ITEMS[t];
    if (!group) return;
    let char = group.good;
    if (moodKey === 'bad' || moodKey === 'warn') char = group.bad;
    else if (moodKey === 'load') char = group.load;
    item.innerHTML =
      '<text x="0" y="0" font-size="14" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">' + char + '</text>';
    item.setAttribute('transform', 'translate(60 88)');
  }

  function setMascotParticles(timeMood, moodKey){
    const wrap = document.getElementById('mParticles');
    if (!wrap) return;
    const isGood = moodKey === 'good';
    const isBad = moodKey === 'bad';
    if (!isGood && !isBad) {
      wrap.innerHTML = '';
      return;
    }
    // Генерируем 3 частицы
    wrap.innerHTML = '';
    for (let i=0; i<3; i++){
      const cx = 40 + i*20 + (Math.random()-0.5)*8;
      const cy = 50 + (Math.random()-0.5)*8;
      const fill = isGood ? 'var(--m-particle)' : 'var(--m-color-light)';
      c.style.fill = isGood ? '#FF6B95' : 'var(--m-color-light)';
      const r = isGood ? 2.2 : 1.8;
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', cx);
      c.setAttribute('cy', cy);
      c.setAttribute('r', r);
      c.setAttribute('fill', fill);
      c.style.animationDelay = (i*0.6) + 's';
      wrap.appendChild(c);
    }
  }

  function setMascotBrows(moodPose, timePose){
    const l = document.querySelector('.m-brow-l');
    const r = document.querySelector('.m-brow-r');
    if (!l || !r) return;
    if (moodPose === 'happy'){
      l.setAttribute('d', 'M34 38 Q42 32 50 36');
      r.setAttribute('d', 'M70 36 Q78 32 86 38');
    } else if (moodPose === 'calm'){
      l.setAttribute('d', 'M34 39 L50 39');
      r.setAttribute('d', 'M70 39 L86 39');
    } else if (moodPose === 'neutral'){
      l.setAttribute('d', 'M34 40 L50 38');
      r.setAttribute('d', 'M70 38 L86 40');
    } else if (moodPose === 'tired'){
      l.setAttribute('d', 'M34 38 Q42 42 50 40');
      r.setAttribute('d', 'M70 40 Q78 42 86 38');
    } else { // sad
      l.setAttribute('d', 'M34 36 Q42 41 50 40');
      r.setAttribute('d', 'M70 40 Q78 41 86 36');
    }
  }

  function setMascotBlush(moodKey){
    const blushes = document.querySelectorAll('.m-blush');
    blushes.forEach(b => {
      if (moodKey === 'good'){ b.setAttribute('opacity', '0.85'); b.setAttribute('rx', '9'); }
      else if (moodKey === 'warn'){ b.setAttribute('opacity', '0.6'); b.setAttribute('rx', '8'); }
      else if (moodKey === 'bad'){ b.setAttribute('opacity', '0.2'); b.setAttribute('rx', '5'); }
      else { b.setAttribute('opacity', '0.5'); b.setAttribute('rx', '7'); }
    });
  }

  function setMascotSpeech(timeMood){
    const speech = document.getElementById('mSpeech');
    const text = document.getElementById('mSpeechText');
    if (!speech || !text) return;
    text.textContent = MASCOT_SPEECH[timeMood] || '';
  }

  function showSpeech(){
    const speech = document.getElementById('mSpeech');
    if (speech) speech.classList.add('is-visible');
  }
  function hideSpeech(){
    const speech = document.getElementById('mSpeech');
    if (speech) speech.classList.remove('is-visible');
  }

  function updateMascot(h){
    const wrap = document.getElementById('mascotWrap');
    if (!wrap) return;
    const mood = moodAt(h);
    const v = mood.v;
    const h0 = NOW.getHours();
    let timePose = 'day';
    if (h0>=5 && h0<12) timePose = 'morning';
    else if (h0>=12 && h0<17) timePose = 'day';
    else if (h0>=17 && h0<22) timePose = 'evening';
    else timePose = 'night';

    let moodPose = 'happy';
    if (v >= 80) moodPose = 'happy';
    else if (v >= 65) moodPose = 'calm';
    else if (v >= 50) moodPose = 'neutral';
    else if (v >= 35) moodPose = 'tired';
    else moodPose = 'sad';

    const timeMood = timePose + '_' + moodPose;
    wrap.setAttribute('data-pose', timeMood);
    wrap.setAttribute('data-mood', moodState(v));
    // Color mode: 4 состояния (good/warn/load/bad) → меняет цвета тела, ушей, blush, рта, particles
    let colorMode = 'good';
    if (moodPose === 'tired') colorMode = 'load';
    else if (moodPose === 'sad') colorMode = 'bad';
    else if (moodPose === 'neutral') colorMode = 'warn';
    // Override: в load-mood (12-13ч тренировка) — оранжевый, даже если v не < 50
    if (timePose === 'day' && (h >= 12 && h <= 13)) colorMode = 'load';
    // Override: в night-mood — синий, всегда
    if (timePose === 'night') colorMode = 'bad';
    wrap.setAttribute('data-mood-color', colorMode);

    // 1. Зрачки следят за scrubber
    const pupils = document.querySelectorAll('.m-pupil');
    const nowX = xFromHour(Math.min(h, DAY_END));
    const dx = (nowX - 350) / 350;
    const dy = (Math.sin(h) * 0.5); // лёгкое движение по Y
    pupils.forEach((p, i) => {
      const cxAttr = i === 0 ? 46 : 78;
      p.setAttribute('cx', String(cxAttr + dx * 2.2));
      p.setAttribute('cy', String(52 + dy));
    });

    // 2. Голова наклоняется в сторону scrubber (класс на wrap)
    const headTilt = dx * 4; // -4..4 градуса
    wrap.classList.toggle('tilt-left',  dx < -0.05);
    wrap.classList.toggle('tilt-right', dx >  0.05);

    // 3. Улыбка/рот — много форм
    const smile = document.getElementById('mSmile');
    const mouthFill = document.getElementById('mMouthFill');
    if (smile && mouthFill){
      if (moodPose === 'happy'){
        smile.setAttribute('d', 'M44 70 Q60 88 76 70');
        smile.setAttribute('opacity', '1');
        mouthFill.setAttribute('d', 'M48 71 Q60 84 72 71');
        mouthFill.setAttribute('opacity', '0.4');
      } else if (moodPose === 'calm'){
        smile.setAttribute('d', 'M46 73 Q60 81 74 73');
        smile.setAttribute('opacity', '1');
        mouthFill.setAttribute('d', 'M50 74 Q60 78 70 74');
        mouthFill.setAttribute('opacity', '0.25');
      } else if (moodPose === 'neutral'){
        smile.setAttribute('d', 'M50 75 L70 75');
        smile.setAttribute('opacity', '1');
        mouthFill.setAttribute('opacity', '0');
      } else if (moodPose === 'tired'){
        smile.setAttribute('d', 'M48 79 Q60 75 72 79');
        smile.setAttribute('opacity', '1');
        mouthFill.setAttribute('opacity', '0');
      } else { // sad
        smile.setAttribute('d', 'M48 82 Q60 74 72 82');
        smile.setAttribute('opacity', '0.85');
        mouthFill.setAttribute('opacity', '0');
      }
    }

    // 4. Брови
    setMascotBrows(moodPose, timePose);

    // 5. Blush
    setMascotBlush(moodState(v));

    // 6. Held item (чашка/книга/телефон)
    setMascotItem(timeMood, moodState(v));

    // 7. Particles (сердечки/капли)
    particleTicker++;
    if (particleTicker % 6 === 0){
      setMascotParticles(timeMood, moodState(v));
    }

    // 8. Speech
    setMascotSpeech(timeMood);

    // 9. Zzz visibility
    const zzz = document.getElementById('mZzz');
    if (zzz) zzz.setAttribute('opacity', timePose === 'night' || moodState(v) === 'bad' ? '1' : '0');
  }

  // Инициализация клика по маскоту — показывает speech
  function setupMascotInteraction(){
    const wrap = document.getElementById('mascotWrap');
    if (!wrap) return;
    let hideTimer;
    wrap.addEventListener('click', () => {
      showSpeech();
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideSpeech, 2400);
    });
    // Авто-шоу speech каждые 12с на 2.5с
    setInterval(() => {
      showSpeech();
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideSpeech, 2500);
    }, 12000);
  }

  // ============================================================
  // INTERACTION: SCRUBBER (с magnetic snap)
  // ============================================================
  function setupScrubber(){
    const track = document.getElementById('timelineTrack');
    const axis  = document.getElementById('timelineAxis');
    if (!track || !axis) return;
    let dragging = false;
    let lastTap = 0;

    function pickHour(e){
      const rect = axis.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      // Учитываем zoomed viewBox
      const svg = document.querySelector('.timeline-svg');
      const vb = svg ? svg.viewBox.baseVal : { x:0, width:SVG_W };
      const visW = vb.width;
      const vbX  = vb.x;
      const xInSvg = vbX + (cx - rect.left) * (visW / rect.width);
      const rawHour = hourFromX(xInSvg);
      // Magnetic snap к ближайшему событию (если близко)
      for (const ev of EVENTS){
        if (Math.abs(rawHour - ev.start) < 0.15) return ev.start;
      }
      return rawHour;
    }
    function onDown(e){
      // Double-tap / double-click → zoom toggle
      const now = Date.now();
      if (e.touches ? e.touches.length === 1 : true){
        if (now - lastTap < 280){
          toggleZoomAt(e);
          lastTap = 0;
          e.preventDefault();
          return;
        }
        lastTap = now;
      }
      dragging = true;
      const s = document.getElementById('tlScrubber');
      if (s) s.classList.add('is-dragging');
      setMomentHour(pickHour(e), true);
      e.preventDefault();
    }
    function toggleZoomAt(e){
      const rect = axis.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      const svg = document.querySelector('.timeline-svg');
      const vb = svg ? svg.viewBox.baseVal : { x:0, width:SVG_W };
      const visW = vb.width;
      const vbX  = vb.x;
      const xInSvg = vbX + (cx - rect.left) * (visW / rect.width);
      const h = hourFromX(xInSvg);
      if (ZOOM > 1.05){
        setZoom(1, 12);
      } else {
        setZoom(3.5, h);
        setMomentHour(h, true);
      }
    }
    function onMove(e){
      if (!dragging) return;
      setMomentHour(pickHour(e), true);
      e.preventDefault();
    }
    function onUp(){
      dragging = false;
      const s = document.getElementById('tlScrubber');
      if (s) s.classList.remove('is-dragging');
    }
    // Wheel-zoom (desktop)
    axis.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = axis.getBoundingClientRect();
      const svg = document.querySelector('.timeline-svg');
      const vb = svg ? svg.viewBox.baseVal : { x:0, width:SVG_W };
      const visW = vb.width;
      const vbX  = vb.x;
      const xInSvg = vbX + (e.clientX - rect.left) * (visW / rect.width);
      const h = hourFromX(xInSvg);
      const delta = e.deltaY > 0 ? -0.6 : 0.6;
      const newZoom = Math.max(1, Math.min(6, ZOOM + delta));
      setZoom(newZoom, h);
      if (newZoom > 1) setMomentHour(h, true);
    }, { passive:false });

    track.addEventListener('mousedown', onDown);
    track.addEventListener('touchstart', onDown, {passive:false});
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }

  // ============================================================
  // DYNAMIC HERO
  // ============================================================
  function setupDynamicBackground(){
    document.body.setAttribute('data-time-period', periodForHour(hoursNow()));
  }
  function setupGreeting(){
    const g = greetingForHour(hoursNow());
    const txt = document.getElementById('heroGreetText');
    const ic = document.getElementById('heroGreetIcon');
    if (txt) txt.textContent = g.text;
    if (ic){
      ic.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="'+g.color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ICONS[g.icon]+'</svg>';
    }
  }
  function setupDate(){
    const el = document.getElementById('heroDate');
    if (!el) return;
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const days = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
    const d = NOW;
    el.textContent = days[d.getDay()] + ' · ' + d.getDate() + ' ' + months[d.getMonth()] + ' · ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function setupSubline(){
    const el = document.getElementById('heroSubline');
    if (!el) return;
    const mood = moodAt(hoursNow());
    const r = Math.round(mood.v);
    let phrase;
    if (r >= 75) phrase = 'день будет сильным';
    else if (r >= 60) phrase = 'день в норме';
    else phrase = 'береги ресурс';
    el.textContent = phrase;

    // Синхронизируем hero-trend с реальным значением + delta
    const NORM = 72;
    const num = document.getElementById('heroTrendNum');
    const delta = document.getElementById('heroTrendDelta');
    if (num) num.textContent = r;
    if (delta){
      const d = r - NORM;
      let arrow, cls;
      if (d > 0)      { arrow = '↑ +'; cls = 'is-up'; }
      else if (d < 0) { arrow = '↓ ';   cls = 'is-down'; }
      else            { arrow = '= ';   cls = 'is-flat'; }
      delta.textContent = arrow + Math.abs(d);
      delta.classList.remove('is-up','is-down','is-flat');
      delta.classList.add(cls);
    }
    const foot = document.getElementById('heroTrendFoot');
    if (foot){
      if (r > NORM) foot.textContent = 'Норма ' + NORM + ' · сегодня выше';
      else if (r === NORM) foot.textContent = 'Норма ' + NORM + ' · в норме';
      else foot.textContent = 'Норма ' + NORM + ' · сегодня ниже';
    }
  }
  function setupNowStrip(){
    const t = document.getElementById('nowTime');
    const tx = document.getElementById('nowText');
    const th = document.getElementById('thNow');
    if (t) t.textContent = 'Сейчас ' + pad2(NOW.getHours()) + ':' + pad2(NOW.getMinutes());
    if (th) th.textContent = pad2(NOW.getHours()) + ':' + pad2(NOW.getMinutes());
    if (tx){
      const steps = metricAt('steps', hoursNow());
      tx.textContent = 'шагов ' + steps.toLocaleString('ru-RU') + ' из 8 000';
    }
  }

  function setupPageIndicator(){
    const dots = document.querySelectorAll('.pi-dot');
    const sections = document.querySelectorAll('.snap-section');

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const target = dot.dataset.target;
        const sec = document.querySelector('.snap-section[data-section="'+target+'"]');
        if (sec) sec.scrollIntoView({ behavior:'smooth' });
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.4){
          const s = e.target.dataset.section;
          dots.forEach(d => d.classList.toggle('is-active', d.dataset.target === s));
        }
      });
    }, { root: document.querySelector('.app'), threshold:[0.4, 0.6] });
    sections.forEach(s => io.observe(s));
  }

  function tick(){
    const d = new Date();
    if (d.getMinutes() !== NOW.getMinutes()){
      NOW.setTime(d.getTime());
      setupDate();
      setupNowStrip();
    }
  }

  function init(){
    setupDynamicBackground();
    setupGreeting();
    setupDate();
    setupSubline();
    setupNowStrip();

    const svg = document.querySelector('.timeline-svg');
    if (svg){
      renderMoodPath(svg);
      renderMoodDots(svg);
      renderTodLabels(svg);
      renderEvents(svg, 1);
    }

    const nowH = hoursNow();
    const startH = Math.min(Math.max(nowH, DAY_START), DAY_END);
    setMomentHour(startH, true);
    renderNextEvent(startH);
    setupScrubber();
    setupZoomButton();
    setupPeriodTabs();
    setupMascotInteraction();
    setupTrendPanel();
    setupModals();
    setupNextAction();
    renderPatterns();

    setInterval(tick, 30*1000);
  }

  // ============== PATTERNS (honest correlations) ==============
  // Утилита: достать history-данные и вычислить «главный сигнал дня»
  function pickDailySignal(all, h){
    // Приоритет по релевантности текущему часу
    const relevance = {
      'sleep_readiness': [6,7,8,9,10,22,23],  // утро + планирование сна
      'morning_workout': [6,7,8,9,10,11],
      'sitting_dip':     [11,12,13,14,15],
      'caffeine_loop':   [7,8,9,10,11,12,13,14],
      'active_readiness':[6,7,8,9],
      'steps_mood':      [17,18,19,20,21],
      'dinner_sleep':    [18,19,20,21],
      'winddown_sleep':  [20,21,22,23]
    };
    const confirmed = all.filter(p => p.tier === 'confirmed');
    if (confirmed.length === 0) return null;
    // Сортируем: релевантные часу → выше; потом по effect
    return confirmed.slice().sort((a, b) => {
      const ra = (relevance[a.id] || []).includes(Math.floor(h)) ? 1 : 0;
      const rb = (relevance[b.id] || []).includes(Math.floor(h)) ? 1 : 0;
      if (rb !== ra) return rb - ra;
      return b.effect - a.effect;
    })[0];
  }

  function renderPatterns(){
    if (!window.AtlasPatterns) return;
    const all = window.AtlasPatterns.analyze();
    const nowH = hoursNow();

    // 1) Hero signal — 1 строка
    const sigBtn = document.getElementById('heroSignal');
    const sigText = document.getElementById('heroSignalText');
    const sigIc = document.getElementById('heroSignalIc');
    if (sigBtn && sigText && sigIc){
      const sig = pickDailySignal(all, nowH);
      if (sig){
        const tone = sig.effect > 0.4 ? 'good' : 'warn';
        sigBtn.className = 'hero-signal is-' + tone;
        const color = tone === 'good' ? '#2FA36B' : '#C98A1F';
        sigIc.innerHTML = window.AtlasPatterns.iconSvg(sig.icon, color);
        // Контекстная формулировка: «X. Сейчас Y. Что делать»
        sigText.textContent = sig.title;
        sigBtn.dataset.patternId = sig.id;
        // Мини-кольцо текущего статуса
        if (window.AtlasMetrics){
          const m = window.AtlasMetrics.metricsAt(nowH);
          const ring = document.getElementById('heroMiniFill');
          if (ring){
            const r = +ring.getAttribute('r');
            const C = 2 * Math.PI * r;
            const filled = (m.status / 100) * C;
            ring.style.strokeDashoffset = (C - filled);
          }
        }
      } else {
        sigBtn.style.display = 'none';
      }
    }

    // 2) Summary card — сегмент-бар + кнопка
    const counts = {
      confirmed: all.filter(p => p.tier === 'confirmed').length,
      observed:  all.filter(p => p.tier === 'observed').length,
      insufficient: all.filter(p => p.tier === 'insufficient').length
    };
    const total = counts.confirmed + counts.observed + counts.insufficient;
    const totalEl = document.getElementById('patternsTotalCount');
    if (totalEl) totalEl.textContent = total;

    const bars = document.getElementById('patternsSummaryBars');
    if (bars && total > 0){
      bars.innerHTML = ['confirmed','observed','insufficient']
        .filter(t => counts[t] > 0)
        .map(t => `<div class="psb-seg" data-tier="${t}" style="flex:${counts[t]}" title="${counts[t]} ${t}"></div>`)
        .join('');
    }

    // 3) Modal tiers (список) — рендерим заранее
    const tiers = document.getElementById('patternsModalTiers');
    if (tiers){
      const labels = { confirmed:'Подтверждено', observed:'Замечено', insufficient:'Мало данных' };
      const tierOrder = ['confirmed','observed','insufficient'];
      // Скрываем «Мало данных» если пусто
      tiers.innerHTML = tierOrder
        .filter(t => counts[t] > 0)
        .map(t => {
          const items = all.filter(p => p.tier === t);
          return `
            <div class="modal-tier" data-tier="${t}">
              <div class="modal-tier-head">
                <span class="modal-tier-dot" aria-hidden="true"></span>
                <span class="modal-tier-label">${labels[t]}</span>
                <span class="modal-tier-count">${items.length}</span>
              </div>
              <div class="modal-tier-list">
                ${items.map(p => {
                  const color = t === 'confirmed' ? '#2FA36B' : t === 'observed' ? '#C98A1F' : '#9A8F82';
                  const conf = Math.round(p.confidence * 100);
                  return `
                    <button class="modal-pattern-item" data-pattern-id="${p.id}" type="button">
                      <span class="modal-pattern-ic">${window.AtlasPatterns.iconSvg(p.icon, color)}</span>
                      <span class="modal-pattern-body">
                        <span class="modal-pattern-title">${p.title}</span>
                        <span class="modal-pattern-sub">${p.sub}</span>
                        <span class="modal-pattern-stats">
                          <span class="stat-tag">n=${p.n}</span>
                          <span class="stat-tag">эффект ${Math.round(p.effect*100)}%</span>
                          <span class="stat-bar"><span class="stat-bar-fill" style="width:${conf}%"></span></span>
                        </span>
                      </span>
                      <span class="modal-pattern-chev">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                      </span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('');
    }
  }

  // ============== MODAL CONTROLLER ==============
  function openModal(id){
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id){
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('is-open');
    setTimeout(() => { m.hidden = true; }, 280);
    document.body.style.overflow = '';
  }
  // Клик по кнопке next-action: подтверждение, что действие выполнено.
  // В скелетной версии — локальная визуальная обратная связь.
  function setupNextAction(){
    const btn = document.getElementById('nextActionBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const wrap = document.getElementById('nextAction');
      if (!wrap) return;
      btn.disabled = true;
      btn.textContent = 'Готово';
      btn.style.opacity = '.6';
      wrap.style.transition = 'opacity .3s var(--ease)';
      wrap.style.opacity = '.55';
    });
  }

  function setupModals(){
    // Закрытие по клику на бэдроп / крестик
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-close-modal]');
      if (t){
        const modal = t.closest('.modal');
        if (modal) closeModal(modal.id);
        return;
      }
      // Клик на паттерн в модалке → детали
      const item = e.target.closest('[data-pattern-id]');
      if (item){
        const id = item.dataset.patternId;
        if (id) openPatternDetail(id);
        return;
      }
      // Кнопка «назад к списку»
      const back = e.target.closest('[data-open-patterns]');
      if (back){
        closeModal('patternDetailModal');
        setTimeout(() => openModal('patternsModal'), 200);
        return;
      }
    });
    // ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){
        const open = document.querySelector('.modal.is-open');
        if (open) closeModal(open.id);
      }
    });
    // Hero-signal → открывает детали
    const heroSignal = document.getElementById('heroSignal');
    if (heroSignal){
      heroSignal.addEventListener('click', () => {
        const id = heroSignal.dataset.patternId;
        if (id) openPatternDetail(id);
      });
    }
    // Кнопка «Открыть все паттерны» в summary
    const openBtn = document.getElementById('openPatternsModal');
    if (openBtn){
      openBtn.addEventListener('click', () => openModal('patternsModal'));
    }
  }

  function openPatternDetail(id){
    if (!window.AtlasPatterns) return;
    const all = window.AtlasPatterns.analyze();
    const p = all.find(x => x.id === id);
    if (!p) return;
    renderPatternDetail(p);
    openModal('patternDetailModal');
  }

  function renderPatternDetail(p){
    const titleEl = document.getElementById('patternDetailTitle');
    const body = document.getElementById('patternDetailBody');
    if (!body) return;
    if (titleEl) titleEl.textContent = p.title;

    // Достаём реальные цифры из истории, чтобы показать в графике
    const hist = window.AtlasPatterns.getHistory();
    const color = p.tier === 'confirmed' ? '#2FA36B' : p.tier === 'observed' ? '#C98A1F' : '#9A8F82';

    // Специфичные блоки под каждый паттерн
    let bodyHtml = '';

    if (p.id === 'sleep_readiness'){
      const sleeps = hist.map(d => d.sleep);
      const readiness = hist.map(d => d.readiness);
      const bins = [
        { label:'<6ч',     min:0,  max:6,  data:[] },
        { label:'6-6.5ч',  min:6,  max:6.5,data:[] },
        { label:'6.5-7ч',  min:6.5,max:7,  data:[] },
        { label:'7-7.5ч',  min:7,  max:7.5,data:[] },
        { label:'>7.5ч',   min:7.5,max:24, data:[] }
      ];
      hist.forEach(d => { for (const b of bins) if (d.sleep >= b.min && d.sleep < b.max) { b.data.push(d.readiness); break; } });
      const maxR = 100;
      bodyHtml = barChart(bins, maxR, 'Средняя готовность', p.sub);
    } else if (p.id === 'morning_workout'){
      const withW = hist.filter(d => d.workout);
      const morning = withW.filter(d => d.workoutHour < 12);
      const evening = withW.filter(d => d.workoutHour >= 12);
      const groups = [
        { label:'Утро (до 12)', data: morning.map(d => d.sleepQuality) },
        { label:'День/вечер',   data: evening.map(d => d.sleepQuality) },
        { label:'Без трени',    data: hist.filter(d => !d.workout).map(d => d.sleepQuality) }
      ];
      bodyHtml = barChart(groups, 100, 'Качество сна', p.sub);
    } else if (p.id === 'sitting_dip'){
      const groups = [
        { label:'<5ч сидя',   data: hist.filter(d => d.sitHours < 5).map(d => 100 - d.afternoonDip) },
        { label:'5-7ч',       data: hist.filter(d => d.sitHours >= 5 && d.sitHours < 7).map(d => 100 - d.afternoonDip) },
        { label:'7ч+',        data: hist.filter(d => d.sitHours >= 7).map(d => 100 - d.afternoonDip) }
      ];
      bodyHtml = barChart(groups, 100, 'Энергия после обеда', p.sub);
    } else if (p.id === 'caffeine_loop'){
      const groups = [
        { label:'Сон <6.5ч',  data: hist.filter(d => d.sleep < 6.5).map(d => d.caffeine) },
        { label:'Сон 6.5-7ч', data: hist.filter(d => d.sleep >= 6.5 && d.sleep < 7).map(d => d.caffeine) },
        { label:'Сон 7ч+',    data: hist.filter(d => d.sleep >= 7).map(d => d.caffeine) }
      ];
      bodyHtml = barChart(groups, 6, 'Чашек кофе', p.sub, 'max');
    } else if (p.id === 'active_readiness'){
      const groups = [
        { label:'<5к шагов',  data: hist.filter(d => d.steps < 5000).map(d => d.readiness) },
        { label:'5-7к',       data: hist.filter(d => d.steps >= 5000 && d.steps < 7000).map(d => d.readiness) },
        { label:'7-9к',       data: hist.filter(d => d.steps >= 7000 && d.steps < 9000).map(d => d.readiness) },
        { label:'9к+',        data: hist.filter(d => d.steps >= 9000).map(d => d.readiness) }
      ];
      bodyHtml = barChart(groups, 100, 'Готовность', p.sub);
    } else if (p.id === 'steps_mood'){
      const groups = [
        { label:'<5к',        data: hist.filter(d => d.steps < 5000).map(d => d.eveningMood) },
        { label:'5-7к',       data: hist.filter(d => d.steps >= 5000 && d.steps < 7000).map(d => d.eveningMood) },
        { label:'7-9к',       data: hist.filter(d => d.steps >= 7000 && d.steps < 9000).map(d => d.eveningMood) },
        { label:'9к+',        data: hist.filter(d => d.steps >= 9000).map(d => d.eveningMood) }
      ];
      bodyHtml = barChart(groups, 100, 'Настроение вечером', p.sub);
    } else if (p.id === 'dinner_sleep'){
      const groups = [
        { label:'Ужин до 20:00', data: hist.filter(d => d.dinnerEarly).map(d => d.sleepQuality) },
        { label:'После 20:00',   data: hist.filter(d => !d.dinnerEarly).map(d => d.sleepQuality) }
      ];
      bodyHtml = barChart(groups, 100, 'Качество сна', p.sub);
    } else if (p.id === 'winddown_sleep'){
      const groups = [
        { label:'С рутиной',     data: hist.filter(d => d.winddown).map(d => d.sleepQuality) },
        { label:'Без',           data: hist.filter(d => !d.winddown).map(d => d.sleepQuality) }
      ];
      bodyHtml = barChart(groups, 100, 'Качество сна', p.sub);
    } else {
      bodyHtml = `<p class="pd-lead">${p.sub}</p>`;
    }

    // Сетка статистики
    const stats = `
      <div class="pd-grid">
        <div class="pd-cell"><div class="pd-cell-label">Наблюдений</div><div class="pd-cell-val">${p.n}</div></div>
        <div class="pd-cell"><div class="pd-cell-label">Эффект</div><div class="pd-cell-val ${p.effect > 0.4 ? 'is-good' : p.effect < 0.2 ? 'is-bad' : ''}">${Math.round(p.effect*100)}%</div></div>
        <div class="pd-cell"><div class="pd-cell-label">Доверие</div><div class="pd-cell-val">${Math.round(p.confidence*100)}%</div></div>
      </div>
    `;

    body.innerHTML = `
      <section class="pd-section">
        <div class="pd-eyebrow">${p.tier === 'confirmed' ? 'Подтверждённый паттерн' : p.tier === 'observed' ? 'Замеченный паттерн' : 'Недостаточно данных'}</div>
        <h3 class="pd-headline">${p.title}</h3>
        <p class="pd-lead">${p.sub}</p>
        ${stats}
      </section>
      <section class="pd-section">${bodyHtml}</section>
      <section class="pd-section">
        <div class="pd-action">
          <span class="pd-action-ic">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </span>
          <span class="pd-action-text">${p.action}</span>
        </div>
      </section>
      <section class="pd-section">
        <div class="pd-method"><b>Как считали:</b> сравнили средние значения по группам за ${p.n} ${p.n === 1 ? 'день' : p.n < 5 ? 'дня' : 'дней'}. Эффект — относительная разница в процентах. Доверие — насколько стабильно паттерн повторялся.</div>
      </section>
    `;
  }

  // Хелпер: рендер столбчатого графика «группы → среднее»
  function barChart(groups, maxVal, yLabel, lead, scaleMode){
    const vals = groups.map(g => g.data.length ? g.data.reduce((a,b)=>a+b,0) / g.data.length : 0);
    const max = scaleMode === 'max' ? Math.max(maxVal, ...vals) * 1.1 : maxVal;
    const bars = groups.map((g, i) => {
      const v = vals[i];
      const h = Math.max(2, Math.round((v / max) * 100));
      const n = g.data.length;
      return `
        <div class="pd-bar-col${i > 0 ? ' is-compare' : ''}">
          <div class="pd-bar-val">${Math.round(v)}${scaleMode === 'max' ? '' : '%'}</div>
          <div class="pd-bar-track"><div class="pd-bar-fill" style="height:${h}%"></div></div>
          <div class="pd-bar-label">${g.label}</div>
          <div class="pd-bar-label" style="opacity:.6">n=${n}</div>
        </div>
      `;
    }).join('');
    return `
      <div class="pd-eyebrow">${yLabel} по группам</div>
      <div class="pd-bar-chart">${bars}</div>
    `;
  }

  function setupTrendPanel(){
    const btn = document.getElementById('trendExpandBtn');
    const panel = document.getElementById('trendPanel');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen){
        panel.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        btn.querySelector('.teb-label').textContent = 'Развернуть тренд за неделю';
      } else {
        panel.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        btn.querySelector('.teb-label').textContent = 'Свернуть тренд';
        // Плавный скролл к раскрытой панели
        setTimeout(() => {
          panel.scrollIntoView({ behavior:'smooth', block:'start' });
        }, 50);
      }
    });

    // Период-табы внутри панели
    panel.querySelectorAll('.period-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        panel.querySelectorAll('.period-tab').forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        const period = tab.dataset.period;
        // Тут в реале — подгрузка данных. Пока обновим заголовок недели.
        const title = panel.querySelector('.week-chart .card-title');
        if (title){
          const map = { week:'Готовность по дням', month:'Готовность по неделям', year:'Готовность по месяцам' };
          title.textContent = map[period] || title.textContent;
        }
      });
    });

    // Hero-trend клик → открывает/фокусирует панель тренда
    const heroTrend = document.getElementById('heroTrend');
    if (heroTrend){
      heroTrend.addEventListener('click', () => {
        const b = document.getElementById('trendExpandBtn');
        if (!b) return;
        if (b.getAttribute('aria-expanded') !== 'true') b.click();
        else b.scrollIntoView({ behavior:'smooth', block:'center' });
      });
    }
  }

  function setupZoomButton(){
    const btn = document.getElementById('thZoom');
    const axis = document.getElementById('timelineAxis');
    if (!btn || !axis) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (ZOOM > 1.05){
        setZoom(1, 12);
        axis.classList.remove('is-zoomed');
        // Возврат к выбранному периоду
        applyPeriod(ACTIVE_PERIOD);
      } else {
        const nowH = hoursNow();
        setZoom(3.5, nowH);
        axis.classList.add('is-zoomed');
        setMomentHour(nowH, true);
      }
    });
  }

  function setupPeriodTabs(){
    document.querySelectorAll('.th-period').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.period;
        if (key) applyPeriod(key);
      });
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

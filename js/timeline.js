(function(){
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_W = 700;
  const SVG_H = 180;
  const TL_LEFT_PAD = 6;
  const TL_RIGHT_PAD = 18;
  const DAY_START = 6;
  const DAY_END = 24;

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
  const el = (n, a, t) => {
    const e = document.createElementNS(SVG_NS, n);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    if (t != null) e.textContent = t;
    return e;
  };

  // Маппинг mood value (0-100) в Y-координату: 0 → 150 (низ), 100 → 30 (верх)
  const moodY = v => 30 + ((100 - v) / 100) * 120;
  const clampY = y => Math.max(28, Math.min(155, y));

  // Ширина pill-карточки: иконка + 2px + время/подпись
  const PILL_W = 68;
  const PILL_H = 28;
  const PILL_GAP = 8;
  const PILL_ROW_H = 34;

  // Минимальный горизонтальный зазор между карточками на стороне (в SVG-юнитах).
  // Если два события ближе — склеиваем в стек (counter "+N").
  const STACK_THRESHOLD = 50;  // ~45 мин между событиями → стек

  // Сгруппировать события по стороне (top/bottom), упаковать в строки и стеки.
  // visualScale = 1.0 в обычном режиме, > 1.0 при зуме — пороги сжаты.
  function packEvents(visualScale){
    visualScale = visualScale || 1;
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

    const tops = EVENTS.filter(e => e.side === 'top').map(e => ({...e, x: xFromHour(e.start)}));
    const bots = EVENTS.filter(e => e.side === 'bottom').map(e => ({...e, x: xFromHour(e.start)}));
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
    const points = MOOD.map(p => ({ x: xFromHour(p.h), y: clampY(moodY(p.v)) }));
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
    ];
    labels.forEach(l => {
      const x = xFromHour(l.h);
      g.appendChild(el('text', { x:x, y:14, class:'tl-tod-label' }, l.text));
    });
    svg.appendChild(g);
  }

  function renderEvents(svg, visualScale){
    const packed = packEvents(visualScale || 1);

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
        // === FULL CARD ===
        const pillX = xCenter - PILL_W/2;
        const pillY = pillTop;
        grp.appendChild(el('rect', {
          x:pillX, y:pillY, width:PILL_W, height:PILL_H, rx:8, ry:8,
          class:'tl-pill-bg'
        }));
        grp.appendChild(el('rect', {
          x:pillX, y:pillY, width:3, height:PILL_H, rx:1.5, ry:1.5,
          fill: color, opacity:.95
        }));
        const iconCx = pillX + 13;
        const iconCy = pillY + PILL_H/2;
        grp.appendChild(el('circle', {
          cx:iconCx, cy:iconCy, r:7.5,
          fill: color, class:'tl-pill-icon-bg'
        }));
        grp.appendChild(el('g', {
          transform:'translate('+(iconCx-5)+' '+(iconCy-5)+') scale(.42)',
          class:'tl-pill-icon', style:'stroke:#fff'
        })).innerHTML = EVENT_ICON[lead.icon] || EVENT_ICON.sun;
        grp.appendChild(el('text', {
          x:pillX + 24, y:pillY + 11, class:'tl-pill-time'
        }, fmtTime(lead.start)));
        const shortLabel = lead.label.length > 9 ? lead.label.slice(0,9)+'…' : lead.label;
        grp.appendChild(el('text', {
          x:pillX + 24, y:pillY + PILL_H - 7, class:'tl-pill-label'
        }, shortLabel));
        grp.addEventListener('click', () => setMomentHour(lead.start, true));
      } else {
        // === STACK COUNTER "+N" ===
        // Маленький круглый бейдж с количеством + цветной точкой
        const r = 10;
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
    const deltasEl = document.getElementById('momentDeltas');

    if (timeEl) timeEl.textContent = fmtTime(h);
    if (titleEl) titleEl.textContent = m.event ? m.event.label : 'Сейчас';
    if (descEl) descEl.textContent = describeEvent(m.event, h);

    if (deltasEl){
      deltasEl.innerHTML = '';
      m.deltas.forEach(d => {
        const dir = d.to > d.from ? 'up' : (d.to < d.from ? 'down' : 'flat');
        const arrow = dir === 'up' ? '↑' : (dir === 'down' ? '↓' : '—');
        const fromTxt = d.from === d.to ? '' : '<span class="dc-from">'+d.from+d.suffix+'</span><span class="dc-arrow"> '+arrow+'</span>';
        const html =
          '<div class="dc">'+
            '<div class="dc-label">'+d.label+'</div>'+
            '<div class="dc-row">'+fromTxt+'<span class="dc-to '+dir+'">'+d.to+d.suffix+'</span></div>'+
            '<div class="dc-bar"><div class="dc-bar-fill" style="width:'+Math.max(6,Math.min(100,d.bar))+'%"></div></div>'+
            '<div class="dc-lag">'+d.lag+'</div>'+
          '</div>';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        deltasEl.appendChild(tmp.firstChild);
      });
    }

    if (insightEl){
      insightEl.innerHTML =
        '<span class="mi-ic">'+
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-4 12.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26A7 7 0 0 0 12 2z"/><path d="M9 21h6"/></svg>'+
        '</span>'+
        '<span>'+m.insight+'</span>';
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

  // ============================================================
  // MASCOT — premium multi-state character
  // ============================================================
  const MASCOT_SPEECH = {
    morning_happy:  'Доброе утро!',
    morning_calm:   'Чай с лимоном…',
    morning_sad:    'Не выспался…',
    day_happy:      'Отличный день!',
    day_calm:       'Продуктивно иду',
    day_tired:      'Нужен перерыв',
    day_sad:        'Сил нет…',
    evening_happy:  'Пик формы!',
    evening_calm:   'Хороший вечер',
    evening_tired:  'Устал сегодня',
    evening_sad:    'Хочется спать',
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
    if (r >= 75) el.textContent = 'Готовность ' + r + ' — день будет сильным';
    else if (r >= 60) el.textContent = 'Готовность ' + r + ' — день в норме';
    else el.textContent = 'Готовность ' + r + ' — береги ресурс';
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
    setupMascotInteraction();
    setupPageIndicator();

    setInterval(tick, 30*1000);
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
      } else {
        const nowH = hoursNow();
        setZoom(3.5, nowH);
        axis.classList.add('is-zoomed');
        setMomentHour(nowH, true);
      }
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

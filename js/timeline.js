(function(){
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_W = 700;
  const SVG_H = 140;
  const TL_AXIS_Y = 80;
  const TL_LEFT_PAD = 6;
  const TL_RIGHT_PAD = 18;
  const DAY_START = 6;
  const DAY_END = 24;

  const EVENTS = [
    { id:'sleep-am',  start:6,    end:8,    type:'sleep',   label:'Сон',     state:'rest' },
    { id:'wake',     start:8.5,         type:'wake',    label:'Подъём',  state:'good' },
    { id:'workout',  start:12,    end:13,  type:'workout', label:'Силовая', state:'load' },
    { id:'meal-l',   start:14,          type:'meal',    label:'Обед',    state:'good' },
    { id:'checkin',  start:16,          type:'checkin', label:'Check-in',state:'good' },
    { id:'meal-d',   start:19,          type:'meal',    label:'Ужин',    state:'good' },
    { id:'sleep-pm', start:22.5,        type:'sleep',   label:'Сон',     state:'rest' }
  ];

  const METRICS = {
    readiness: { 6:72, 9:75, 12:82, 15:80, 18:76, 21:74, 24:72 },
    energy:    { 6:60, 9:68, 12:75, 15:62, 18:70, 21:68, 24:55 },
    steps:     { 6:0,  9:1200, 12:2400, 15:4200, 18:6800, 21:8400, 24:9200 }
  };

  // Эмоциональный ландшафт дня: 5 состояний (отлично/хорошо/средне/тяжело/ужасно)
  // Значение 0-100 где 100 = отлично, 0 = ужасно
  const MOOD = [
    { h:6,    v:60, label:'сон' },
    { h:7,    v:75, label:'восстановление' },
    { h:8,    v:80, label:'бодро' },
    { h:9,    v:85, label:'отлично' },
    { h:10,   v:78, label:'хорошо' },
    { h:11,   v:72, label:'норма' },
    { h:12,   v:55, label:'нагрузка' },
    { h:13,   v:48, label:'тяжело' },
    { h:14,   v:62, label:'восстановление' },
    { h:15,   v:78, label:'хорошо' },
    { h:16,   v:88, label:'отлично' },
    { h:17,   v:85, label:'пик' },
    { h:18,   v:72, label:'хорошо' },
    { h:19,   v:80, label:'хорошо' },
    { h:20,   v:75, label:'норма' },
    { h:21,   v:60, label:'спад' },
    { h:22,   v:40, label:'усталость' },
    { h:23,   v:30, label:'тяжело' },
    { h:24,   v:25, label:'сон' }
  ];

  const STATE_COLORS = {
    good: '#2FBF9B',
    load: '#F0764B',
    warn: '#E5677E',
    rest: '#7B74D6',
    bad:  '#D06552'
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
  const el = (n, a, t) => {
    const e = document.createElementNS(SVG_NS, n);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    if (t != null) e.textContent = t;
    return e;
  };

  // Маппинг значения 0-100 в Y-координату (выше = лучше)
  const moodY = v => TL_AXIS_Y - ((v - 25) / 75) * 50; // 25→80, 100→30
  // Безопасный clamp
  const clampY = y => Math.max(30, Math.min(120, y));

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
    if (prev === next) return prev;
    const t = (h - prev.h) / (next.h - prev.h);
    return {
      h, v: prev.v*(1-t) + next.v*t,
      label: prev.v < next.v ? next.label : prev.label
    };
  }
  function moodLabel(v){
    if (v >= 80) return 'отлично';
    if (v >= 65) return 'хорошо';
    if (v >= 50) return 'норма';
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
    const rFrom = metricAt('readiness', Math.max(DAY_START, h-0.5));
    const rTo   = metricAt('readiness', h);
    const eFrom = metricAt('energy', Math.max(DAY_START, h-0.5));
    const eTo   = metricAt('energy', h);
    const s     = metricAt('steps', h);

    const deltas = [
      { label:'Готовность', from:rFrom, to:rTo, lag:'сейчас',    suffix:'',    bar:rTo },
      { label:'Энергия',    from:eFrom, to:eTo, lag:'через 30м', suffix:'%', bar:eTo },
      { label:'Шаги',       from:Math.max(0,s-800), to:s, lag:'сегодня', suffix:'', bar:Math.min(100,Math.round(s/90)) }
    ];
    return { event, deltas, insight: makeInsight(event, h, rTo, eTo) };
  }

  function makeInsight(event, h, readiness, energy){
    if (event){
      if (event.type === 'meal' && event.id === 'meal-l'){
        return 'Плотный обед с углеводами — к 15:00 возможен спад энергии. Прогулка в 15:30 вернёт тонус.';
      }
      if (event.type === 'workout'){
        return 'Силовая в обед снизит стресс через 1-2ч. Пик восстановления придётся на 16:00.';
      }
      if (event.type === 'checkin'){
        return 'Хороший момент проверить самочувствие. Запись займёт 10 секунд.';
      }
      if (event.type === 'sleep' && h < 8){
        return 'Сон 7ч 12м, качество 78%. Восстановление хорошее — день будет сильным.';
      }
      if (event.type === 'meal' && event.id === 'meal-d'){
        return 'Лёгкий ужин за 3ч до сна улучшит качество отдыха. Избегай углеводов.';
      }
      if (event.type === 'sleep' && event.id === 'sleep-pm'){
        return 'Ложись до 23:00 — завтра готовность будет на 8 пунктов выше.';
      }
      if (event.type === 'wake'){
        return 'Подъём. Готовность высокая. Сегодня можно тренироваться в полную силу.';
      }
    }
    if (h >= 20) return 'Вечер — лучшее время для расслабления. Рутина в 21:00 улучшит сон.';
    if (readiness >= 75) return 'Готовность в норме. Можно дать полную нагрузку сегодня.';
    if (readiness < 60)  return 'Готовность снижена. Лёгкая активность и сон восстановят форму.';
    return 'День идёт ровно. Следи за водой и шагами.';
  }

  function describeEvent(event, h){
    if (!event){
      if (h >= 22) return 'Поздний вечер. Время готовиться ко сну.';
      if (h >= 19) return 'Вечер. Самое время расслабиться.';
      if (h >= 16) return 'Послеобеденное время. Следи за энергией.';
      if (h >= 12) return 'Середина дня. Активность на пике.';
      if (h >= 8)  return 'Утро. Набирай темп.';
      return 'Раннее утро.';
    }
    if (event.type === 'sleep' && event.id === 'sleep-am') return 'Сон 7ч 12м · качество 78%';
    if (event.type === 'wake')   return 'Подъём. Готовность высокая';
    if (event.type === 'workout')return 'Силовая 45 мин · интенсивность 7/10';
    if (event.type === 'meal' && event.id === 'meal-l') return 'Сбалансированный обед · 580 ккал';
    if (event.type === 'meal')   return 'Лёгкий ужин · 420 ккал';
    if (event.type === 'checkin')return 'Микро-пауза. Отметь, как ты сейчас';
    if (event.type === 'sleep' && event.id === 'sleep-pm') return 'Подготовка ко сну';
    return '';
  }

  // =========================================
  // RENDER: TIMELINE
  // =========================================
  function renderHours(svg){
    const g = el('g');
    const hours = [6,9,12,15,18,21,24];
    const nowH = hoursNow();
    let nearest = hours[0];
    for (const hh of hours) if (Math.abs(hh-nowH) < Math.abs(nearest-nowH)) nearest = hh;
    for (const hh of hours){
      const t = el('text', { x:xFromHour(hh), y:TL_AXIS_Y+50, 'data-hour':hh }, String(hh).padStart(2,'0'));
      if (hh === nearest) t.classList.add('is-now');
      g.appendChild(t);
    }
    svg.appendChild(g);
  }

  function renderMoodPath(svg){
    // Строим плавную mood-кривую через весь день
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

    // Area fill под кривой
    const last = points[points.length-1];
    const first = points[0];
    const areaD = d + ` L${last.x} ${TL_AXIS_Y+30} L${first.x} ${TL_AXIS_Y+30} Z`;
    const moodArea = document.getElementById('tlMoodArea');
    if (moodArea) moodArea.setAttribute('d', areaD);
  }

  function renderMoodLabels(svg){
    // Рисуем метки в точках экстремумов (пик/спад)
    const g = el('g');
    const peaks = [
      { h:9, label:'отлично', cls:'mood-peak' },
      { h:13, label:'тяжело', cls:'mood-trough' },
      { h:16, label:'пик', cls:'mood-peak' },
      { h:23, label:'усталость', cls:'mood-trough' }
    ];
    peaks.forEach(p => {
      const m = moodAt(p.h);
      const x = xFromHour(p.h);
      const y = clampY(moodY(m.v));
      const labelY = p.cls === 'mood-peak' ? y - 14 : y + 22;
      g.appendChild(el('text', { x:x, y:labelY, class:p.cls }, p.label));
    });
    svg.appendChild(g);
  }

  function renderEvents(svg){
    const g = el('g');
    for (const ev of EVENTS){
      const isBlock = !!ev.end;
      const color = STATE_COLORS[ev.state] || STATE_COLORS.good;
      const grp = el('g', { 'data-event-id':ev.id, 'data-event-start':ev.start });
      if (isBlock){
        const x1 = xFromHour(ev.start);
        const x2 = xFromHour(ev.end);
        const w = x2 - x1;
        grp.appendChild(el('rect', {
          x:x1, y:TL_AXIS_Y-12, width:w, height:24, rx:12, ry:12,
          fill:color, 'fill-opacity':.22,
          stroke:color, 'stroke-width':1.2
        }));
        grp.appendChild(el('text', { x:(x1+x2)/2, y:TL_AXIS_Y+4 }, ev.label));
      } else {
        const x = xFromHour(ev.start);
        grp.appendChild(el('circle', {
          cx:x, cy:TL_AXIS_Y, r:7,
          fill:color, stroke:'#FDFCFA', 'stroke-width':2
        }));
        grp.appendChild(el('text', { x:x, y:TL_AXIS_Y-14 }, ev.label));
      }
      grp.addEventListener('click', () => setMomentHour(ev.start, true));
      g.appendChild(grp);
    }
    svg.appendChild(g);
  }
  function updateLineSegments(){
    const xNow = xFromHour(Math.min(hoursNow(), DAY_END));
    const past = document.getElementById('tlLinePast');
    const future = document.getElementById('tlLineFuture');
    if (past) past.setAttribute('x2', String(xNow));
    if (future) future.setAttribute('x1', String(xNow));
  }

  function setScrubber(h, snap){
    const x = xFromHour(Math.max(DAY_START, Math.min(DAY_END, h)));
    const scrub = document.getElementById('tlScrubber');
    if (scrub) scrub.setAttribute('transform', 'translate('+x+',0)');
    const aura = document.getElementById('tlAura');
    if (aura){
      aura.setAttribute('cx', String(x));
      const m = momentFor(h);
      const mood = moodAt(h);
      const ms = moodState(mood.v);
      const isLoad = m.event && m.event.state === 'load';
      const isBad = ms === 'bad';
      let grad = 'auraGood';
      if (isBad) grad = 'auraBad';
      else if (isLoad) grad = 'auraLoad';
      aura.setAttribute('fill', 'url(#'+grad+')');
      aura.setAttribute('opacity', snap ? '0.9' : '0.55');
    }
    // Mood label
    const moodEl = document.getElementById('timelineMood');
    if (moodEl){
      const mood = moodAt(h);
      moodEl.textContent = moodLabel(mood.v);
      moodEl.setAttribute('data-mood', moodState(mood.v));
    }
    // Mascot
    updateMascot(h);
  }
  function updateActiveEvent(h){
    const grps = document.querySelectorAll('#tlEvents g');
    grps.forEach(g => g.classList.remove('is-active'));
    const { event } = nearestEvent(h);
    if (!event) return;
    const node = document.querySelector('#tlEvents g[data-event-id="'+event.id+'"]');
    if (node) node.classList.add('is-active');
  }
  function setMomentHour(h, snap){
    setScrubber(h, snap);
    updateActiveEvent(h);
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
      ts.textContent = nextEv.type === 'checkin' ? 'Как ты сейчас?' :
                       nextEv.type === 'meal' ? 'Приём пищи' :
                       nextEv.type === 'workout' ? 'Силовая' :
                       nextEv.type === 'sleep' ? 'Подготовка ко сну' : 'Запланировано';
    }
  }

  // =========================================
  // MASCOT (реагирует на время и состояние)
  // =========================================
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

    const pose = timePose + '-' + moodPose;
    wrap.setAttribute('data-pose', pose);
    wrap.setAttribute('data-mood', moodState(v));

    // Анимация зрачков: смотрят на scrubber (направление X)
    const pupils = document.querySelectorAll('.mascot-pupil');
    const nowX = xFromHour(Math.min(h, DAY_END));
    const cx = 700/2;
    const dx = (nowX - cx) / 700; // -1..1
    pupils.forEach((p, i) => {
      const offsetX = dx * 2.2;
      const cxAttr = i === 0 ? 46 : 78;
      p.setAttribute('cx', String(cxAttr + offsetX));
    });

    // Смайл: меняется по mood
    const smile = document.getElementById('mascotSmile');
    if (smile){
      if (moodPose === 'happy') smile.setAttribute('d', 'M46 70 Q60 86 74 70');
      else if (moodPose === 'calm') smile.setAttribute('d', 'M48 73 Q60 80 72 73');
      else if (moodPose === 'neutral') smile.setAttribute('d', 'M50 75 L70 75');
      else if (moodPose === 'tired') smile.setAttribute('d', 'M50 78 Q60 73 70 78');
      else smile.setAttribute('d', 'M50 80 Q60 70 70 80');
    }
  }

  // =========================================
  // INTERACTION: SCRUBBER
  // =========================================
  function setupScrubber(){
    const track = document.getElementById('timelineTrack');
    const axis  = document.getElementById('timelineAxis');
    if (!track || !axis) return;
    let dragging = false;

    function pickHour(e){
      const rect = axis.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      const xInSvg = (cx - rect.left) * (SVG_W / rect.width);
      return hourFromX(xInSvg);
    }
    function onDown(e){
      dragging = true;
      const s = document.getElementById('tlScrubber');
      if (s) s.classList.add('is-dragging');
      setMomentHour(pickHour(e), true);
      e.preventDefault();
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
    track.addEventListener('mousedown', onDown);
    track.addEventListener('touchstart', onDown, {passive:false});
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }

  // =========================================
  // DYNAMIC HERO
  // =========================================
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
    const months = ['января','февраля','марта','апреля','мая','июня','сентября','октября','ноября','декабря'];
    const days = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
    const d = NOW;
    el.textContent = days[d.getDay()] + ' · ' + d.getDate() + ' ' + months[d.getMonth()] + ' · ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function setupSubline(){
    const el = document.getElementById('heroSubline');
    if (!el) return;
    const r = metricAt('readiness', hoursNow());
    if (r >= 75) el.textContent = 'Готовность ' + r + ' — день будет сильным';
    else if (r >= 60) el.textContent = 'Готовность ' + r + ' — день в норме';
    else el.textContent = 'Готовность ' + r + ' — береги ресурс';
  }
  function setupNowStrip(){
    const t = document.getElementById('nowTime');
    const tx = document.getElementById('nowText');
    if (t) t.textContent = 'Сейчас ' + pad2(NOW.getHours()) + ':' + pad2(NOW.getMinutes());
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

  // =========================================
  // INIT
  // =========================================
  function init(){
    setupDynamicBackground();
    setupGreeting();
    setupDate();
    setupSubline();
    setupNowStrip();

    const svg = document.querySelector('.timeline-svg');
    if (svg){
      renderMoodPath(svg);
      renderHours(svg);
      renderEvents(svg);
      renderMoodLabels(svg);
    }

    const nowH = hoursNow();
    const startH = Math.min(Math.max(nowH, DAY_START), DAY_END);
    setMomentHour(startH, true);
    updateLineSegments();
    renderNextEvent(startH);
    setupScrubber();
    setupPageIndicator();

    setInterval(tick, 30*1000);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

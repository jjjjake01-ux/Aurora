(function(){
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_W = 700;
  const SVG_H = 160;
  const TL_AXIS_Y = 80;
  const TL_LEFT_PAD = 6;
  const TL_RIGHT_PAD = 18;
  const DAY_START = 6;
  const DAY_END = 24;

  // ============================================================
  // MOOD CURVE — эмоциональный ландшафт дня
  // 19 точек × 18 часов, value 0..100 (выше = лучше)
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

  const EVENTS = [
    { id:'sleep-am',  start:6,    end:8,    label:'Сон'      },
    { id:'wake',     start:8.5,         label:'Подъём'   },
    { id:'workout',  start:12,    end:13,  label:'Силовая'  },
    { id:'meal-l',   start:14,          label:'Обед'     },
    { id:'checkin',  start:16,          label:'Check-in' },
    { id:'meal-d',   start:19,          label:'Ужин'     },
    { id:'sleep-pm', start:22.5,        label:'Сон'      }
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

  // Маппинг mood value (0-100) в Y-координату
  // 0 (ужасно) → Y=140 (низ), 100 (отлично) → Y=30 (верх)
  const moodY = v => 30 + ((100 - v) / 100) * 110;
  const clampY = y => Math.max(28, Math.min(140, y));

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
      { label:'Энергия',    from:eFrom, to:eTo, lag:'сейчас', suffix:'%', bar:eTo },
      { label:'Шаги',       from:Math.max(0,s-800), to:s, lag:'сегодня', suffix:'', bar:Math.min(100,Math.round(s/90)) }
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
    if (event.id === 'meal-l')   return 'Сбалансированный обед · 580 ккал';
    if (event.id === 'meal-d')   return 'Лёгкий ужин · 420 ккал';
    if (event.id === 'checkin')  return 'Микро-пауза. Отметь, как ты сейчас';
    if (event.id === 'sleep-pm') return 'Подготовка ко сну';
    return '';
  }

  // ============================================================
  // RENDER: TIMELINE V3 — Apple/Whoop/Oura стиль
  // ============================================================
  function renderMoodPath(svg){
    // Плавная кривая через все mood-точки
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

    // Area fill: сначала вниз к baseline, потом обратно
    const last = points[points.length-1];
    const first = points[0];
    const areaD = d + ` L${last.x} 150 L${first.x} 150 Z`;
    const moodArea = document.getElementById('tlMoodArea');
    if (moodArea) moodArea.setAttribute('d', areaD);
  }

  function renderEvents(svg){
    // Минималистичные метки событий ВЫШЕ кривой
    const g = el('g');
    const visible = [
      { h:8.5,  label:'☀', name:'Подъём', state:'good' },
      { h:12.5, label:'◆', name:'Силовая', state:'load' },
      { h:14,   label:'●', name:'Обед', state:'good' },
      { h:16,   label:'◇', name:'Check-in', state:'good' },
      { h:19,   label:'●', name:'Ужин', state:'good' }
    ];
    visible.forEach(ev => {
      const x = xFromHour(ev.h);
      const m = moodAt(ev.h);
      const y = clampY(moodY(m.v)) - 18;
      // Тонкая вертикальная линия-связь
      g.appendChild(el('line', {
        x1:x, y1:y+8, x2:x, y2:clampY(moodY(m.v)),
        stroke: STATE_COLORS[ev.state] || STATE_COLORS.good,
        'stroke-width':.5, 'stroke-dasharray':'1 2', opacity:.4
      }));
      // Иконка события
      g.appendChild(el('text', {
        x:x, y:y+3, 'font-size':10, 'font-weight':600,
        fill: STATE_COLORS[ev.state] || STATE_COLORS.good,
        'text-anchor':'middle', 'font-family':'Manrope, sans-serif',
        opacity:.85, style:'cursor:pointer;letter-spacing:.04em'
      }, ev.label));
    });
    svg.appendChild(g);
  }

  function setScrubber(h, snap){
    const x = xFromHour(Math.max(DAY_START, Math.min(DAY_END, h)));
    const scrub = document.getElementById('tlScrubber');
    if (scrub) scrub.setAttribute('transform', 'translate('+x+',0)');

    // Обновляем tooltip
    const tt = document.getElementById('timelineTooltip');
    if (tt){
      const axisEl = document.getElementById('timelineAxis');
      if (axisEl){
        const rect = axisEl.getBoundingClientRect();
        const axisW = rect.width;
        // Позиция tooltip в % относительно timeline
        const pct = (x - TL_LEFT_PAD) / (SVG_W - TL_LEFT_PAD - TL_RIGHT_PAD);
        const leftPx = Math.max(60, Math.min(axisW - 60, pct * axisW));
        tt.style.left = leftPx + 'px';
      }
      const mood = moodAt(h);
      const ttTime = document.getElementById('ttTime');
      const ttMood = document.getElementById('ttMood');
      if (ttTime) ttTime.textContent = fmtTime(h);
      if (ttMood) {
        ttMood.textContent = moodLabel(mood.v);
        ttMood.setAttribute('data-mood', moodState(mood.v));
      }
      // Бар энергии
      const e = metricAt('energy', h);
      const ttBars = document.getElementById('ttBars');
      if (ttBars){
        const fill = ttBars.querySelector('.tt-bar-f');
        if (fill) fill.style.width = e + '%';
        const val = ttBars.querySelector('.tt-bar-v');
        if (val) val.textContent = e + '%';
      }
      tt.classList.add('is-visible');
    }

    // Показываем scrubber (если был скрыт)
    if (scrub) scrub.style.opacity = '1';

    // Маскот
    updateMascot(h);
  }

  function updateActiveEvent(h){ /* не используется в v3 */ }

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
                       nextEv.id === 'meal-l' || nextEv.id === 'meal-d' ? 'Приём пищи' :
                       nextEv.id === 'workout' ? 'Силовая' :
                       nextEv.id === 'sleep-pm' ? 'Подготовка ко сну' : 'Запланировано';
    }
  }

  // ============================================================
  // MASCOT
  // ============================================================
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

    wrap.setAttribute('data-pose', timePose + '-' + moodPose);
    wrap.setAttribute('data-mood', moodState(v));

    const pupils = document.querySelectorAll('.mascot-pupil');
    const nowX = xFromHour(Math.min(h, DAY_END));
    const dx = (nowX - 350) / 350;
    pupils.forEach((p, i) => {
      const cxAttr = i === 0 ? 46 : 78;
      p.setAttribute('cx', String(cxAttr + dx * 2.2));
    });

    const smile = document.getElementById('mascotSmile');
    if (smile){
      if (moodPose === 'happy') smile.setAttribute('d', 'M46 70 Q60 86 74 70');
      else if (moodPose === 'calm') smile.setAttribute('d', 'M48 73 Q60 80 72 73');
      else if (moodPose === 'neutral') smile.setAttribute('d', 'M50 75 L70 75');
      else if (moodPose === 'tired') smile.setAttribute('d', 'M50 78 Q60 73 70 78');
      else smile.setAttribute('d', 'M50 80 Q60 70 70 80');
    }
  }

  // ============================================================
  // INTERACTION: SCRUBBER
  // ============================================================
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
    const months = ['января','февраля','марта','апреля','мая','июня','сентября','октября','ноября','декабря'];
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

  // ============================================================
  // INIT
  // ============================================================
  function init(){
    setupDynamicBackground();
    setupGreeting();
    setupDate();
    setupSubline();
    setupNowStrip();

    const svg = document.querySelector('.timeline-svg');
    if (svg){
      renderMoodPath(svg);
      renderEvents(svg);
    }

    const nowH = hoursNow();
    const startH = Math.min(Math.max(nowH, DAY_START), DAY_END);
    setMomentHour(startH, true);
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

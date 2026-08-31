const DAYS=['6:00','8:00','10:00','12:00','14:00','16:00','18:00'];
const M={
 stress:{c:'#E8A13C',d:[32,38,45,52,47,41,35],z:[30,55],f:v=>v+' /100'},
 hrv:{c:'#E5677E',d:[58,55,52,49,61,64,66],z:[50,62],f:v=>v+' мс'},
 load:{c:'#F0764B',d:[120,260,340,420,380,290,180],z:[150,400],f:v=>v+' у.е.'},
 sleep:{c:'#7B74D6',d:[7.4,6.8,6.5,6.9,7.1,6.2,5.5],z:[6,7.5],f:v=>v.toFixed(1).replace('.',',')+' ч'},
 nutr:{c:'#66BB6A',d:[52,58,64,70,72,68,60],z:[55,75],f:v=>v+' /100'},
 energy:{c:'#31A8C9',d:[45,58,66,72,78,64,48],z:[50,75],f:v=>v+'%'},
 sun:{c:'#F2C037',d:[0,5,15,28,35,40,30],z:[10,35],f:v=>v+' мин'}
};
function build(el){
 const k=el.dataset.k,c=M[k],W=320,H=130,PL=30,PR=6,PT=10,PB=20;
 const lo=Math.min(...c.d,c.z[0]),hi=Math.max(...c.d,c.z[1]);
 const min=lo-(hi-lo)*.15,max=hi+(hi-lo)*.15;
 const X=i=>PL+i*(W-PL-PR)/6, Y=v=>PT+(1-(v-min)/(max-min))*(H-PT-PB);
 const pts=c.d.map((v,i)=>({x:X(i),y:Y(v)}));
 let line=`M${pts[0].x} ${pts[0].y}`;
 for(let i=1;i<7;i++){const p=pts[i-1],q=pts[i],m=(p.x+q.x)/2;line+=` C${m} ${p.y} ${m} ${q.y} ${q.x} ${q.y}`;}
 const avg=c.d.reduce((a,b)=>a+b)/7;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('preserveAspectRatio','none');
 svg.innerHTML=`
   <defs><linearGradient id="g${k}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${c.c}" stop-opacity=".22"/><stop offset="1" stop-color="${c.c}" stop-opacity="0"/>
   </linearGradient></defs>
   <rect x="${PL}" y="${Y(c.z[1])}" width="${W-PL-PR}" height="${Y(c.z[0])-Y(c.z[1])}" rx="6" fill="${c.c}" opacity=".08"/>
   <line x1="${PL}" x2="${W-PR}" y1="${Y(avg)}" y2="${Y(avg)}" stroke="${c.c}" stroke-width="1.2" stroke-dasharray="4 5" opacity=".55"/>
   <text x="${PL-6}" y="${Y(hi)+4}" text-anchor="end" font-size="8.5" fill="#98A3AA" font-family="Manrope">${Math.round(hi)}</text>
   <text x="${PL-6}" y="${Y(lo)+4}" text-anchor="end" font-size="8.5" fill="#98A3AA" font-family="Manrope">${Math.round(lo)}</text>
   ${DAYS.map((d,i)=>`<text x="${X(i)}" y="${H-4}" text-anchor="middle" font-size="8.5" fill="#98A3AA" font-family="Manrope">${d}</text>`).join('')}
   <path d="${line} L${pts[6].x} ${H-PB} L${pts[0].x} ${H-PB} Z" fill="url(#g${k})"/>
   <path class="line" pathLength="1" d="${line}" stroke="${c.c}"/>
   <line id="vl${k}" x1="0" x2="0" y1="${PT}" y2="${H-PB}" stroke="#18222B" stroke-width="1" stroke-dasharray="3 4" opacity="0"/>
   <circle id="dt${k}" r="4.5" fill="${c.c}" stroke="#fff" stroke-width="2.5" opacity="0"/>`;
 el.appendChild(svg);
 const tip=document.createElement('div');tip.className='tip';el.appendChild(tip);
 const set=i=>{
  const p=pts[i];
  svg.querySelector('#vl'+k).setAttribute('x1',p.x);svg.querySelector('#vl'+k).setAttribute('x2',p.x);
  svg.querySelector('#vl'+k).setAttribute('opacity','.4');
  const d=svg.querySelector('#dt'+k);d.setAttribute('cx',p.x);d.setAttribute('cy',p.y);d.setAttribute('opacity','1');
  tip.textContent=`${DAYS[i]} · ${c.f(c.d[i])}`;
  tip.style.left=Math.max(18,Math.min(88,p.x/W*100))+'%';tip.style.top=p.y+'px';tip.classList.add('show');
 };
 svg.addEventListener('pointerdown',e=>{
  const r=svg.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*W;
  set(Math.max(0,Math.min(6,Math.round((sx-PL)/((W-PL-PR)/6)))));
 });
 set(6);
}
document.querySelectorAll('.chart').forEach(build);
function jump(k){document.getElementById('card-'+k).scrollIntoView({behavior:'smooth',block:'center'});}

// Переключение графика Стресс / Энергия в карточке статуса
function switchDayChart(btn, metric) {
  // Обновляем активную вкладку
  document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const container = document.querySelector('.day-chart-container');
  if (!container) return;
  const svg = container.querySelector('.day-chart');
  if (!svg) return;

  // Данные для каждого режима (7 точек: 06:00–24:00 каждые 3 часа)
  const charts = {
    stress: {
      color: '#2FBF9B',
      path: 'M0 70 C25 65 25 58 50 55 C75 52 75 48 100 45 C125 42 125 48 150 50 C175 52 175 30 200 25 C225 20 225 28 250 30 C275 32 275 42 300 45',
      points: [
        { cx: 0,   cy: 70, time: '06:00', value: '62', status: 'Норма' },
        { cx: 50,  cy: 55, time: '09:00', value: '58', status: 'Ниже нормы' },
        { cx: 100, cy: 45, time: '12:00', value: '71', status: 'Хорошо' },
        { cx: 150, cy: 50, time: '15:00', value: '65', status: 'Норма' },
        { cx: 200, cy: 25, time: '18:00', value: '82', status: 'Высокая' },
        { cx: 250, cy: 30, time: '21:00', value: '78', status: 'Высокая' },
        { cx: 300, cy: 45, time: '24:00', value: '55', status: 'Норма' }
      ],
      trend: '+16 за 12 часов',
      daySummary: { rise: '+16', peak: '18:00', forecast: '~55' },
      gradientStops: [
        { offset: '0%',   color: '#2FBF9B', opacity: '0.35' },
        { offset: '50%',  color: '#2FBF9B', opacity: '0.1' },
        { offset: '100%', color: '#2FBF9B', opacity: '0' }
      ]
    },
    energy: {
      color: '#31A8C9',
      path: 'M0 80 C25 75 25 63 50 60 C75 57 75 43 100 40 C125 37 125 36 150 35 C175 34 175 40 200 45 C225 50 225 52 250 55 C275 58 275 68 300 72',
      points: [
        { cx: 0,   cy: 80, time: '06:00', value: '45', status: 'Низкая' },
        { cx: 50,  cy: 60, time: '09:00', value: '58', status: 'Норма' },
        { cx: 100, cy: 40, time: '12:00', value: '72', status: 'Хорошо' },
        { cx: 150, cy: 35, time: '15:00', value: '78', status: 'Высокая' },
        { cx: 200, cy: 45, time: '18:00', value: '64', status: 'Норма' },
        { cx: 250, cy: 55, time: '21:00', value: '48', status: 'Ниже нормы' },
        { cx: 300, cy: 72, time: '24:00', value: '32', status: 'Низкая' }
      ],
      trend: '−30 за 12 часов',
      daySummary: { rise: '−35', peak: '15:00', forecast: '~32' },
      gradientStops: [
        { offset: '0%',   color: '#31A8C9', opacity: '0.35' },
        { offset: '50%',  color: '#31A8C9', opacity: '0.1' },
        { offset: '100%', color: '#31A8C9', opacity: '0' }
      ]
    }
  };

  const data = charts[metric];
  if (!data) return;

  // Обновляем градиент
  const grad = svg.querySelector('#dayAreaGrad');
  if (grad) {
    grad.innerHTML = data.gradientStops.map(s =>
      `<stop offset="${s.offset}" stop-color="${s.color}" stop-opacity="${s.opacity}"/>`
    ).join('');
  }

  // Обновляем пути
  const areaGlow = svg.querySelector('.area-glow');
  if (areaGlow) {
    areaGlow.setAttribute('d', data.path);
    areaGlow.style.stroke = data.color;
  }

  const areaFill = svg.querySelector('.area-fill');
  if (areaFill) areaFill.setAttribute('d', data.path + ' L300 85 L0 85 Z');

  const linePath = svg.querySelector('.line-path');
  if (linePath) {
    linePath.setAttribute('d', data.path);
    linePath.style.stroke = data.color;
    // Перезапуск анимации
    linePath.style.animation = 'none';
    linePath.offsetHeight; // reflow
    linePath.style.animation = 'drawLine 1.5s ease forwards';
  }

  // Обновляем точки
  const circles = svg.querySelectorAll('.data-point');
  circles.forEach((c, i) => {
    if (data.points[i]) {
      c.setAttribute('cx', data.points[i].cx);
      c.setAttribute('cy', data.points[i].cy);
      c.style.fill = data.color;
      c.setAttribute('data-time', data.points[i].time);
      c.setAttribute('data-value', data.points[i].value);
      c.setAttribute('data-status', data.points[i].status);
    }
  });

  // Обновляем тренд
  const trendText = document.querySelector('.status-chart .trend-text');
  if (trendText) trendText.textContent = data.trend;

  // Обновляем сводку дня
  const daySummary = document.querySelector('.status-day-summary');
  if (daySummary && data.daySummary) {
    const items = daySummary.querySelectorAll('.day-summary-item');
    if (items[0]) {
      items[0].querySelector('.day-summary-label').textContent = 'С утра';
      items[0].querySelector('.day-summary-value').textContent = data.daySummary.rise;
    }
    if (items[1]) {
      items[1].querySelector('.day-summary-label').textContent = 'Пик';
      items[1].querySelector('.day-summary-value').textContent = data.daySummary.peak;
    }
    if (items[2]) {
      items[2].querySelector('.day-summary-label').textContent = 'К вечеру';
      items[2].querySelector('.day-summary-value').textContent = data.daySummary.forecast;
    }
  }
}

// Инициализация анимации для вертикальных карточек и горизонтальной карусели
function showVisibleCards() {
  document.querySelectorAll('.card').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('anim');
    }
  });
}
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const el = entry.target;
    const ratio = entry.intersectionRatio;
    if (entry.isIntersecting) {
      el.classList.add('anim');
      el.style.opacity = (0.3 + (ratio * 0.7)).toFixed(2);
      if (ratio >= 0.99) {
        el.style.opacity = '1';
        observer.unobserve(el);
      }
    } else {
      el.style.opacity = '0.3';
    }
  });
}, { threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 1], rootMargin: '0px 0px -20px 0px' });
document.querySelectorAll('.card').forEach(el => observer.observe(el));
setTimeout(showVisibleCards, 40);

// Обновляем состояние карточек в полноэкранной карусели при прокрутке
const fullCarousel = document.querySelector('.full-page-carousel');
const fullDots = document.querySelectorAll('#metric-dots i');

function updateFullCarouselState() {
  if (!fullCarousel || fullDots.length === 0) return;
  const pageWidth = fullCarousel.clientWidth;
  const index = Math.round(fullCarousel.scrollLeft / pageWidth);
  fullDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}
if (fullCarousel) {
  fullCarousel.addEventListener('scroll', updateFullCarouselState);
  window.addEventListener('resize', updateFullCarouselState);
  setTimeout(updateFullCarouselState, 100);
}

// ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ (День / Вечер)
function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark-theme');
  if (isDark) {
    root.classList.remove('dark-theme');
    document.querySelector('#theme-toggle').textContent = '🌙';
  } else {
    root.classList.add('dark-theme');
    document.querySelector('#theme-toggle').textContent = '☀️';
  }
}

// ДИНАМИЧЕСКИЙ ТАЛИСМАН (разные виды, но одно лицо)
function updateMascot(index) {
  const body = document.getElementById('body');
  const glow = document.getElementById('glow');
  const hat = document.getElementById('hat');
  const arm = document.getElementById('arm');
  const stateText = document.getElementById('state-text');
  body.style.transition = 'fill 0.5s ease';
  glow.style.transition = 'background 0.5s ease';
  if (index >= 80) {
    body.setAttribute('fill', '#4ADEDE');
    glow.style.background = 'radial-gradient(circle, rgba(74, 222, 222, 0.4) 0%, transparent 70%)';
    stateText.textContent = 'отличное состояние';
    stateText.style.color = '#4ADEDE';
    hat.style.display = 'none';
    arm.style.display = 'block';
  } else if (index >= 60) {
    body.setAttribute('fill', '#5EC7A9');
    glow.style.background = 'radial-gradient(circle, rgba(94, 199, 169, 0.3) 0%, transparent 70%)';
    stateText.textContent = 'хорошее состояние';
    stateText.style.color = '#5EC7A9';
    hat.style.display = 'block';
    arm.style.display = 'none';
  } else if (index >= 40) {
    body.setAttribute('fill', '#F2C037');
    glow.style.background = 'radial-gradient(circle, rgba(242, 192, 55, 0.3) 0%, transparent 70%)';
    stateText.textContent = 'усталое состояние';
    stateText.style.color = '#F2C037';
    hat.style.display = 'block';
    arm.style.display = 'none';
  } else {
    body.setAttribute('fill', '#FF6B6B');
    glow.style.background = 'radial-gradient(circle, rgba(255, 107, 107, 0.3) 0%, transparent 70%)';
    stateText.textContent = 'плохое состояние';
    stateText.style.color = '#FF6B6B';
    hat.style.display = 'none';
    arm.style.display = 'none';
  }
}
if (document.getElementById('body')) {
  updateMascot(78);
}
// Плавный "переход" между страницами
const app = document.querySelector('.app');
const snapSections = document.querySelectorAll('.snap-section');
const firstPage = snapSections[0];
const secondPage = snapSections[1];

function updateScrollVisuals() {
  const scrollTop = app.scrollTop;
  const pageHeight = app.clientHeight;

  if (scrollTop > pageHeight * 0.6) {
    secondPage.classList.add('active');
  } else {
    secondPage.classList.remove('active');
  }
}

if (app) {
  app.addEventListener('scroll', updateScrollVisuals);
  window.addEventListener('resize', updateScrollVisuals);
  updateScrollVisuals();
}

// Carousel dots для показателей
const metricsScroll = document.getElementById('metrics-scroll');
const metricsDots = document.querySelectorAll('#metrics-dots i');
if (metricsScroll && metricsDots.length) {
  function updateMetricsDots() {
    const scrollLeft = metricsScroll.scrollLeft;
    const cardWidth = metricsScroll.querySelector('.full-page')?.offsetWidth || metricsScroll.clientWidth;
    const index = Math.round(scrollLeft / cardWidth);
    metricsDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }
  metricsScroll.addEventListener('scroll', updateMetricsDots);
  window.addEventListener('resize', updateMetricsDots);
  setTimeout(updateMetricsDots, 100);

  // Drag/Swipe поддержка мышью
  let isDown = false;
  let startX;
  let scrollLeftPos;
  metricsScroll.addEventListener('mousedown', (e) => {
    isDown = true;
    metricsScroll.style.cursor = 'grabbing';
    startX = e.pageX;
    scrollLeftPos = metricsScroll.scrollLeft;
    e.preventDefault();
  });
  metricsScroll.addEventListener('mouseleave', () => {
    isDown = false;
    metricsScroll.style.cursor = 'grab';
  });
  metricsScroll.addEventListener('mouseup', () => {
    isDown = false;
    metricsScroll.style.cursor = 'grab';
  });
  metricsScroll.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX;
    const walk = (x - startX) * 1.5;
    metricsScroll.scrollLeft = scrollLeftPos - walk;
  });
  metricsScroll.style.cursor = 'grab';

  // Глобальный mouseup на случай отпускания кнопки за пределами элемента
  document.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      metricsScroll.style.cursor = 'grab';
    }
  });

  // Поддержка колеса мыши (вертикальный скролл -> горизонтальный)
  metricsScroll.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      metricsScroll.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}

// Динамическое окрашивание страницы активности по прогрессу
function updateActivityAtmosphere() {
  const activityPage = document.getElementById('activity-page');
  if (!activityPage) return;

  // Получаем все прогресс-бары активности
  const progressBars = activityPage.querySelectorAll('.stat-fill, .progress-fill');
  if (progressBars.length === 0) return;

  // Вычисляем средний прогресс
  let totalProgress = 0;
  progressBars.forEach(bar => {
    const width = parseFloat(bar.style.width) || 0;
    totalProgress += width;
  });
  const avgProgress = totalProgress / progressBars.length;

  // Обновляем индекс активности
  const indexValue = Math.round(avgProgress);
  const indexEl = document.querySelector('.activity-index-value');
  const statusEl = document.querySelector('.activity-index-status');
  if (indexEl) indexEl.textContent = indexValue;
  if (statusEl) {
    if (indexValue >= 80) statusEl.textContent = 'Отлично';
    else if (indexValue >= 60) statusEl.textContent = 'Хорошо';
    else if (indexValue >= 40) statusEl.textContent = 'Средне';
    else statusEl.textContent = 'Мало';
    statusEl.style.color = indexValue >= 60 ? 'var(--good)' : indexValue >= 40 ? '#E8A13C' : '#E86E5E';
  }

  // Определяем цвет в зависимости от прогресса
  let glowColor, pageTint, subtitleText;
  let mascotColor, mascotBelly, mascotFeet;

  glowColor = 'rgba(232,161,60,.30)';
  pageTint = 'rgba(232,161,60,.04)';
   subtitleText = 'Ты на верном пути';
  mascotColor = '#E8A13C';
  mascotBelly = '#FFF0E0';
  mascotFeet = '#E8A13C';

  // Применяем к странице
  activityPage.style.setProperty('--glow-color', glowColor);
  activityPage.style.setProperty('--page-tint', pageTint);

  // Обновляем подзаголовок
  const subtitle = activityPage.querySelector('.activity-subtitle');
  if (subtitle && subtitleText) {
    subtitle.textContent = subtitleText;
  }

  // Обновляем цвет маскота
  const mascotBody = document.getElementById('mascot-body');
  const mascotBellyEl = document.getElementById('mascot-belly');
  const mascotFootL = document.getElementById('mascot-foot-l');
  const mascotFootR = document.getElementById('mascot-foot-r');
  const mascotArmL = document.getElementById('mascot-arm-l');
  const mascotArmR = document.getElementById('mascot-arm-r');
  const mascotGlow = document.getElementById('activity-mascot-glow');

  if (mascotBody) mascotBody.setAttribute('fill', mascotColor);
  if (mascotBellyEl) mascotBellyEl.setAttribute('fill', mascotBelly);
  if (mascotFootL) mascotFootL.setAttribute('fill', mascotFeet);
  if (mascotFootR) mascotFootR.setAttribute('fill', mascotFeet);
  if (mascotArmL) mascotArmL.setAttribute('fill', mascotColor);
  if (mascotArmR) mascotArmR.setAttribute('fill', mascotColor);
  if (mascotGlow) mascotGlow.style.background = `radial-gradient(circle, ${glowColor.replace('.28', '.4').replace('.25', '.35').replace('.22', '.3').replace('.20', '.28')} 0%, transparent 70%)`;
}

// Запускаем после загрузки страницы
document.addEventListener('DOMContentLoaded', updateActivityAtmosphere);
setTimeout(updateActivityAtmosphere, 500);

document.addEventListener('DOMContentLoaded', () => {
  initStepsCarousel();
  buildWeekChart();
});

// Инициализация всех каруселей
function initAllCarousels() {
  initCarouselById('stepsTrack');
  initCarouselById('caloriesTrack');
  initCarouselById('distanceTrack');
  initCarouselById('sittingTrack');
}

function initCarouselById(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  // Skip if track is hidden (inside inactive tab panel)
  if (track.closest('.tab-panel') && !track.closest('.tab-panel').classList.contains('active')) return;

  const carousel = track.closest('.steps-carousel');
  const dots = carousel.querySelectorAll('.carousel-dots .dot');

  const updateDots = () => {
    const scrollLeft = track.scrollLeft;
    const cardWidth = track.querySelector('.card')?.offsetWidth || track.clientWidth;
    const index = Math.round(scrollLeft / (cardWidth + 12));
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  };

  track.addEventListener('scroll', updateDots);

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const cardWidth = track.querySelector('.card')?.offsetWidth || track.clientWidth;
      track.scrollTo({
        left: i * (cardWidth + 12),
        behavior: 'smooth'
      });
    });
  });

  setTimeout(updateDots, 100);
}

// Генерация недельных графиков для всех каруселей
function buildAllWeekCharts() {
  buildWeekChartById('weekChart', [6800, 7500, 8200, 6200, 6200, 8800, 5100], 7240, 'шаги');
  buildWeekChartById('calWeekChart', [350, 420, 480, 320, 320, 520, 280], 380, 'калории');
  buildWeekChartById('distWeekChart', [3.8, 4.5, 5.2, 3.2, 4.2, 6.1, 2.8], 4.8, 'дистанция');
  buildWeekChartById('sitWeekChart', [190, 210, 230, 170, 135, 110, 80], 165, 'сидение');
}

function buildWeekChartById(chartId, values, avg, type) {
  const svg = document.getElementById(chartId);
  if (!svg) return;

  const W = 300, H = 140, PT = 20, PB = 30, PL = 30, PR = 10;
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const max = Math.max(...values) * 1.1;
  const min = Math.min(...values) * 0.8;

  const X = i => PL + i * (W - PL - PR) / 6;
  const Y = v => PT + (1 - (v - min) / (max - min)) * (H - PT - PB);

  const points = values.map((v, i) => ({ x: X(i), y: Y(v) }));

  let linePath = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1], q = points[i];
    const mx = (p.x + q.x) / 2;
    linePath += ` C${mx} ${p.y} ${mx} ${q.y} ${q.x} ${q.y}`;
  }

  const areaPath = `${linePath} L${points[6].x} ${H - PB} L${points[0].x} ${H - PB} Z`;

  const color = type === 'калории' ? '#E8A13C' : type === 'дистанция' ? '#31A8C9' : type === 'сидение' ? '#E5677E' : 'var(--c-index)';
  const gradientId = chartId + 'Grad';

  svg.innerHTML = `
    <defs>
      <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
        <stop offset="50%" stop-color="${color}" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line class="grid-line" x1="${PL}" x2="${W - PR}" y1="${Y(max)}" y2="${Y(max)}"/>
    <line class="grid-line" x1="${PL}" x2="${W - PR}" y1="${Y((max+min)/2)}" y2="${Y((max+min)/2)}"/>
    <line class="grid-line" x1="${PL}" x2="${W - PR}" y1="${Y(min)}" y2="${Y(min)}"/>
    <line class="avg-line" x1="${PL}" x2="${W - PR}" y1="${Y(avg)}" y2="${Y(avg)}"/>
    <text class="avg-label" x="${W - PR + 5}" y="${Y(avg) + 3}">ср. ${Math.round(avg)}</text>
    <path class="area-glow" d="${linePath}"/>
    <path class="area-fill" d="${areaPath}" fill="url(#${gradientId})"/>
    <path class="line-path" d="${linePath}" pathLength="1" style="stroke-dasharray: 1; stroke-dashoffset: 1; stroke: ${color}; animation: drawLine 1.5s ease forwards;"/>
    ${points.map((p, i) => `<circle class="data-point${i === 4 ? ' today' : ''}" cx="${p.x}" cy="${p.y}" style="fill: ${color}; animation: popIn 0.4s ${0.8 + i * 0.1}s ease both;"/>`).join('')}
    ${points.map((p, i) => `<text class="value-label" x="${p.x}" y="${p.y - 12}" style="animation: fadeIn 0.3s ${1 + i * 0.1}s ease both;">${values[i]}</text>`).join('')}
    ${days.map((d, i) => `<text class="day-label" x="${X(i)}" y="${H - 8}">${d}</text>`).join('')}
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  initAllCarousels();
  buildAllWeekCharts();
  updateMascotIllustration('statusMascotIllustration', 78);
  updateMascotIllustration('activityMascotIllustration', 78);
  initDayChartTooltips();
});

function initDayChartTooltips() {
  const container = document.querySelector('.day-chart-container');
  const tooltip = document.getElementById('dayChartTooltip');
  if (!container || !tooltip) return;

  const points = container.querySelectorAll('.data-point');

  points.forEach(point => {
    point.addEventListener('mouseenter', (e) => showTooltip(e, point));
    point.addEventListener('mouseleave', hideTooltip);
    point.addEventListener('touchstart', (e) => {
      e.preventDefault();
      showTooltip(e, point);
      setTimeout(hideTooltip, 2000);
    }, { passive: false });
  });

  container.addEventListener('mouseleave', hideTooltip);
}

function showTooltip(e, point) {
  const tooltip = document.getElementById('dayChartTooltip');
  if (!tooltip) return;

  const time = point.getAttribute('data-time');
  const value = point.getAttribute('data-value');
  const status = point.getAttribute('data-status');

  tooltip.innerHTML = `
    <div class="tooltip-time">${time}</div>
    <div class="tooltip-value">${value} <span style="font-size:11px;font-weight:600;color:var(--mut)">из 100</span></div>
    <div class="tooltip-status">${status}</div>
  `;

  const rect = point.getBoundingClientRect();
  const containerRect = point.closest('.day-chart-container').getBoundingClientRect();

  let left = rect.left - containerRect.left + rect.width / 2;
  const top = rect.top - containerRect.top - 8;

  // Не даём тултипу уйти за левый и правый край
  const tooltipWidth = tooltip.offsetWidth || 90;
  const halfW = tooltipWidth / 2 + 4;
  if (left < halfW) left = halfW;
  if (left > containerRect.width - halfW) left = containerRect.width - halfW;

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.classList.add('visible');
}

function hideTooltip() {
  const tooltip = document.getElementById('dayChartTooltip');
  if (tooltip) tooltip.classList.remove('visible');
}

function updateMascotIllustration(containerId, score) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (score < 40 || score > 80) {
    container.classList.add('show');
  } else {
    container.classList.remove('show');
  }
<<<<<<< Updated upstream
=======
<<<<<<< ours
}
=======
>>>>>>> Stashed changes
}

// ===== LOCAL STORAGE =====
function saveToStorage() {
  try {
    const data = {
      timers: timers.map(t => ({
        ...t,
        targetTime: t.targetTime ? t.targetTime.toISOString() : null,
        createdAt: t.createdAt ? t.createdAt.toISOString() : null
      })),
      pomodoroSettings: pomodoro.settings,
      pomodoroSessions: pomodoroSessions,
      dayEvents: dayEvents.filter(e => e.id.startsWith('manual-') || e.id.startsWith('timer-')),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('atlasHealth', JSON.stringify(data));
  } catch (e) {
    // storage full or unavailable
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('atlasHealth');
    if (!raw) return;
    const data = JSON.parse(raw);

    // Restore timers
    if (data.timers && Array.isArray(data.timers)) {
      timers = data.timers.map(t => ({
        ...t,
        targetTime: t.targetTime ? new Date(t.targetTime) : null,
        createdAt: t.createdAt ? new Date(t.createdAt) : null,
        active: t.targetTime ? new Date(t.targetTime) > new Date() : false
      })).filter(t => t.active || !t.targetTime);
    }

    // Restore pomodoro settings
    if (data.pomodoroSettings) {
      pomodoro.settings = { ...pomodoro.settings, ...data.pomodoroSettings };
      document.getElementById('psWork').value = pomodoro.settings.work;
      document.getElementById('psBreak').value = pomodoro.settings.break;
      document.getElementById('psLongBreak').value = pomodoro.settings.longBreak;
      document.getElementById('psCyclesBeforeLong').value = pomodoro.settings.cyclesBeforeLong;
    }

    // Restore pomodoro sessions
    if (data.pomodoroSessions && Array.isArray(data.pomodoroSessions)) {
      pomodoroSessions = data.pomodoroSessions;
    }

    // Restore manual day events
    if (data.dayEvents && Array.isArray(data.dayEvents)) {
      dayEvents = data.dayEvents;
    }
  } catch (e) {
    // corrupted data
  }
}

// ===== NATURAL LANGUAGE TASK PARSER =====
function parseTaskInput(input) {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  const now = new Date();
  let taskName = '';
  let targetTime = null;
  let duration = null;

  // Pattern: "в 18:00" or "в 18.00"
  const timeAtMatch = text.match(/в\s+(\d{1,2})[:\.](\d{2})/);
  if (timeAtMatch) {
    const hours = parseInt(timeAtMatch[1]);
    const minutes = parseInt(timeAtMatch[2]);
    targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);
    if (targetTime <= now) targetTime.setDate(targetTime.getDate() + 1);
    taskName = text.replace(timeAtMatch[0], '').trim();
  }

  // Pattern: "через X минут" or "через X мин"
  const inMinutesMatch = text.match(/через\s+(\d+)\s*мин[а-я]*/);
  if (inMinutesMatch) {
    const mins = parseInt(inMinutesMatch[1]);
    targetTime = new Date(now.getTime() + mins * 60000);
    taskName = text.replace(inMinutesMatch[0], '').trim();
  }

  // Pattern: "через X час" or "через X часов"
  const inHoursMatch = text.match(/через\s+(\d+)\s*час[а-я]*/);
  if (inHoursMatch) {
    const hrs = parseInt(inHoursMatch[1]);
    targetTime = new Date(now.getTime() + hrs * 3600000);
    taskName = text.replace(inHoursMatch[0], '').trim();
  }

  // Pattern: "на X минут" or "на X мин" (duration)
  const durationMatch = text.match(/на\s+(\d+)\s*мин[а-я]*/);
  if (durationMatch) {
    duration = parseInt(durationMatch[1]);
    taskName = text.replace(durationMatch[0], '').trim();
  }

  // Clean up task name
  taskName = taskName
    .replace(/^(приготовить|сделать|пойти|почистить|помыть|убрать|выпить|съесть|позвонить|написать)\s*/, '$1 ')
    .replace(/^[^\wа-яё]+/i, '')
    .replace(/[^\wа-яё]+$/i, '');

  if (!taskName) {
    // Fallback: use whole text as task name, first word as verb
    taskName = text.replace(/^(в|через|на)\s+.*$/, '').trim() || text.split(' ').slice(0, 3).join(' ');
  }

  // Capitalize first letter
  taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);

  return {
    name: taskName,
    targetTime: targetTime,
    duration: duration,
    createdAt: now
  };
}

// ===== TIMER SYSTEM =====
let timers = [];

function createTimer(task) {
  const timer = {
    id: Date.now(),
    name: task.name,
    targetTime: task.targetTime,
    duration: task.duration,
    createdAt: task.createdAt,
    active: true
  };
  timers.push(timer);
  renderTimers();
  renderDayFlow();
  saveToStorage();
  return timer;
}

function cancelTimer(id) {
  timers = timers.filter(t => t.id !== id);
  renderTimers();
  renderDayFlow();
  saveToStorage();
}

function renderTimers() {
  const container = document.getElementById('activeTimers');
  if (!container) return;

  const activeTimers = timers.filter(t => t.active);

  if (activeTimers.length === 0) {
    container.innerHTML = '<div class="no-timers">Нет активных таймеров</div>';
    return;
  }

  container.innerHTML = activeTimers.map(timer => {
    const now = new Date();
    const diff = timer.targetTime - now;
    const isUrgent = diff > 0 && diff < 5 * 60000;
    const isCountdown = diff > 0 && diff < 15 * 60000;
    const targetStr = formatTimeOfDay(timer.targetTime);
    const timeStr = isCountdown ? formatTimeRemaining(diff) : `в ${targetStr}`;

    return `
      <div class="timer-item${isUrgent ? ' urgent' : ''}${isCountdown ? ' counting' : ''}" id="timer-${timer.id}">
        <div class="timer-info">
          <div class="timer-name">${timer.name}</div>
          <div class="timer-target">${timer.duration ? 'на ' + timer.duration + ' мин · ' : ''}${isCountdown ? 'осталось' : 'напомнит в'} ${targetStr}</div>
        </div>
        <div class="timer-value" data-target="${timer.targetTime.getTime()}">${timeStr}</div>
        <button class="timer-cancel" onclick="cancelTimer(${timer.id})" aria-label="Удалить таймер">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `;
  }).join('');
}

function formatTimeRemaining(diff) {
  if (diff <= 0) return 'Сейчас!';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    return `${hrs}ч ${mins % 60}м`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeOfDay(date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function updateTimers() {
  const now = new Date();
  let changed = false;

  timers.forEach(timer => {
    if (!timer.active) return;
    const diff = timer.targetTime - now;
    if (diff <= 0) {
      timer.active = false;
      triggerNotification(timer.name);
      changed = true;
    }
  });

  if (changed) {
    renderTimers();
    timers = timers.filter(t => t.active);
    return;
  }

  // Update displayed times only for countdown timers (within 15 min)
  document.querySelectorAll('.timer-value[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const diff = target - now.getTime();
    const isCountdown = diff > 0 && diff < 15 * 60000;
    if (isCountdown) {
      el.textContent = formatTimeRemaining(diff);
    }
  });

  // Check if any timer entered countdown window — re-render if needed
  const hasNewCountdown = timers.some(t => {
    const diff = t.targetTime - now;
    return diff > 0 && diff < 15 * 60000;
  });
  if (hasNewCountdown) {
    const countingEls = document.querySelectorAll('.timer-item.counting');
    if (countingEls.length === 0) renderTimers();
  }
}

function triggerNotification(taskName) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Atlas Health', {
      body: `Время: ${taskName}`,
      icon: '🍅'
    });
  }
}

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// ===== POMODORO =====
let pomodoro = {
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  isRunning: false,
  isBreak: false,
  cycles: 0,
  sessionsCompleted: 0,
  interval: null,
  settings: {
    work: 25,
    break: 5,
    longBreak: 15,
    cyclesBeforeLong: 4
  }
};

function togglePomodoroSettings() {
  const panel = document.getElementById('pomodoroSettings');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function adjustPomodoroSetting(key, delta) {
  const input = document.getElementById('ps' + key.charAt(0).toUpperCase() + key.slice(1));
  if (!input) return;
  let val = parseInt(input.value) + delta;
  const min = parseInt(input.min);
  const max = parseInt(input.max);
  val = Math.max(min, Math.min(max, val));
  input.value = val;
  updatePomodoroSetting(key, val);
}

function updatePomodoroSetting(key, value) {
  const val = Math.max(1, Math.min(60, parseInt(value) || 1));
  pomodoro.settings[key] = val;
  saveToStorage();
  // If timer is not running, update display
  if (!pomodoro.isRunning) {
    if (pomodoro.isBreak) {
      pomodoro.timeLeft = (pomodoro.sessionsCompleted % pomodoro.settings.cyclesBeforeLong === 0 ? pomodoro.settings.longBreak : pomodoro.settings.break) * 60;
    } else {
      pomodoro.timeLeft = pomodoro.settings.work * 60;
    }
    pomodoro.totalTime = pomodoro.timeLeft;
    updatePomodoroDisplay();
  }
}

function startPomodoro() {
  if (pomodoro.isRunning) {
    // Pause
    clearInterval(pomodoro.interval);
    pomodoro.isRunning = false;
    document.getElementById('pomodoroStart').innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>
      Продолжить
    `;
    document.getElementById('pomodoroStatus').textContent = 'Пауза';
    return;
  }

  pomodoro.isRunning = true;
  pomodoroSessionStart = new Date();
  document.getElementById('pomodoroStart').innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
    Пауза
  `;
  document.getElementById('pomodoroStatus').textContent = pomodoro.isBreak ? 'Перерыв' : 'Работа...';

  pomodoro.interval = setInterval(() => {
    pomodoro.timeLeft--;
    updatePomodoroDisplay();

    if (pomodoro.timeLeft <= 0) {
      clearInterval(pomodoro.interval);
      pomodoro.isRunning = false;

      if (!pomodoro.isBreak) {
        pomodoro.cycles++;
        document.getElementById('pomodoroCount').textContent = pomodoro.cycles;
      }

      pomodoro.isBreak = !pomodoro.isBreak;
      if (pomodoro.isBreak) {
        pomodoro.sessionsCompleted++;
        const isLongBreak = pomodoro.sessionsCompleted % pomodoro.settings.cyclesBeforeLong === 0;
        pomodoro.timeLeft = (isLongBreak ? pomodoro.settings.longBreak : pomodoro.settings.break) * 60;
      } else {
        pomodoro.timeLeft = pomodoro.settings.work * 60;
      }
      pomodoro.totalTime = pomodoro.timeLeft;

      // Auto-add completed session to day flow
      addPomodoroToDayFlow();

      document.getElementById('pomodoroStart').innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>
        Старт
      `;
      document.getElementById('pomodoroStatus').textContent = pomodoro.isBreak
        ? 'Время отдыхать!'
        : 'Готов к работе';

      updatePomodoroDisplay();

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Помодоро', {
          body: pomodoro.isBreak ? 'Время отдыхать!' : 'Время работать!'
        });
      }
    }
  }, 1000);
}

function resetPomodoro() {
  clearInterval(pomodoro.interval);
  pomodoro.isRunning = false;
  pomodoro.isBreak = false;
  pomodoroSessionStart = null;
  pomodoro.timeLeft = pomodoro.settings.work * 60;
  pomodoro.totalTime = pomodoro.settings.work * 60;
  pomodoro.sessionsCompleted = 0;
  document.getElementById('pomodoroStart').innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>
    Старт
  `;
  document.getElementById('pomodoroStatus').textContent = 'Готов к работе';
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const mins = Math.floor(pomodoro.timeLeft / 60);
  const secs = pomodoro.timeLeft % 60;
  document.getElementById('pomodoroTime').textContent =
    `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== DAY FLOW (100% DYNAMIC) =====
const DAY_START = 6 * 60;
const DAY_END = 24 * 60;
const DAY_TOTAL = DAY_END - DAY_START;

let dayEvents = [];
let pomodoroSessionStart = null;

function collectDayEvents() {
  dayEvents = [];
  const now = new Date();

  // 1. Collect from timers (chat tasks with target times)
  timers.forEach(timer => {
    if (!timer.active || !timer.targetTime) return;
    const h = timer.targetTime.getHours();
    const m = timer.targetTime.getMinutes();
    const startMin = h * 60 + m;
    const duration = timer.duration || 30;

    dayEvents.push({
      id: 'timer-' + timer.id,
      name: timer.name,
      start: startMin,
      end: startMin + duration,
      type: 'task',
      done: false
    });
  });

  // 3. Collect from pomodoro (completed sessions)
  pomodoroSessions.forEach(session => {
    dayEvents.push({
      id: 'pomo-' + session.id,
      name: session.isBreak ? '☕ Перерыв' : '🍅 Фокус',
      start: session.startMin,
      end: session.endMin,
      type: session.isBreak ? 'break' : 'pomodoro',
      done: true
    });
  });

  // 4. Current pomodoro session (if running)
  if (pomodoro.isRunning && pomodoroSessionStart) {
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const elapsed = (now.getTime() - pomodoroSessionStart.getTime()) / 60000;
    const totalDuration = (pomodoro.isBreak ? pomodoro.settings.break : pomodoro.settings.work);
    dayEvents.push({
      id: 'pomo-active',
      name: pomodoro.isBreak ? '☕ Перерыв' : '🍅 Фокус',
      start: currentMin - elapsed,
      end: currentMin - elapsed + totalDuration,
      type: pomodoro.isBreak ? 'break' : 'pomodoro',
      done: false
    });
  }

  // Sort by start time
  dayEvents.sort((a, b) => a.start - b.start);
}

let pomodoroSessions = [];

function addPomodoroToDayFlow() {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const duration = pomodoro.isBreak ? pomodoro.settings.break : pomodoro.settings.work;

  pomodoroSessions.push({
    id: Date.now(),
    startMin: currentMin - duration,
    endMin: currentMin,
    isBreak: pomodoro.isBreak
  });

  saveToStorage();
  collectDayEvents();
  renderDayFlow();
}

function renderDayFlow() {
  collectDayEvents();

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const clampedMinutes = Math.max(DAY_START, Math.min(DAY_END, currentMinutes));

  // Calculate time stats
  let focusMinutes = 0;
  let taskMinutes = 0;

  dayEvents.forEach(e => {
    const dur = Math.max(0, e.end - e.start);
    if (e.type === 'pomodoro') focusMinutes += dur;
    else if (e.type === 'break') focusMinutes += dur * 0.5;
    else taskMinutes += dur;
  });

  const occupiedMinutes = focusMinutes + taskMinutes;
  const freeMinutes = Math.max(0, DAY_TOTAL - occupiedMinutes);

  // Update summary
  const dfsSpent = document.getElementById('dfsSpent');
  const dfsFree = document.getElementById('dfsFree');
  if (dfsSpent) dfsSpent.textContent = formatHoursMinutes(occupiedMinutes);
  if (dfsFree) dfsFree.textContent = formatHoursMinutes(freeMinutes);

  // Render timeline blocks (clean, no text)
  const track = document.getElementById('dftTrack');
  if (!track) return;

  track.querySelectorAll('.dft-block, .dft-freezone').forEach(el => el.remove());

  const sortedEvents = [...dayEvents].filter(e => e.end > DAY_START && e.start < DAY_END);
  let lastEnd = DAY_START;

  sortedEvents.forEach(event => {
    const eventStart = Math.max(DAY_START, event.start);
    const eventEnd = Math.min(DAY_END, event.end);

    if (eventStart > lastEnd) {
      const freeDuration = eventStart - lastEnd;
      const freeLeft = ((lastEnd - DAY_START) / DAY_TOTAL) * 100;
      const freeWidth = (freeDuration / DAY_TOTAL) * 100;

      if (freeWidth > 0.3) {
        const freeEl = document.createElement('div');
        freeEl.className = 'dft-freezone';
        freeEl.style.left = freeLeft + '%';
        freeEl.style.width = freeWidth + '%';
        track.appendChild(freeEl);
      }
    }

    const blockLeft = ((eventStart - DAY_START) / DAY_TOTAL) * 100;
    const blockWidth = ((eventEnd - eventStart) / DAY_TOTAL) * 100;

    if (blockWidth > 0.2) {
      const blockEl = document.createElement('div');
      blockEl.className = 'dft-block';
      blockEl.style.left = blockLeft + '%';
      blockEl.style.width = Math.max(blockWidth, 1) + '%';
      blockEl.dataset.eventId = event.id;

      if (event.type === 'pomodoro') blockEl.classList.add('pomodoro-block');
      else if (event.type === 'break') blockEl.classList.add('break-block');
      else if (event.type === 'workout') blockEl.classList.add('workout-block');
      else blockEl.classList.add('task-block');

      // Make draggable
      makeBlockDraggable(blockEl, event);

      track.appendChild(blockEl);
    }

    lastEnd = Math.max(lastEnd, eventEnd);
  });

  if (lastEnd < DAY_END) {
    const freeDuration = DAY_END - lastEnd;
    const freeLeft = ((lastEnd - DAY_START) / DAY_TOTAL) * 100;
    const freeEl = document.createElement('div');
    freeEl.className = 'dft-freezone';
    freeEl.style.left = freeLeft + '%';
    freeEl.style.width = (freeDuration / DAY_TOTAL) * 100 + '%';
    track.appendChild(freeEl);
  }

  // Update now indicator
  const nowEl = document.getElementById('dftNow');
  if (nowEl) {
    const nowPercent = ((clampedMinutes - DAY_START) / DAY_TOTAL) * 100;
    nowEl.style.left = nowPercent + '%';
  }

  // Render task list
  renderTaskList(sortedEvents, currentMinutes);
}

function renderTaskList(events, currentMinutes) {
  const container = document.getElementById('dayflowTasks');
  if (!container) return;

  container.innerHTML = '';

  if (events.length === 0) {
    container.innerHTML = '<div class="dftask-empty">Нет задач на сегодня</div>';
    return;
  }

  events.forEach(event => {
    const isPast = event.end < currentMinutes;
    const startH = Math.floor(event.start / 60);
    const startM = event.start % 60;
    const endH = Math.floor(event.end / 60);
    const endM = event.end % 60;
    const duration = event.end - event.start;

    const timeStr = `${startH}:${startM.toString().padStart(2, '0')}–${endH}:${endM.toString().padStart(2, '0')}`;

    // Check if task can be started (within 15 min of start time)
    const minutesUntilStart = event.start - currentMinutes;
    const canStart = !isDone && minutesUntilStart <= 15 && minutesUntilStart > -30;

    const item = document.createElement('div');
<<<<<<< ours
    item.className = `dftask-item${isPast ? ' past' : ''}`;
=======
    item.className = `dftask-item${isPast && !isDone ? ' past' : ''}${isDone ? ' done' : ''}`;
>>>>>>> theirs

    item.innerHTML = `
      <div class="dftask-color ${event.type}"></div>
      <div class="dftask-info">
        <div class="dftask-name">${event.name}</div>
        <div class="dftask-time">${timeStr}</div>
      </div>
      <div class="dftask-dur">${formatHoursMinutes(duration)}</div>
      ${canStart && event.needsPomodoro ? '<button class="dftask-start" onclick="event.stopPropagation(); openTaskPomodoro(\'' + event.id + '\')">▶</button>' : ''}
      ${canStart && !event.needsPomodoro ? '<button class="dftask-start" onclick="event.stopPropagation(); toggleTaskDone(\'' + event.id + '\')">✓</button>' : ''}
    `;

    container.appendChild(item);
  });
}

<<<<<<< ours
=======
// ===== TASK POMODORO PANEL =====
let currentTaskPomodoro = null; // { eventId, sessionsTotal, sessionsDone, isRunning, isBreak, timeLeft, interval }

function openTaskPomodoro(eventId) {
  const event = dayEvents.find(e => e.id === eventId);
  if (!event) return;

  currentTaskPomodoro = {
    eventId: eventId,
    sessionsTotal: 4,
    sessionsDone: 0,
    isRunning: false,
    isBreak: false,
    timeLeft: pomodoro.settings.work * 60,
    interval: null
  };

  const panel = document.getElementById('taskPomodoroPanel');
  document.getElementById('tppTaskName').textContent = event.name;
  updateTaskPomodoroDisplay();
  panel.style.display = 'block';
}

function closeTaskPomodoro() {
  if (currentTaskPomodoro && currentTaskPomodoro.interval) {
    clearInterval(currentTaskPomodoro.interval);
  }
  currentTaskPomodoro = null;
  document.getElementById('taskPomodoroPanel').style.display = 'none';
}

function startTaskPomodoro() {
  if (!currentTaskPomodoro) return;

  if (currentTaskPomodoro.isRunning) {
    // Pause
    clearInterval(currentTaskPomodoro.interval);
    currentTaskPomodoro.isRunning = false;
    document.getElementById('tppStart').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg> Продолжить';
    document.getElementById('tppStatus').textContent = 'Пауза';
    return;
  }

  currentTaskPomodoro.isRunning = true;
  document.getElementById('tppStart').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg> Пауза';
  document.getElementById('tppStatus').textContent = currentTaskPomodoro.isBreak ? 'Перерыв' : 'Работа...';

  currentTaskPomodoro.interval = setInterval(() => {
    currentTaskPomodoro.timeLeft--;
    updateTaskPomodoroDisplay();

    if (currentTaskPomodoro.timeLeft <= 0) {
      clearInterval(currentTaskPomodoro.interval);
      currentTaskPomodoro.isRunning = false;

      if (!currentTaskPomodoro.isBreak) {
        currentTaskPomodoro.sessionsDone++;
      }

      currentTaskPomodoro.isBreak = !currentTaskPomodoro.isBreak;
      currentTaskPomodoro.timeLeft = currentTaskPomodoro.isBreak
        ? pomodoro.settings.break * 60
        : pomodoro.settings.work * 60;

      // Check if all sessions complete
      if (currentTaskPomodoro.sessionsDone >= currentTaskPomodoro.sessionsTotal && !currentTaskPomodoro.isBreak) {
        // Task complete!
        const event = dayEvents.find(e => e.id === currentTaskPomodoro.eventId);
        if (event) {
          event.done = true;
          saveToStorage();
        }
        document.getElementById('tppStatus').textContent = '✓ Задача выполнена!';
        updateTaskPomodoroDisplay();
        renderDayFlow();
        return;
      }

      document.getElementById('tppStart').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg> Старт';
      document.getElementById('tppStatus').textContent = currentTaskPomodoro.isBreak ? 'Время отдыхать!' : 'Готов к работе';
      updateTaskPomodoroDisplay();
    }
  }, 1000);
}

function resetTaskPomodoro() {
  if (!currentTaskPomodoro) return;
  clearInterval(currentTaskPomodoro.interval);
  currentTaskPomodoro.isRunning = false;
  currentTaskPomodoro.isBreak = false;
  currentTaskPomodoro.sessionsDone = 0;
  currentTaskPomodoro.timeLeft = pomodoro.settings.work * 60;
  document.getElementById('tppStart').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg> Старт';
  document.getElementById('tppStatus').textContent = 'Готов к работе';
  updateTaskPomodoroDisplay();
}

function updateTaskPomodoroDisplay() {
  if (!currentTaskPomodoro) return;

  const mins = Math.floor(currentTaskPomodoro.timeLeft / 60);
  const secs = currentTaskPomodoro.timeLeft % 60;
  document.getElementById('tppTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Update session dots
  const dotsHtml = Array(currentTaskPomodoro.sessionsTotal).fill(0).map((_, i) => {
    let cls = '';
    if (i < currentTaskPomodoro.sessionsDone) cls = 'done';
    else if (i === currentTaskPomodoro.sessionsDone && currentTaskPomodoro.isRunning) cls = 'active';
    return `<span class="tpp-dot ${cls}"></span>`;
  }).join('');
  document.getElementById('tppSessions').innerHTML = dotsHtml;
  document.getElementById('tppSessionsText').textContent = `${currentTaskPomodoro.sessionsDone} из ${currentTaskPomodoro.sessionsTotal} сессий`;
}

// ===== PERFORMANCE INDICATORS =====
function updatePerformanceIndicators() {
  const today = new Date().toDateString();

  // Focus: completed pomodoros vs goal (8)
  const todaySessions = pomodoroSessions.filter(s => {
    const d = new Date(s.id);
    return d.toDateString() === today && !s.isBreak;
  });
  const focusCompleted = todaySessions.length;
  const focusGoal = 8;
  const focusPercent = Math.min(100, Math.round((focusCompleted / focusGoal) * 100));

  // Productivity: completed tasks vs total tasks (from dayEvents)
  const taskEvents = dayEvents.filter(e => e.type === 'task' || e.type === 'workout');
  const totalTasks = taskEvents.length;
  const doneTasks = taskEvents.filter(e => e.done).length;
  const productivityPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Update Focus ring
  const focusRing = document.getElementById('dfpFocusRing');
  const focusValue = document.getElementById('dfpFocusValue');
  const focusSub = document.getElementById('dfpFocusSub');
  if (focusRing) {
    const circumference = 2 * Math.PI * 15; // r=15
    const offset = circumference - (focusPercent / 100) * circumference;
    focusRing.style.strokeDashoffset = offset;
  }
  if (focusValue) focusValue.textContent = focusPercent + '%';
  if (focusSub) focusSub.textContent = `${focusCompleted} из ${focusGoal}`;

  // Update Productivity ring
  const productivityRing = document.getElementById('dfpProductivityRing');
  const productivityValue = document.getElementById('dfpProductivityValue');
  const productivitySub = document.getElementById('dfpProductivitySub');
  if (productivityRing) {
    const circumference = 2 * Math.PI * 15;
    const offset = circumference - (productivityPercent / 100) * circumference;
    productivityRing.style.strokeDashoffset = offset;
  }
  if (productivityValue) productivityValue.textContent = productivityPercent + '%';
  if (productivitySub) productivitySub.textContent = `${doneTasks}/${totalTasks} задач`;
}

>>>>>>> theirs
// ===== DRAG & RESIZE =====
let dragState = null;

function makeBlockDraggable(blockEl, event) {
  // Touch events for moving (only on main block area)
  blockEl.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (isOnResizeHandle(touch, blockEl)) return;
    handleDragStart(e, event, 'move');
  }, { passive: false });

  // Mouse events for moving
  blockEl.addEventListener('mousedown', (e) => {
    if (isOnResizeHandle(e, blockEl)) return;
    handleDragStart(e, event, 'move');
  });

  // Resize handles - left
  const leftHandle = document.createElement('div');
  leftHandle.className = 'dft-resize-handle left';
  leftHandle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e, event, 'resize-left');
  }, { passive: false });
  leftHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e, event, 'resize-left');
  });
  blockEl.appendChild(leftHandle);

  // Resize handles - right
  const rightHandle = document.createElement('div');
  rightHandle.className = 'dft-resize-handle right';
  rightHandle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e, event, 'resize-right');
  }, { passive: false });
  rightHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e, event, 'resize-right');
  });
  blockEl.appendChild(rightHandle);
}

function isOnResizeHandle(clientX_or_Touch, blockEl) {
  const rect = blockEl.getBoundingClientRect();
  const clientX = clientX_or_Touch.clientX;
  const relX = clientX - rect.left;
  // If within 12px of left or right edge, it's a resize handle
  return relX <= 12 || relX >= rect.width - 12;
}

function handleDragStart(e, event, mode) {
  e.preventDefault();
  e.stopPropagation();

  const track = document.getElementById('dftTrack');
  if (!track) return;
  const rect = track.getBoundingClientRect();

  let clientX;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
  } else {
    clientX = e.clientX;
  }

  dragState = {
    event: event,
    mode: mode,
    rect: rect,
    startX: clientX,
    originalStart: event.start,
    originalEnd: event.end
  };

  // Visual feedback
  const blockEl = e.currentTarget.closest('.dft-block');
  if (blockEl) blockEl.classList.add('dragging');

  // Bind move/end events
  document.addEventListener('touchmove', handleDragMove, { passive: false });
  document.addEventListener('touchend', handleDragEnd);
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
}

function handleDragMove(e) {
  if (!dragState) return;
  e.preventDefault();

  let clientX;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
  } else {
    clientX = e.clientX;
  }

  const { rect, mode, originalStart, originalEnd } = dragState;
  const deltaX = clientX - dragState.startX;
  const deltaPercent = (deltaX / rect.width) * 100;
  const deltaMinutes = (deltaPercent / 100) * DAY_TOTAL;

  const snap = 5; // snap to 5 minutes
  let newStart = originalStart;
  let newEnd = originalEnd;

  if (mode === 'move') {
    newStart = Math.round((originalStart + deltaMinutes) / snap) * snap;
    newEnd = newStart + (originalEnd - originalStart);
  } else if (mode === 'resize-left') {
    newStart = Math.round((originalStart + deltaMinutes) / snap) * snap;
    if (newStart > newEnd - 10) newStart = newEnd - 10;
  } else if (mode === 'resize-right') {
    newEnd = Math.round((originalEnd + deltaMinutes) / snap) * snap;
    if (newEnd < newStart + 10) newEnd = newStart + 10;
  }

  // Clamp to day bounds
  newStart = Math.max(DAY_START, Math.min(DAY_END - 10, newStart));
  newEnd = Math.max(DAY_START + 10, Math.min(DAY_END, newEnd));

  // Update event data
  dragState.event.start = newStart;
  dragState.event.end = newEnd;

  // Update visual
  updateBlockPosition(dragState.event);
  updateTaskListTime(dragState.event);
}

function handleDragEnd(e) {
  if (!dragState) return;

  // Remove visual feedback
  document.querySelectorAll('.dft-block.dragging').forEach(el => el.classList.remove('dragging'));

  // Update timer if this event came from a timer
  const event = dragState.event;
  if (event.id.startsWith('timer-')) {
    const timerId = parseInt(event.id.replace('timer-', ''));
    const timer = timers.find(t => t.id === timerId);
    if (timer && timer.targetTime) {
      const newDate = new Date(timer.targetTime);
      newDate.setHours(Math.floor(event.start / 60), event.start % 60, 0, 0);
      timer.targetTime = newDate;
    }
    if (timer && event.end - event.start !== timer.duration) {
      timer.duration = event.end - event.start;
    }
  }

  // Save and re-render
  saveToStorage();
  renderTimers();
  renderDayFlow();

  // Cleanup
  dragState = null;
  document.removeEventListener('touchmove', handleDragMove);
  document.removeEventListener('touchend', handleDragEnd);
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
}

function updateBlockPosition(event) {
  const track = document.getElementById('dftTrack');
  if (!track) return;
  const block = track.querySelector(`[data-event-id="${event.id}"]`);
  if (!block) return;

  const left = ((event.start - DAY_START) / DAY_TOTAL) * 100;
  const width = ((event.end - event.start) / DAY_TOTAL) * 100;
  block.style.left = left + '%';
  block.style.width = Math.max(width, 1) + '%';
}

function updateTaskListTime(event) {
  const container = document.getElementById('dayflowTasks');
  if (!container) return;
  const items = container.querySelectorAll('.dftask-item');
  // Find corresponding item by matching event id (stored in block data)
  // For simplicity, we'll just update the first matching name
  const nameEl = Array.from(container.querySelectorAll('.dftask-name')).find(
    el => el.textContent === event.name
  );
  if (nameEl) {
    const timeEl = nameEl.parentElement.querySelector('.dftask-time');
    const durEl = nameEl.parentElement.parentElement.querySelector('.dftask-dur');
    const startH = Math.floor(event.start / 60);
    const startM = event.start % 60;
    const endH = Math.floor(event.end / 60);
    const endM = event.end % 60;
    if (timeEl) timeEl.textContent = `${startH}:${startM.toString().padStart(2, '0')}–${endH}:${endM.toString().padStart(2, '0')}`;
    if (durEl) durEl.textContent = formatHoursMinutes(event.end - event.start);
  }
}

function formatHoursMinutes(minutes) {
  if (minutes <= 0) return '0м';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}м`;
  if (mins === 0) return `${hrs}ч`;
  return `${hrs}ч ${mins}м`;
}

// ===== CHAT HANDLER =====
function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  // Add user message
  addChatMessage(text, 'user');

  // Parse and create timer
  const task = parseTaskInput(text);

  if (task && task.targetTime) {
    createTimer(task);
    const targetStr = formatTimeOfDay(task.targetTime);
    const durStr = task.duration ? ` на ${task.duration} мин` : '';
    addChatMessage(`✓ «${task.name}» установлен на ${targetStr}${durStr}`, 'system success');
  } else if (task) {
    addChatMessage(`✓ «${task.name}» добавлено (без таймера)`, 'system success');
  } else {
    addChatMessage('Не понял задачу. Попробуй: «Почистить зубы в 18:00» или «Через 30 минут выйти»', 'system');
  }
}

function addChatMessage(text, type) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  // Remove hint if present
  const hint = container.querySelector('.chat-hint');
  if (hint) hint.remove();

  const msg = document.createElement('div');
  msg.className = `chat-msg ${type}`;
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderTimers();
  renderDayFlow();
  setInterval(updateTimers, 1000);
  setInterval(renderDayFlow, 60000);
<<<<<<< Updated upstream
});
=======
});
>>>>>>> theirs
>>>>>>> Stashed changes

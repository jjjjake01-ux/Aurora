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
  subtitleText = 'Превосходно! Ты на 🔥';
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
  initStatusChartTooltip();
});

function initStatusChartTooltip() {
  const chart = document.querySelector('.status-chart svg');
  if (!chart) return;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.style.cssText = 'position:absolute;background:rgba(45,40,35,.9);color:#fff;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:600;font-family:Manrope;pointer-events:none;opacity:0;transition:opacity .2s;white-space:nowrap;z-index:50;';
  chart.style.position = 'relative';
  chart.appendChild(tooltip);
  
  chart.addEventListener('mousemove', (e) => {
    const rect = chart.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tooltip.style.opacity = '1';
    tooltip.style.left = (x + 10) + 'px';
    tooltip.style.top = (y - 30) + 'px';
    const hour = Math.round((x / rect.width) * 24);
    const displayHour = hour === 0 ? '00:00' : hour < 10 ? '0' + hour + ':00' : hour + ':00';
    tooltip.innerHTML = `<div style="color:#2FBF9B">Энергия: ${Math.round(60 + Math.random()*30)}%</div><div style="color:#E5677E;margin-top:2px">Стресс: ${Math.round(20 + Math.random()*25)}%</div><div style="color:#9A8F82;margin-top:2px;font-weight:500">${displayHour}</div>`;
  });
  
  chart.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
  });
}
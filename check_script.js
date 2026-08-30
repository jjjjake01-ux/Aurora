  let isScrollingUp = false;
  
  function getCurrentSection() {
    const sections = document.querySelectorAll('.snap-section');
    const app = document.querySelector('.app');
    const scrollTop = app ? app.scrollTop : window.pageYOffset;
    
    for (let section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
        return section;
      }
    }
    return null;
  }
  
  function scrollToBottom() {
    const app = document.querySelector('.app');
    const section = getCurrentSection();
    
    if (isScrollingUp) {
      if (section) {
        const sectionTop = section.offsetTop;
        if (app) {
          app.scrollTo({ top: sectionTop, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: sectionTop, behavior: 'smooth' });
        }
      }
    } else {
      if (section) {
        const sectionBottom = section.offsetTop + section.offsetHeight;
        if (app) {
          app.scrollTo({ top: sectionBottom - window.innerHeight + 100, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: sectionBottom - window.innerHeight + 100, behavior: 'smooth' });
        }
      } else if (app) {
        app.scrollTo({ top: app.scrollHeight, behavior: 'smooth' });
      }
    }
  }
  
  function updateButtonDirection() {
    const app = document.querySelector('.app');
    const btn = document.querySelector('.scroll-bottom-btn');
    if (!btn) return;
    
    const section = getCurrentSection();
    if (!section) return;
    
    const sectionBottom = section.offsetTop + section.offsetHeight;
    const scrollTop = app ? app.scrollTop : window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    const distanceFromBottom = sectionBottom - (scrollTop + windowHeight);
    
    if (distanceFromBottom < windowHeight * 0.3) {
      isScrollingUp = true;
      btn.classList.add('scroll-up');
    } else {
      isScrollingUp = false;
      btn.classList.remove('scroll-up');
    }
  }
  
    // History navigation & data
   const historyRange = { week: 0, month: 0 }; // offset from current period

   const historyBarsData = {
     week: [
       { val: 78, day: 'Сб' }, { val: 74, day: 'Вс' }, { val: 81, day: 'Пн' },
       { val: 69, day: 'Вт' }, { val: 85, day: 'Ср' }, { val: 72, day: 'Чт' },
       { val: 78, day: 'Пт' }
     ],
     month: [
       { val: 72, day: '1' }, { val: 75, day: '2' }, { val: 80, day: '3' },
       { val: 68, day: '4' }, { val: 74, day: '5' }, { val: 79, day: '6' },
       { val: 82, day: '7' }, { val: 77, day: '8' }, { val: 71, day: '9' },
       { val: 76, day: '10' }, { val: 83, day: '11' }, { val: 78, day: '12' },
       { val: 70, day: '13' }, { val: 75, day: '14' }, { val: 81, day: '15' },
       { val: 84, day: '16' }, { val: 79, day: '17' }, { val: 73, day: '18' },
       { val: 69, day: '19' }, { val: 76, day: '20' }, { val: 80, day: '21' },
       { val: 85, day: '22' }, { val: 72, day: '23' }, { val: 74, day: '24' },
       { val: 81, day: '25' }, { val: 69, day: '26' }, { val: 85, day: '27' },
       { val: 72, day: '28' }, { val: 78, day: '29' }
     ]
   };

   const historyPeriodLabels = {
     week: ['23–29 августа', '16–22 августа', '9–15 августа'],
     month: ['Август 2026', 'Июль 2026', 'Июнь 2026']
   };

   const historyStatsData = {
     week: { avg: 77, max: 85, trend: '+5', trendDir: 'up', trendLabel: 'выше нормы' },
     month: { avg: 77, max: 85, trend: '+3', trendDir: 'up', trendLabel: 'выше нормы' }
   };

   function renderHistoryBars(range) {
     const bars = document.getElementById('historyBars');
     const data = historyBarsData[range];
     if (!bars || !data) return;
     const maxVal = Math.max(...data.map(b => b.val));
     const lastIdx = data.length - 1;
     bars.innerHTML = data.map((b, i) => {
       const h = Math.max(12, (b.val / maxVal) * 48);
       const isToday = i === lastIdx;
       return `<div class="history-col${isToday ? ' today' : ''}"><span>${b.val}</span><div class="history-bar${isToday ? ' today' : ''}" style="height:${h}px"></div><i>${b.day}</i></div>`;
     }).join('');
   }

   function renderHistoryStats(range) {
     const stats = historyStatsData[range];
     if (!stats) return;
     document.getElementById('statAvg').textContent = stats.avg;
     document.getElementById('statMax').textContent = stats.max;
     const trendEl = document.getElementById('statTrend');
     const trendLabelEl = trendEl?.parentElement?.querySelector('.history-stat-label');
     if (trendEl) {
       const arrow = stats.trendDir === 'up'
         ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
         : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
       trendEl.innerHTML = arrow;
       trendEl.classList.toggle('down', stats.trendDir === 'down');
     }
     if (trendLabelEl) {
       trendLabelEl.innerHTML = `${stats.trend} к норме`;
     }
   }

   function switchHistoryRange(range) {
     document.getElementById('toggleWeek').classList.toggle('active', range === 'week');
     document.getElementById('toggleWeek').setAttribute('aria-selected', range === 'week');
     document.getElementById('toggleMonth').classList.toggle('active', range === 'month');
     document.getElementById('toggleMonth').setAttribute('aria-selected', range === 'month');
     historyRange[range] = 0;
     updateHistoryPeriodLabel(range);
     renderHistoryBars(range);
     renderHistoryStats(range);
   }

   function navHistoryPeriod(dir) {
     const range = document.getElementById('toggleWeek').classList.contains('active') ? 'week' : 'month';
     const labels = historyPeriodLabels[range];
     const newOffset = Math.max(0, Math.min(labels.length - 1, historyRange[range] + dir));
     historyRange[range] = newOffset;
     updateHistoryPeriodLabel(range);
     document.getElementById('historyPrev').style.opacity = newOffset >= labels.length - 1 ? '0.3' : '1';
     document.getElementById('historyNext').style.opacity = newOffset <= 0 ? '0.3' : '1';
   }

   function updateHistoryPeriodLabel(range) {
     const labels = historyPeriodLabels[range];
     const offset = historyRange[range];
     const idx = labels.length - 1 - offset;
     document.getElementById('historyPeriodLabel').textContent = labels[idx] || labels[0];
   }

   // History panel toggle (global — используется в onclick кнопки)
  function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    const btn = document.getElementById('historyBtn');
    const open = panel.classList.toggle('open');
    btn.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', open);
    if (!open) {
      const card = btn.closest('.activity-index-card');
      if (card) card.classList.remove('history-collapsed');
      const sec = document.getElementById('historySection');
      const moreBtn = document.getElementById('historyMoreBtn');
      if (sec) sec.classList.remove('expanded');
      if (moreBtn) {
        moreBtn.classList.remove('expanded');
        moreBtn.setAttribute('aria-expanded', 'false');
        if (moreBtn.firstChild) moreBtn.firstChild.textContent = 'Показать все дни ';
      }
    }
  }

  // Show more / collapse history days (global)
  function toggleHistoryDays() {
    const sec = document.getElementById('historySection');
    const btn = document.getElementById('historyMoreBtn');
    const open = sec.classList.toggle('expanded');
    btn.classList.toggle('expanded', open);
    btn.setAttribute('aria-expanded', open);
    btn.firstChild.textContent = open ? 'Свернуть ' : 'Показать все дни ';
    const card = sec.closest('.activity-index-card');
    if (card) card.classList.toggle('history-collapsed', open);
  }

  document.addEventListener('DOMContentLoaded', function() {
    const app = document.querySelector('.app');
    if (app) {
      app.addEventListener('scroll', updateButtonDirection);
    } else {
      window.addEventListener('scroll', updateButtonDirection);
    }
    updateButtonDirection();

        // Activity tabs
    const tabs = document.querySelectorAll('.activity-tab');
    const panels = document.querySelectorAll('.tab-panel');
    const initializedTabs = new Set();
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panelId = 'tab-' + tab.dataset.tab;
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('active');

        document.body.setAttribute('data-active-tab', tab.dataset.tab);

        if (!initializedTabs.has(tab.dataset.tab)) {
          const trackId = tab.dataset.tab + 'Track';
          if (typeof initCarouselById === 'function') {
            initCarouselById(trackId);
          }
          initializedTabs.add(tab.dataset.tab);
        }
      });
    });

    document.body.setAttribute('data-active-tab', 'steps');

    if (typeof initCarouselById === 'function') {
      initCarouselById('stepsTrack');
      initializedTabs.add('steps');
    }
  });


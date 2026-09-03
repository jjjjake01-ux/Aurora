// MICRO-ACTIONS
const MicroActions = {
  actions: [
    {
      id: 'water',
      text: 'Выпей стакан воды',
      sub: '2 минуты · увлажнение',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"/></svg>'
    },
    {
      id: 'blink',
      text: 'Моргни 20 раз',
      sub: '1 минута · отдых для глаз',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
    },
    {
      id: 'stretch',
      text: 'Потянись 30 секунд',
      sub: '1 минута · снятие напряжения',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M5 8H4a4 4 0 0 0 0 8h1"/><path d="M8 6v12M16 6v12"/></svg>'
    },
    {
      id: 'breathe',
      text: 'Сделай 5 глубоких вдохов',
      sub: '2 минуты · успокоение',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    },
    {
      id: 'posture',
      text: 'Проверь осанку',
      sub: '30 секунд · коррекция',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>'
    },
    {
      id: 'walk',
      text: 'Сделай 50 шагов',
      sub: '1 минута · разминка',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4l3 5-3 5 4 6M9 20l-2-4 4-3-2-4 3-5"/></svg>'
    }
  ],

  currentIndex: 0,

  init() {
    this.loadIndex();
    this.render();
  },

  loadIndex() {
    const saved = localStorage.getItem('microActionIndex');
    if (saved !== null) {
      this.currentIndex = parseInt(saved, 10);
    }
  },

  saveIndex() {
    localStorage.setItem('microActionIndex', this.currentIndex.toString());
  },

  getCurrentAction() {
    return this.actions[this.currentIndex];
  },

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.actions.length;
    this.saveIndex();
    this.render();
  },

  render() {
    const action = this.getCurrentAction();
    const container = document.getElementById('microActionCard');
    if (!container) return;

    container.innerHTML = `
      <div class="mac-icon">${action.icon}</div>
      <div class="mac-content">
        <div class="mac-text">${action.text}</div>
        <div class="mac-sub">${action.sub}</div>
      </div>
      <button class="mac-btn" type="button" onclick="MicroActions.complete()">
        Сделано
      </button>
    `;
  },

  complete() {
    const card = document.getElementById('microActionCard');
    if (card) {
      card.classList.add('is-done');
      setTimeout(() => {
        card.classList.remove('is-done');
        this.next();
      }, 600);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MicroActions.init();
});

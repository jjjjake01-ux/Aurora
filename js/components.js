// js/components.js — загрузка компонентов из папки components/
// fetch + innerHTML, чтобы SVG-градиенты из svg-defs.html и карточек
// жили в одном document и видели друг друга.

const COMPONENTS = [
  { sel: '#comp-svg-defs',       path: 'components/svg-defs.html' },
  { sel: '#comp-hero-header',    path: 'components/hero-header.html' },
  { sel: '#comp-readiness-card', path: 'components/readiness-card.html' },
  { sel: '#comp-plan-section',   path: 'components/plan-section.html' },
  { sel: '#comp-task-modal',     path: 'components/task-modal.html' },
];

async function loadComponent(entry) {
  const host = document.querySelector(entry.sel);
  if (!host) { console.warn('[components] not found:', entry.sel); return; }
  try {
    const res = await fetch(entry.path);
    if (!res.ok) throw new Error(res.status);
    host.innerHTML = await res.text();
  } catch (e) {
    console.error('[components] failed', entry.path, e);
    host.innerHTML = '<!-- component error: ' + entry.path + ' -->';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  for (const entry of COMPONENTS) {
    await loadComponent(entry);
  }
  // После вставки — убедиться, что скролл-навигация и круговая диаграмма живы
  if (typeof updateScrollVisuals === 'function') updateScrollVisuals();
  if (typeof updateActivityAtmosphere === 'function') updateActivityAtmosphere();
  if (typeof updateRecoveryMetrics === 'function') updateRecoveryMetrics();
});

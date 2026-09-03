#!/usr/bin/env python3
"""Замена блоков в index.html на контейнеры компонентов + подключение components.js"""

import re

PATH = r"C:\Users\Куаныш\Aurora\index.html"

with open(PATH, "r", encoding="utf-8") as f:
    html = f.read()

replacements = [
    # 1. Readiness card — блок от <!-- СТАТУС ДНЯ --> до </div> перед комментарием "ГЛАВНОЕ ДЕЙСТВИЕ ДНЯ"
    (
        r'<!-- СТАТУС ДНЯ -->\s*<div class="card status-card".*?</div>\s*</div>\s*</div>\s*(?=<!-- ГЛАВНОЕ ДЕЙСТВИЕ ДНЯ -->)',
        '<div id="comp-readiness-card"></div>\n\n    ',
        re.DOTALL
    ),
    # 2. Hero header — блок от <!-- ПРИВЕТСТВИЕ --> до </div> перед <!-- СТАТУС ДНЯ -->
    (
        r'<!-- ПРИВЕТСТВИЕ -->\s*<div class="hero-header">.*?</div>\s*</div>\s*(?=<!-- СТАТУС ДНЯ -->)',
        '<div id="comp-hero-header"></div>\n\n    ',
        re.DOTALL
    ),
    # 3. Plan section — блок от <!-- СТРАНИЦА 2: ПЛАН И МЕТРИКИ --> до </div> перед <!-- СТРАНИЦА: Тренировка -->
    (
        r'<!-- СТРАНИЦА 2: ПЛАН И МЕТРИКИ \(Адаптивная версия\) -->\s*<div class="snap-section">.*?</div>\s*</div>\s*(?=<!-- СТРАНИЦА: Тренировка -->)',
        '<div id="comp-plan-section"></div>\n\n  ',
        re.DOTALL
    ),
    # 4. Task modal — блок от <!-- МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ЗАДАЧИ --> до обрезка дубля (включая дубликат)
    (
        r'<!-- МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ЗАДАЧИ -->\s*<div class="task-modal-overlay".*?</div>\s*</div>\s*</div>\s*$',
        '<div id="comp-task-modal"></div>',
        re.DOTALL | re.MULTILINE
    ),
]

for pattern, replacement, flags in replacements:
    new_html, n = re.subn(pattern, replacement, html, flags=flags)
    if n == 0:
        print(f"WARNING: pattern not matched: {pattern[:60]}...")
    else:
        print(f"OK: replaced {n} occurrence(s)")
        html = new_html

# 5. Подключаем components.js перед </body>
if '<script src="js/components.js"></script>' not in html:
    html = html.replace('</body>', '  <script src="js/components.js"></script>\n</body>')
    print("OK: added components.js script tag")
else:
    print("OK: components.js already linked")

# 6. Удаляем дубликат строки 2373-2377 (остаток модалки), если ещё не удалился
html = re.sub(
    r'\s*<button class="tm-btn-cancel".*?</div>\s*</div>\s*</div>\s*$',
    '\n',
    html,
    flags=re.DOTALL | re.MULTILINE
)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(html)

print("DONE: index.html updated")

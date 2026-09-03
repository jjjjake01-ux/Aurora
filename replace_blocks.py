#!/usr/bin/env python3
"""Заменить inline-блоки hero-header и plan-section на контейнеры компонентов.
В отличие от update_index.py использует явные строковые маркеры и операции по индексам строк."""

PATH = r"C:\Users\Куаныш\Aurora\index.html"

with open(PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()

result = []
i = 0
replaced = []

while i < len(lines):
    line = lines[i]

    # --- Hero header ---
    if "<!-- ПРИВЕТСТВИЕ -->" in line:
        start = i
        # ищем закрывающий маркер: пустая строка перед readiness-card, или строку с readiness-card
        j = i + 1
        while j < len(lines):
            # Блок hero-header заканчивается перед строкой с comp-readiness-card
            if 'id="comp-readiness-card"' in lines[j]:
                # пропускаем строки start..j-1
                replaced.append(("hero-header", start, j - 1))
                # вставляем контейнер
                indent = line[:len(line) - len(line.lstrip())]
                result.append(f"{indent}<div id=\"comp-hero-header\"></div>\n")
                # пропускаем также пустую строку перед readiness-card, если есть
                if j < len(lines) and lines[j].strip() == "":
                    # оставляем пустую строку как разделитель
                    result.append(lines[j])
                    i = j + 1
                else:
                    i = j
                break
            j += 1
        else:
            # маркер не найден — просто копируем
            result.append(line)
            i += 1
        continue

    # --- Plan section ---
    if "<!-- СТРАНИЦА 2: ПЛАН И МЕТРИКИ (Адаптивная версия) -->" in line:
        start = i
        j = i + 1
        while j < len(lines):
            if "<!-- СТРАНИЦА: Тренировка -->" in lines[j]:
                replaced.append(("plan-section", start, j - 1))
                indent = line[:len(line) - len(line.lstrip())]
                result.append(f"{indent}<div id=\"comp-plan-section\"></div>\n")
                # пропускаем пустую строку перед этим комментарием, если есть
                if j > 0 and lines[j - 1].strip() == "":
                    # мы уже заменили блок, теперь j — это строка с комментарием СТРАНИЦА: Тренировка
                    # не пропускаем её, просто переходим к ней
                    i = j
                else:
                    i = j
                break
            j += 1
        else:
            result.append(line)
            i += 1
        continue

    result.append(line)
    i += 1

with open(PATH, "w", encoding="utf-8") as f:
    f.writelines(result)

print("Замены:")
for name, start, end in replaced:
    print(f"  {name}: строки {start + 1}-{end + 1}")
print(f"Всего обработано строк: {len(lines)} → {len(result)}")

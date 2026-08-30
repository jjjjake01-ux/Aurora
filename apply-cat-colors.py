import re
with open('D:/App2/reps.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('АКТИВНОСТЬ ДНЯ')
end = text.find('СОН', start)

before = text[:start]
page = text[start:end]
after = text[end:]

# Цвета для каждой категории
cat_colors = {
    'steps': '#F0A090',      # персиковый
    'calories': '#E8A07A',   # светло-оранжевый
    'distance': '#E88060',   # коралловый
    'sitting': '#C87050',    # тёмно-коралловый
}

# Границы секций
sections = []
for cat in ['steps', 'calories', 'distance', 'sitting']:
    cat_start = page.find(f'id="tab-{cat}"')
    cat_end = page.find(f'end tab-{cat}')
    if cat_start > 0 and cat_end > 0:
        sections.append((cat_start, cat_end, cat))
        print(f'{cat}: {cat_start} - {cat_end}')

# Сортируем по позиции
sections.sort(key=lambda x: x[0])

# Заменяем цвета в каждой секции
new_page = ""
prev_end = 0
for cat_start, cat_end, cat in sections:
    # Добавляем текст до секции
    new_page += page[prev_end:cat_start]
    
    # Берём секцию
    section = page[cat_start:cat_end]
    
    # Заменяем все цвета на цвет категории
    target_color = cat_colors[cat]
    # Находим все цвета в секции
    colors_in_section = re.findall(r'#[0-9A-Fa-f]{6}', section)
    unique_colors = set(colors_in_section)
    
    for color in unique_colors:
        section = section.replace(color, target_color)
    
    new_page += section
    prev_end = cat_end
    print(f'{cat}: replaced {len(unique_colors)} colors with {target_color}')

# Добавляем оставшийся текст
new_page += page[prev_end:]

text = before + new_page + after
with open('D:/App2/reps.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('\nDone!')

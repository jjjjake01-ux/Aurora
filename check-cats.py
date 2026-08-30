import re
with open('D:/App2/reps.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('АКТИВНОСТЬ ДНЯ')
end = text.find('СОН', start)
page = text[start:end]

# Ищу табы
tabs = re.findall(r'id="tab-([^"]+)"', page)
print('Табы:', tabs)

# Ищу карточки по категориям
categories = ['steps', 'calories', 'distance', 'sitting']
for cat in categories:
    cat_start = page.find(f'id="tab-{cat}"')
    if cat_start > 0:
        # Ищем конец секции (следующий таб или end tab)
        next_tab = page.find('end tab-', cat_start + 1)
        if next_tab == -1:
            next_tab = cat_start + 1000
        chunk = page[cat_start:next_tab]
        colors = re.findall(r'#[0-9A-Fa-f]{6}', chunk)
        print(f'{cat}: {len(chunk)} chars, colors = {colors}')

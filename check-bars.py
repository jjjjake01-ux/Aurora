import re
with open('D:/App2/reps.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('АКТИВНОСТЬ ДНЯ')
end = text.find('СОН', start)
page = text[start:end]

# Ищем progress-fill в каждой категории
categories = ['steps', 'calories', 'distance', 'sitting']
for cat in categories:
    cat_start = page.find(f'id="tab-{cat}"')
    cat_end = page.find(f'end tab-{cat}')
    if cat_start > 0 and cat_end > 0:
        section = page[cat_start:cat_end]
        # Ищем progress-fill или aim-fill
        fills = re.findall(r'class="[^"]*(?:progress-fill|aim-fill)[^"]*"', section)
        gradients = re.findall(r'background:linear-gradient\([^)]+\)', section)
        print(f'{cat}:')
        print(f'  fills: {fills[:3]}')
        print(f'  gradients: {gradients[:3]}')
        print()

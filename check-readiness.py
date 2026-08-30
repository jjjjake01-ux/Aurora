import re
with open('D:/App2/reps.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('Готовность')
end = text.find('АКТИВНОСТЬ ДНЯ')
page = text[start:end]

classes = re.findall(r'class="([^"]+)"', page)
unique_classes = sorted(set(classes))

print('Classes on readiness page:')
for c in unique_classes:
    print('  ' + c)

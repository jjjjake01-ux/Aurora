import re
with open('D:/App2/reps.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('АКТИВНОСТЬ ДНЯ')
end = text.find('СОН', start)
page = text[start:end]

# Ищем все arc-элементы
arcs = re.findall(r'id="([^"]*Arc[^"]*)"', page)
print('Arc elements:', arcs)

# Ищем все svg с arc (viewBox 100 60)
svg_arcs = re.findall(r'viewBox="[^"]*100 60[^"]*"', page)
print('SVG arcs found:', len(svg_arcs))

# Ищем gradient definitions для arc
grad_defs = re.findall(r'<defs>.*?</defs>', page, re.DOTALL)
print('Gradient definitions:')
for g in grad_defs:
    print(g[:200])
    print()

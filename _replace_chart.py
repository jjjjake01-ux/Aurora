import pathlib

p = pathlib.Path('D:/App2/reps.html')
content = p.read_text(encoding='utf-8')

# Ищем начало и конец блока для замены
start_marker = '<div class="status-chart">'
end_marker = '</div>      <div class="status-mascot">'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1:
    print("ERROR: start marker not found")
    exit(1)
if end_idx == -1:
    print("ERROR: end marker not found")
    exit(1)

print(f"Found block at {start_idx} to {end_idx}")

new_block = '''<div class="status-chart">
        <div class="chart-bars">
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar" style="--bar-h:62%"><span class="chart-bar-value">62</span></div>
            </div>
            <span class="chart-bar-label">Пн</span>
          </div>
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar" style="--bar-h:58%"><span class="chart-bar-value">58</span></div>
            </div>
            <span class="chart-bar-label">Вт</span>
          </div>
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar" style="--bar-h:71%"><span class="chart-bar-value">71</span></div>
            </div>
            <span class="chart-bar-label">Ср</span>
          </div>
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar" style="--bar-h:65%"><span class="chart-bar-value">65</span></div>
            </div>
            <span class="chart-bar-label">Чт</span>
          </div>
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar" style="--bar-h:75%"><span class="chart-bar-value">75</span></div>
            </div>
            <span class="chart-bar-label">Пт</span>
          </div>
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar highlight" style="--bar-h:82%"><span class="chart-bar-value">82</span></div>
            </div>
            <span class="chart-bar-label">Сб</span>
          </div>
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar today" style="--bar-h:78%"><span class="chart-bar-value">78</span></div>
            </div>
            <span class="chart-bar-label">Вс</span>
          </div>
        </div>
      </div>      <div class="status-mascot">'''

content = content[:start_idx] + new_block + content[end_idx + len(end_marker):]

p.write_text(content, encoding='utf-8')
print("OK - chart replaced")

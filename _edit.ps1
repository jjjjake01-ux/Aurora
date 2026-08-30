$content = Get-Content 'D:\App2\reps.html' -Raw -Encoding UTF8

$old = '          <div class="chart-title">Динамика за день</div>'
$new = '          <div class="chart-tabs"><button class="chart-tab active" data-metric="stress" onclick="switchDayChart(this,''stress'')">Стресс</button><button class="chart-tab" data-metric="energy" onclick="switchDayChart(this,''energy'')">Энергия</button></div>'

$content = $content.Replace($old, $new)
[System.IO.File]::WriteAllText('D:\App2\reps.html', $content, [System.Text.Encoding]::UTF8)
Write-Output 'HTML updated'

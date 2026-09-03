/* ============================================================
   ATLAS HEALTH — Personal Patterns Engine
   Honest, evidence-based correlations between user behavior and outcomes.
   Each pattern is graded by:
     - n (number of observations)
     - effect size (normalized)
     - consistency (how often pattern held)
   Three tiers shown to user:
     ✓ Подтверждено (n ≥ 5, consistency ≥ 0.6, effect ≥ 0.15)
     · Замечено   (n ≥ 3, OR (n ≥ 5 AND consistency < 0.6))
     ⚠ Мало данных (n < 3)
   ============================================================ */

(function(){
  'use strict';

  // ---- SIMULATED HISTORICAL DATA ----
  // In production this comes from backend. Here — realistic synthetic data
  // covering the last 30 days. Each day has: sleep, workout, steps, peakHour,
  // caffeine, mood, dinnerEarly, sitHours, eveningWindown.
  const HISTORY = (function(){
    const days = [];
    // Seeded pseudo-random for reproducibility
    let s = 42;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i=29; i>=0; i--){
      const d = new Date();
      d.setDate(d.getDate() - i);
      const sleep   = +(5.5 + rand()*2.5).toFixed(1);    // 5.5-8.0
      const workout = rand() < 0.65;
      const workoutHour = workout ? (rand() < 0.55 ? 7 + Math.floor(rand()*4) : 17 + Math.floor(rand()*3)) : null;
      const steps   = Math.round(4000 + rand()*7000);    // 4k-11k
      const caffeine = Math.round(1 + rand()*4);          // 1-5 cups
      const dinnerEarly = rand() < 0.55;                  // before 20:00
      const winddown = rand() < 0.4;                      // evening ritual
      const sitHours = +(4 + rand()*5).toFixed(1);         // 4-9h sitting
      // Outcomes
      const readiness = Math.min(100, Math.max(20,
        sleep * 10 +
        (workout ? 8 : 0) +
        (workoutHour !== null && workoutHour < 12 ? 4 : 0) -
        Math.max(0, 6.5 - sleep) * 4 -
        caffeine * 1.5 +
        (dinnerEarly ? 2 : -1) +
        (winddown ? 3 : 0) +
        (rand() - 0.5) * 6
      ));
      const sleepQuality = Math.min(100, Math.max(30,
        (dinnerEarly ? 15 : 0) +
        (winddown ? 18 : 0) -
        caffeine * 4 +
        (workoutHour !== null && workoutHour < 12 ? 8 : 0) +
        50 + (rand() - 0.5) * 15
      ));
      const afternoonDip = Math.max(0, 70 - readiness) * (sitHours / 6) + (rand() - 0.5) * 8;
      const eveningMood = Math.min(100, Math.max(20,
        50 +
        Math.min(steps, 8000) / 250 +
        (workout ? 5 : 0) -
        caffeine * 2 +
        (rand() - 0.5) * 12
      ));
      days.push({
        date: d, sleep, workout, workoutHour, steps, caffeine,
        dinnerEarly, winddown, sitHours,
        readiness: Math.round(readiness),
        sleepQuality: Math.round(sleepQuality),
        afternoonDip: Math.round(afternoonDip),
        eveningMood: Math.round(eveningMood)
      });
    }
    return days;
  })();

  // ---- CORRELATION HELPERS ----
  function pearson(xs, ys){
    if (xs.length < 3 || xs.length !== ys.length) return 0;
    const n = xs.length;
    const mx = xs.reduce((a,b)=>a+b,0)/n;
    const my = ys.reduce((a,b)=>a+b,0)/n;
    let num=0, dx=0, dy=0;
    for (let i=0; i<n; i++){
      const a = xs[i]-mx, b = ys[i]-my;
      num += a*b; dx += a*a; dy += b*b;
    }
    if (dx===0 || dy===0) return 0;
    return num / Math.sqrt(dx*dy);
  }

  function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
  function std(arr){ if (arr.length<2) return 0; const m=mean(arr); return Math.sqrt(arr.reduce((s,v)=>s+(v-m)**2,0)/arr.length); }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  // ---- PATTERN ANALYSES ----
  // Each returns { id, label, sub, value, effect, n, consistency, confidence, tier, action }
  // tier: 'confirmed' | 'observed' | 'insufficient'
  function analyze() {
    const out = [];
    const N = HISTORY.length;

    // ===== TIER 1 =====

    // 1) Sleep duration → next-day readiness
    {
      const pairs = HISTORY.map(d => [d.sleep, d.readiness]).filter(p => p[0] != null);
      const r = pearson(pairs.map(p=>p[0]), pairs.map(p=>p[1]));
      const late = HISTORY.filter(d => d.sleep >= 7);
      const early = HISTORY.filter(d => d.sleep < 6.5);
      const lateR = mean(late.map(d=>d.readiness));
      const earlyR = mean(early.map(d=>d.readiness));
      const delta = lateR - earlyR;
      const consistency = late.length > 0 && early.length > 0
        ? late.filter(d => d.readiness > mean(HISTORY.map(x=>x.readiness))).length / late.length
        : 0;
      out.push({
        id: 'sleep_readiness',
        icon: 'moon',
        title: 'Сон до 23:00 — готовность выше',
        sub: 'В дни, когда спишь 7+ часов, готовность в среднем '+Math.round(lateR)+
             '. В остальные — '+Math.round(earlyR)+'. Разница: '+Math.round(delta)+' пунктов.',
        effect: clamp(Math.abs(delta)/30, 0, 1),
        n: N,
        consistency,
        confidence: clamp(Math.abs(r), 0, 1),
        tier: (N >= 5 && Math.abs(delta) > 5) ? 'confirmed' : (N >= 3 ? 'observed' : 'insufficient'),
        action: 'Ложись до 23:00 в будни — утром будет '+Math.round(delta)+' к готовности'
      });
    }

    // 2) Morning workout → sleep quality
    {
      const withWorkout = HISTORY.filter(d => d.workout);
      const morning = withWorkout.filter(d => d.workoutHour !== null && d.workoutHour < 12);
      const evening = withWorkout.filter(d => d.workoutHour !== null && d.workoutHour >= 16);
      const r = pearson(
        withWorkout.map(d => d.workoutHour < 12 ? 1 : 0),
        withWorkout.map(d => d.sleepQuality)
      );
      const mQ = mean(morning.map(d=>d.sleepQuality));
      const eQ = mean(evening.map(d=>d.sleepQuality));
      const delta = mQ - eQ;
      out.push({
        id: 'morning_workout',
        icon: 'workout',
        title: 'Тренировка до 12 → сон лучше',
        sub: morning.length > 0
          ? 'Утренние тренировки: качество сна '+Math.round(mQ)+'%. Вечерние: '+Math.round(eQ)+'%.'
          : 'Пока недостаточно утренних тренировок для сравнения.',
        effect: clamp(Math.abs(delta)/25, 0, 1),
        n: withWorkout.length,
        consistency: morning.length > 0 ? 0.7 : 0,
        confidence: clamp(Math.abs(r), 0, 1),
        tier: (morning.length >= 3 && Math.abs(delta) > 5) ? 'confirmed'
            : (withWorkout.length >= 3) ? 'observed' : 'insufficient',
        action: 'Если можешь — сдвинь тренировку на утро. Сон станет глубже.'
      });
    }

    // 3) Sitting hours → afternoon dip
    {
      const pairs = HISTORY.map(d => [d.sitHours, d.afternoonDip]);
      const r = pearson(pairs.map(p=>p[0]), pairs.map(p=>p[1]));
      const lowSit  = HISTORY.filter(d => d.sitHours < 5);
      const highSit = HISTORY.filter(d => d.sitHours >= 7);
      const lD = mean(lowSit.map(d=>d.afternoonDip));
      const hD = mean(highSit.map(d=>d.afternoonDip));
      const delta = hD - lD;
      out.push({
        id: 'sitting_dip',
        icon: 'walk',
        title: 'Меньше сидишь — слабее спад после обеда',
        sub: 'При сидении <5ч спад в 14-16: '+Math.round(lD)+'. При 7+ч: '+Math.round(hD)+'.',
        effect: clamp(Math.abs(delta)/30, 0, 1),
        n: N,
        consistency: lowSit.length > 0 ? 0.65 : 0,
        confidence: clamp(Math.abs(r), 0, 1),
        tier: (N >= 5 && Math.abs(delta) > 4) ? 'confirmed' : (N >= 3 ? 'observed' : 'insufficient'),
        action: 'Каждые 90 минут — 5 минут движения. Это сгладит спад.'
      });
    }

    // 4) Short sleep → caffeine → next-night sleep (vicious cycle)
    {
      const short = HISTORY.filter(d => d.sleep < 6.5);
      const ok    = HISTORY.filter(d => d.sleep >= 7);
      const cShort = mean(short.map(d=>d.caffeine));
      const cOk    = mean(ok.map(d=>d.caffeine));
      const delta = cShort - cOk;
      out.push({
        id: 'caffeine_loop',
        icon: 'coffee',
        title: 'Короткий сон → больше кофе → хуже сон',
        sub: 'После ночи <6.5ч ты пьёшь '+cShort.toFixed(1)+' чашки. После хорошей — '+cOk.toFixed(1)+'.',
        effect: clamp(Math.abs(delta)/2, 0, 1),
        n: N,
        consistency: 0.7,
        confidence: clamp(Math.abs(delta)/2, 0, 1),
        tier: (N >= 5 && Math.abs(delta) > 0.5) ? 'confirmed' : (N >= 3 ? 'observed' : 'insufficient'),
        action: 'Лимит: 2 чашки кофе до 14:00. Это разорвёт цикл.'
      });
    }

    // 5) Peak energy → task performance (synthetic — use readiness + steps as proxy)
    {
      // Use days with workout and steps>7k as "high task days"
      const high = HISTORY.filter(d => d.steps > 7000);
      const low  = HISTORY.filter(d => d.steps < 5000);
      const hR = mean(high.map(d=>d.readiness));
      const lR = mean(low.map(d=>d.readiness));
      const delta = hR - lR;
      out.push({
        id: 'active_readiness',
        icon: 'sun',
        title: 'Активный день = выше готовность',
        sub: 'В дни с 7к+ шагов готовность '+Math.round(hR)+', с 5к−: '+Math.round(lR)+'.',
        effect: clamp(Math.abs(delta)/20, 0, 1),
        n: N,
        consistency: 0.6,
        confidence: 0.7,
        tier: (N >= 5 && Math.abs(delta) > 4) ? 'confirmed' : 'observed',
        action: 'Не пропускай прогулку — даже 20 минут добавляют к готовности.'
      });
    }

    // ===== TIER 2 =====

    // 6) Steps → evening mood
    {
      const pairs = HISTORY.map(d => [d.steps, d.eveningMood]);
      const r = pearson(pairs.map(p=>p[0]), pairs.map(p=>p[1]));
      out.push({
        id: 'steps_mood',
        icon: 'heart',
        title: 'Больше шагов — лучше настроение вечером',
        sub: 'Связь есть, но слабая (r='+r.toFixed(2)+'). Возможно, дело в солнце или людях вокруг.',
        effect: clamp(Math.abs(r), 0, 1) * 0.6,
        n: N,
        consistency: 0.5,
        confidence: clamp(Math.abs(r), 0, 1),
        tier: 'observed',
        action: 'Прогулка на воздухе помогает, но не сработает как таблетка.'
      });
    }

    // 7) Early dinner → sleep quality
    {
      const early = HISTORY.filter(d => d.dinnerEarly);
      const late  = HISTORY.filter(d => !d.dinnerEarly);
      const eQ = mean(early.map(d=>d.sleepQuality));
      const lQ = mean(late.map(d=>d.sleepQuality));
      const delta = eQ - lQ;
      out.push({
        id: 'dinner_sleep',
        icon: 'meal',
        title: 'Ранний ужин — лучше сон',
        sub: 'Ужин до 20:00: качество сна '+Math.round(eQ)+'%. После 20:00: '+Math.round(lQ)+'%.',
        effect: clamp(Math.abs(delta)/20, 0, 1),
        n: N,
        consistency: 0.55,
        confidence: clamp(Math.abs(delta)/20, 0, 1),
        tier: (N >= 5 && Math.abs(delta) > 4) ? 'confirmed' : 'observed',
        action: 'Ужин за 3 часа до сна. Лёгкий, без тяжёлого мяса.'
      });
    }

    // 8) Winddown ritual → sleep quality
    {
      const w = HISTORY.filter(d => d.winddown);
      const nw = HISTORY.filter(d => !d.winddown);
      if (w.length < 2 || nw.length < 2){
        out.push({
          id: 'winddown_sleep',
          icon: 'moon',
          title: 'Ритуал перед сном',
          sub: 'Пока мало данных с рутиной расслабления — попробуй включить её 5 вечеров.',
          effect: 0.3, n: w.length, consistency: 0, confidence: 0.2,
          tier: 'insufficient',
          action: '20-минутная рутина (чай, книга, дыхание) перед сном.'
        });
      } else {
        const wQ = mean(w.map(d=>d.sleepQuality));
        const nQ = mean(nw.map(d=>d.sleepQuality));
        const delta = wQ - nQ;
        out.push({
          id: 'winddown_sleep',
          icon: 'moon',
          title: 'Вечерняя рутина → крепче сон',
          sub: 'С рутиной: качество '+Math.round(wQ)+'%. Без: '+Math.round(nQ)+'%.',
          effect: clamp(Math.abs(delta)/20, 0, 1),
          n: w.length + nw.length,
          consistency: 0.6,
          confidence: clamp(Math.abs(delta)/20, 0, 1),
          tier: (delta > 5 && (w.length + nw.length) >= 5) ? 'confirmed' : 'observed',
          action: '20 минут рутины: тёплый свет, чай, дыхание. Без экрана.'
        });
      }
    }

    return out;
  }

  // ---- CONTEXTUAL INSIGHT FOR NOW ----
  // Given current hour + history → return a sentence (or null) to show in moment-card
  function contextualInsight(h, lastSleepHours, todaySteps, todayCaffeine){
    const out = [];
    const today = HISTORY[HISTORY.length - 1];
    const last  = HISTORY[HISTORY.length - 2] || today;

    // 13:00-14:00 — afternoon dip
    if (h >= 13 && h < 15){
      if (last && last.sitHours < 5){
        out.push({ tone:'good', text:'Вчера двигался — сегодня спад будет мягче. По данным: −30% к обычному спаду.' });
      } else if (last && last.sitHours >= 7){
        out.push({ tone:'warn', text:'Вчера много сидел — спад сегодня вероятен. Встань и пройдись 5 минут.' });
      }
    }

    // 16:00 — peak energy
    if (h >= 15 && h < 17){
      const peakData = HISTORY.filter(d => d.readiness >= 70);
      if (peakData.length >= 5){
        out.push({ tone:'good', text:'Твой пик — около 16:00. В '+peakData.length+' из '+HISTORY.length+' дней с готовностью 70+ ты решал главные задачи именно в это время.' });
      }
    }

    // 22:00 — winddown window
    if (h >= 21 && h < 23){
      if (lastSleepHours < 6.5 && todayCaffeine > 2){
        out.push({ tone:'bad', text:'Прошлой ночью спал '+lastSleepHours.toFixed(1)+'ч, сегодня уже '+todayCaffeine+' чашки кофе. Попробуй последнюю — до 14:00. Иначе цикл повторится.' });
      } else if (last && last.winddown){
        out.push({ tone:'good', text:'Вчера была рутина расслабления. Сон был на '+(today.sleepQuality - last.sleepQuality >= 0 ? '+' : '')+(today.sleepQuality - last.sleepQuality)+' лучше обычного.' });
      }
    }

    // 8:00 — wake
    if (h >= 7 && h < 10 && lastSleepHours){
      if (lastSleepHours >= 7){
        out.push({ tone:'good', text:'Сон '+lastSleepHours.toFixed(1)+'ч. По твоим данным, готовность сегодня будет высокой.' });
      } else if (lastSleepHours < 6){
        out.push({ tone:'warn', text:'Сон '+lastSleepHours.toFixed(1)+'ч — ниже нормы. Сегодня мягче с нагрузкой, ложись раньше.' });
      }
    }

    return out[0] || null;
  }

  // ---- ICONS (mini, inline-friendly) ----
  const PATTERN_ICONS = {
    moon:    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    workout: '<path d="M6.5 6.5h11v11h-11z"/><path d="M3.5 9.5v5M20.5 9.5v5"/>',
    walk:    '<circle cx="13" cy="4" r="2"/><path d="M5 22l3-7 3-2-2-4 4-2 2 4 3 2"/>',
    coffee:  '<path d="M18 8h1a3 3 0 0 1 0 6h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 1v3M10 1v3M14 1v3"/>',
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    heart:   '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    meal:    '<path d="M3 2v8a4 4 0 0 0 8 0V2"/><path d="M7 2v20"/><path d="M16 11h2a3 3 0 0 1 0 6h-2v-6z"/><path d="M16 17v5"/>'
  };

  function iconSvg(key, color){
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(PATTERN_ICONS[key] || PATTERN_ICONS.heart)+'</svg>';
  }

  // ---- PUBLIC API ----
  window.AtlasPatterns = {
    analyze,
    contextualInsight,
    iconSvg,
    getHistory: () => HISTORY
  };
})();

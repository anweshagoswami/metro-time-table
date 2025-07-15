// server/routes/timetable.js

const express = require('express');
const router = express.Router();
const { parseTime, formatTime } = require('../utils/timeUtils');

// Constants
const SINGLE_TRACK_SEC = 3 * 60;
const FIRST_TRAIN_EXTRA = 3 * 60;
const BOARDING_SEC = 60;
const DEBOARDING_SEC = 60;
let tieFlip = false;

// Interstation segment times (sec)
const interstationTiming = {
  up:   [3,2,2,2,3,3,2,2,2,2,2,2,1,2,1,2,2,2,2,2,3,5,4,6,4].map(m => m * 60),
  down: [6,1,5,3,2,2,2,2,2,2,1,2,1,2,2,2,2,2,3,4,3,2,2,2,7].map(m => m * 60)
};

function journeyRunTime(dir) {
  return interstationTiming[dir].reduce((a, b) => a + b, 0);
}

function computeJourneyTime(dir, isFirst) {
  return journeyRunTime(dir) + (isFirst ? FIRST_TRAIN_EXTRA : 0);
}

function makeDepartures(intervals, limit, startMs, endMs) {
  const deps = new Set();
  intervals.forEach(({ from, to, frequency }) => {
    let t = parseTime(from).getTime();
    const end = parseTime(to).getTime();
    const step = frequency * 60000;
    while (t <= end && t >= startMs && t <= endMs && deps.size < limit) {
      deps.add(t);
      t += step;
    }
  });
  return Array.from(deps).sort((a, b) => a - b).slice(0, limit);
}

function scheduleDirection(dir, deps, winStart, winEnd, opts, shared, trips, totalLimit) {
  const { totalRakes, shadeToLine, shadeCapacityKS, shadeCapacityNP, rakeReversal } = opts;
  const isUp = dir === 'up';
  const offset = isUp ? journeyRunTime('up') - SINGLE_TRACK_SEC : 0;

  const rakes = [];
  const shedKS = [], shedNP = [];
  for (let i = 1; i <= totalRakes; i++) {
    const loc = i <= shadeCapacityKS ? 'KS' : 'NP';
    const r = { id: `R-${String(i).padStart(3, '0')}`, freeAt: 0, location: loc };
    rakes.push(r);
    (loc === 'KS' ? shedKS : shedNP).push(r);
  }

  let first = true;
  let lastUp = null, lastDn = null;
  const usedDeps = new Set();

  for (const ideal of deps) {
    if (trips.length >= totalLimit) break;
    const target = isUp ? 'KS' : 'NP';
    const shadePool = target === 'KS' ? shedKS : shedNP;

    let chosen = null;
    let depTime = null;
    let buffer = null;

    // Try shade pull
    for (let i = 0; i < shadePool.length; i++) {
      const r = shadePool[i];
      const readyTime = r.freeAt + shadeToLine * 60000 + BOARDING_SEC * 1000;
      if (readyTime <= ideal) {
        chosen = r;
        buffer = shadeToLine * 60000 + BOARDING_SEC * 1000;
        shadePool.splice(i, 1);
        break;
      }
    }

    // Try reversal pull
    if (!chosen) {
      const reversals = rakes.filter(r => r.location !== target);
      for (const r of reversals) {
        const readyTime = r.freeAt + (DEBOARDING_SEC + rakeReversal * 60 + BOARDING_SEC) * 1000;
        if (readyTime <= ideal) {
          chosen = r;
          buffer = (DEBOARDING_SEC + rakeReversal * 60 + BOARDING_SEC) * 1000;
          r.location = target;
          break;
        }
      }
    }

    // Fallback to any next available rake
    if (!chosen) {
      const all = rakes.filter(r => {
        const buf = r.location === target
          ? shadeToLine * 60000 + BOARDING_SEC * 1000
          : (DEBOARDING_SEC + rakeReversal * 60 + BOARDING_SEC) * 1000;
        return r.freeAt + buf <= winEnd;
      }).sort((a, b) => a.freeAt - b.freeAt);

      for (const r of all) {
        const buf = r.location === target
          ? shadeToLine * 60000 + BOARDING_SEC * 1000
          : (DEBOARDING_SEC + rakeReversal * 60 + BOARDING_SEC) * 1000;
        const earliest = r.freeAt + buf;
        if (earliest <= winEnd) {
          chosen = r;
          buffer = buf;
          r.location = target;
          break;
        }
      }
    }

    if (!chosen) continue;

    depTime = Math.max(ideal, chosen.freeAt + buffer);
    let runMs = computeJourneyTime(dir, first) * 1000;
    let enter = depTime + offset * 1000;
    let exit = enter + SINGLE_TRACK_SEC * 1000;

    for (const w of shared) {
      if (w.dir === dir) continue;
      const overlap = Math.min(exit, w.exit) - Math.max(enter, w.enter);
      if (overlap > 0) {
        const mins = Math.ceil(overlap / 60000);
        const myGap = (ideal - (isUp ? lastUp : lastDn)) / 60000;
        const opGap = (ideal - (isUp ? lastDn : lastUp)) / 60000;
        if (mins === 1) {
          if (isUp) runMs += 60000;
          else depTime += 60000;
        } else {
          if (myGap < opGap || (myGap === opGap && tieFlip)) {
            if (isUp) runMs += mins * 60000;
            else depTime += mins * 60000;
          }
          tieFlip = !tieFlip;
        }
        enter = depTime + offset * 1000;
        exit = enter + SINGLE_TRACK_SEC * 1000;
      }
    }

    if (depTime > winEnd || usedDeps.has(depTime)) continue;

    const arr = depTime + runMs;
    chosen.freeAt = arr + (DEBOARDING_SEC + rakeReversal * 60 + BOARDING_SEC) * 1000;
    shared.push({ dir, enter, exit });
    usedDeps.add(depTime);

    if (isUp) lastUp = ideal; else lastDn = ideal;
    const backPool = isUp ? shedNP : shedKS;
    const cap = isUp ? shadeCapacityNP : shadeCapacityKS;
    if (backPool.length < cap) backPool.push(chosen);

    trips.push({
      dir,
      depTime,
      journey_code: `${isUp ? 'UP' : 'DN'}-${String(trips.filter(t => t.dir === dir).length + 1).padStart(3, '0')}`,
      rake_id: chosen.id,
      source: isUp ? 'KKVS' : 'KDSW',
      start_time: formatTime(new Date(depTime)),
      destination: isUp ? 'KDSW' : 'KKVS',
      end_time: formatTime(new Date(arr))
    });

    first = false;
  }
}

router.post('/generate', (req, res) => {
  const {
    upStart, upEnd, downStart, downEnd,
    upIntervals, downIntervals,
    totalRakes, serviceCount,
    shadeToLine, shadeCapacityKS, shadeCapacityNP,
    rakeReversal
  } = req.body;

  if (
    !upStart || !upEnd || !downStart || !downEnd ||
    !Array.isArray(upIntervals) || !Array.isArray(downIntervals) ||
    [totalRakes, serviceCount, shadeToLine, shadeCapacityKS, shadeCapacityNP, rakeReversal].some(v => typeof v !== 'number' || isNaN(v))
  ) {
    return res.status(400).json({ error: 'Invalid inputs' });
  }

  const wUpS = parseTime(upStart).getTime();
  const wUpE = parseTime(upEnd).getTime();
  const wDnS = parseTime(downStart).getTime();
  const wDnE = parseTime(downEnd).getTime();
  const half = Math.ceil(serviceCount / 2);

  const upDeps = makeDepartures(upIntervals, half, wUpS, wUpE);
  const dnDeps = makeDepartures(downIntervals, half, wDnS, wDnE);
  const shared = [];
  const trips = [];

  if (upDeps[0] <= dnDeps[0]) {
    scheduleDirection('up', upDeps, wUpS, wUpE, { totalRakes, shadeToLine, shadeCapacityKS, shadeCapacityNP, rakeReversal }, shared, trips, serviceCount);
    scheduleDirection('down', dnDeps, wDnS, wDnE, { totalRakes, shadeToLine, shadeCapacityKS, shadeCapacityNP, rakeReversal }, shared, trips, serviceCount);
  } else {
    scheduleDirection('down', dnDeps, wDnS, wDnE, { totalRakes, shadeToLine, shadeCapacityKS, shadeCapacityNP, rakeReversal }, shared, trips, serviceCount);
    scheduleDirection('up', upDeps, wUpS, wUpE, { totalRakes, shadeToLine, shadeCapacityKS, shadeCapacityNP, rakeReversal }, shared, trips, serviceCount);
  }

  res.json({ up: trips.filter(t => t.dir === 'up'), down: trips.filter(t => t.dir === 'down') });
});

module.exports = router;

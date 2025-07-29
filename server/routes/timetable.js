const express = require('express');
const router  = express.Router();
const { diffSeconds, formatTime } = require('../utils/timeUtils');
const { MinPriorityQueue } = require('@datastructures-js/priority-queue');

// Constants
const SINGLETRACK_SEC     = 3 * 60;
const DEBOARD_SEC         = 1 * 60;
const BOARD_SEC           = 1 * 60;
const FIRST_UP_EXTRA_SEC  = 3 * 60;
const FIRST_DN_EXTRA_SEC  = 3 * 60;

// Hardcoded journey durations
const journeyUpSec = 64 * 60;
const journeyDnSec = 63 * 60;

// Globals
let globalReversalList = [];
let tieBreakerCounter  = 0;

function initRakes(total, capUp, capDown) {
  if (total < 1) throw new Error('Need at least 1 rake');
  if (capUp + capDown < total) throw new Error('Shade capacity insufficient');
  const pool = { up: [], down: [] };
  for (let i = 1; i <= total; i++) {
    const id = `R-${String(i).padStart(3, '0')}`;
    if (pool.up.length < capUp) pool.up.push({ id, freeAt: 0 });
    else pool.down.push({ id, freeAt: 0 });
  }
  return pool;
}

function selectRake(pool, dir, depSec, shadeToLineSec) {
  const shadeList = dir === 'up' ? pool.up : pool.down;
  let bestShade = null;
  shadeList.forEach(r => {
    const ready = r.freeAt + shadeToLineSec + BOARD_SEC;
    if (ready <= depSec && (!bestShade || ready < bestShade.ready)) {
      bestShade = { id: r.id, ready, ref: r, type: 'shade' };
    }
  });

  let bestRev = null;
  globalReversalList.forEach(r => {
    const ready = r.arrival + DEBOARD_SEC + r.reversalSec + BOARD_SEC;
    if (r.direction !== dir && ready <= depSec && (!bestRev || ready < bestRev.ready)) {
      bestRev = { id: r.id, ready, ref: r, type: 'rev' };
    }
  });

  let chosen = null;
  if (bestShade && bestRev) chosen = bestShade.ready <= bestRev.ready ? bestShade : bestRev;
  else if (bestShade) chosen = bestShade;
  else if (bestRev) chosen = bestRev;

  if (!chosen) throw new Error(`No rake available at ${formatTime(depSec)}`);
  if (chosen.type === 'shade') chosen.ref.freeAt = depSec;
  else globalReversalList = globalReversalList.filter(r => r.id !== chosen.id);

  return chosen.id;
}

function resolveCollision(dir, d, segFreq, windows, journeySec, isFirst) {
  const isUp = dir === 'up';
  const extra = isFirst ? (isUp ? FIRST_UP_EXTRA_SEC : FIRST_DN_EXTRA_SEC) : 0;
  let enter = d + (isUp ? journeySec - SINGLETRACK_SEC : 0);
  let exit  = enter + SINGLETRACK_SEC;
  let shifted;
  do {
    shifted = false;
    for (const w of windows) {
      if (w.dir !== dir && !(exit < w.enter || enter > w.exit)) {
        const overlap = Math.min(exit, w.exit) - Math.max(enter, w.enter);
        if (overlap <= 60) {
          enter += 60;
          exit  = enter + SINGLETRACK_SEC;
          shifted = true;
        } else {
          const thisGap = segFreq;
          const otherGap = w.headway;
          if (thisGap < otherGap || (thisGap === otherGap && (tieBreakerCounter++ % 2 === 0))) {
            d += overlap;
            enter = d + (isUp ? journeySec - SINGLETRACK_SEC : 0);
            exit  = enter + SINGLETRACK_SEC;
            shifted = true;
          }
        }
        if (shifted) break;
      }
    }
  } while (shifted);
  return { d, enter, exit };
}

router.post('/generate', async (req, res) => {
  try {
    globalReversalList = [];
    tieBreakerCounter = 0;

    const {
      upIntervals, downIntervals,
      totalRakes, totalServices,
      shadeToLine, reversalTime,
      shadeCapacityUp, shadeCapacityDown
    } = req.body;

    const config = {
      shadeToLineSec: shadeToLine * 60,
      reversalSec: reversalTime * 60
    };

    const pool = initRakes(totalRakes, shadeCapacityUp, shadeCapacityDown);

    const q = new MinPriorityQueue({ compare: (a, b) => a.time - b.time });

    const enqueueBlocks = (dir, intervals) => {
      intervals.forEach(block => {
        if (!block.from || !block.to || !block.frequency) return;
        let t = diffSeconds(block.from);
        const end = diffSeconds(block.to);
        while (t <= end) {
          q.enqueue({ dir, time: t, freq: block.frequency });
          t += block.frequency * 60;
        }
      });
    };

    enqueueBlocks('up', upIntervals);
    enqueueBlocks('down', downIntervals);

    const trips = [];
    const windows = [];
    let journeyCount = { up: 0, down: 0 };
    const usedDepartureTimes = new Set();

    while (trips.length < totalServices && !q.isEmpty()) {
      const ev = q.dequeue();
      if (!ev || typeof ev.time !== 'number') continue;

      const isUp = ev.dir === 'up';
      const baseJourneySec = isUp ? journeyUpSec : journeyDnSec;
      const isFirst = journeyCount[ev.dir] === 0;
      const journeySec = baseJourneySec + (isFirst ? (isUp ? FIRST_UP_EXTRA_SEC : FIRST_DN_EXTRA_SEC) : 0);
      let d = ev.time;

      while (usedDepartureTimes.has(`${ev.dir}-${formatTime(d)}`)) {
        d += 60;
      }
      usedDepartureTimes.add(`${ev.dir}-${formatTime(d)}`);

      const { d: d2, enter, exit } = resolveCollision(ev.dir, d, ev.freq, windows, baseJourneySec, isFirst);
      d = d2;

      const rakeId = selectRake(pool, ev.dir, d, config.shadeToLineSec);
      const arr = d + journeySec;

      journeyCount[ev.dir]++;
      const jc = `${isUp ? 'UP' : 'DN'}-${String(journeyCount[ev.dir]).padStart(3, '0')}`;

      trips.push({
        journey_code: jc,
        rake_id: rakeId,
        source: isUp ? 'KKVS' : 'KDSW',
        dep_time: formatTime(d),
        destination: isUp ? 'KDSW' : 'KKVS',
        arr_time: formatTime(arr)
      });

      windows.push({ dir: ev.dir, enter, exit, headway: ev.freq });

      globalReversalList.push({
        id: rakeId,
        arrival: arr,
        reversalSec: config.reversalSec,
        direction: ev.dir
      });

      const nextDir = isUp ? 'down' : 'up';
      const ready = arr + DEBOARD_SEC + config.reversalSec + BOARD_SEC;
      if (trips.length < totalServices) {
        q.enqueue({ dir: nextDir, time: ready, freq: ev.freq });
      }
    }

    if (trips.length < totalServices) {
      return res.status(400).json({
        error: `Only ${trips.length} services possible; reduce totalServices or adjust intervals.`
      });
    }

    return res.json({
      up: trips.filter(t => t.journey_code.startsWith('UP')),
      down: trips.filter(t => t.journey_code.startsWith('DN'))
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const { parseTime, formatTime } = require('../utils/timeUtils');

/*
 * Hard‑coded inter‑station timings (in seconds, includes halt):
 * Up direction: KKVS -> KDSW
 * Down direction: KDSW -> KKVS
 */
const interstationTiming = {
  up: [
    3*60,2*60,2*60,2*60,3*60,3*60,2*60,2*60,2*60,2*60,2*60,2*60,1*60,2*60,1*60,2*60,2*60,2*60,2*60,2*60,3*60,5*60,4*60,6*60,5*60
  ],
  down: [
    6*60,1*60,6*60,3*60,2*60,2*60,2*60,2*60,2*60,2*60,1*60,2*60,1*60,2*60,2*60,2*60,2*60,2*60,3*60,4*60,3*60,2*60,2*60,2*60,4*60
  ]
};

/**
 * Compute total journey time in seconds for given direction.
 */
function computeJourneyTime(direction) {
  const arr = interstationTiming[direction];
  if (!arr) throw new Error(`Unknown direction '${direction}'`);
  return arr.reduce((sum, d) => sum + d, 0);
}


function generateDirectionTrips(direction, startTime, endTime, intervals) {
  const tripSec = computeJourneyTime(direction);
  const source = direction === 'up' ? 'KKVS' : 'KDSW';
  const dest   = direction === 'up' ? 'KDSW' : 'KKVS';

  let trips = [];
  let idx = 1;

  intervals.forEach(seg => {
    try {
      let current = parseTime(seg.from);
      const limit = parseTime(seg.to);
      const freq = parseInt(seg.frequency); // ✅ Corrected field name

      if (isNaN(freq) || freq <= 0) {
        throw new Error(`Invalid frequency value in segment: ${JSON.stringify(seg)}`);
      }

      while (current <= limit) {
        const arrival = new Date(current.getTime() + tripSec * 1000);
        trips.push({
  journey_code: `${direction === 'up' ? 'UP' : 'DN'}-${String(idx).padStart(3, '0')}`,
  rake_id: `R-${String(idx).padStart(3, '0')}`,
  source,
  start_time: formatTime(current),
  destination: dest,
  end_time: formatTime(arrival)
});

        current = new Date(current.getTime() + freq * 60000);
        idx++;
      }
    } catch (err) {
      throw new Error(`Time parsing error in segment ${JSON.stringify(seg)}: ${err.message}`);
    }
  });

  return trips;
}


router.post('/generate', (req, res) => {
  const { upStart, upEnd, upIntervals, downStart, downEnd, downIntervals } = req.body;
  if (!upStart || !upEnd || !upIntervals || !downStart || !downEnd || !downIntervals) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log("Payload received:", JSON.stringify(req.body, null, 2)); // Debug log
    const upTrips = generateDirectionTrips('up', upStart, upEnd, upIntervals);
    const dnTrips = generateDirectionTrips('down', downStart, downEnd, downIntervals);
    return res.json({ up: upTrips, down: dnTrips });
  } catch (e) {
    console.error("Error generating timetable:", e); // Debug error
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

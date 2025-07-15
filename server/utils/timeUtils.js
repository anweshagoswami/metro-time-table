// server/utils/timeUtils.js
function parseTime(hhmm) {
  const [h,m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTime(date) {
  const hh = String(date.getHours()).padStart(2,'0');
  const mm = String(date.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}

module.exports = { parseTime, formatTime };

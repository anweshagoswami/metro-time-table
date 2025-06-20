
function parseTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  now.setHours(h, m, 0, 0); // set HH:MM:00.000
  return now;
}


function formatTime(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = { parseTime, formatTime };

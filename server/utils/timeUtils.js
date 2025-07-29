
/*function parseTime(hhmm) {
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

module.exports = { parseTime, formatTime };*/
function diffSeconds(hhmm,ref='00:00'){const [h1,m1]=hhmm.split(':').map(Number),[h0,m0]=ref.split(':').map(Number);return(h1*3600+m1*60)-(h0*3600+m0*60);}  
function formatTime(sec){const h=Math.floor(sec/3600).toString().padStart(2,'0'),m=Math.floor(sec%3600/60).toString().padStart(2,'0');return`${h}:${m}`;}  
function parseTime(hhmm){const [h,m]=hhmm.split(':').map(Number);return h*3600+m*60;}  
module.exports={parseTime,formatTime,diffSeconds};
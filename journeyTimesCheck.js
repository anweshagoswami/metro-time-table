// journeyTimesCheck.js

const interstationTiming = {
  up: [
    3*60,2*60,2*60,2*60,3*60,3*60,2*60,2*60,2*60,2*60,
    2*60,2*60,1*60,2*60,1*60,2*60,2*60,2*60,2*60,2*60,
    3*60,5*60,4*60,6*60,5*60
  ],
  down: [
    6*60,1*60,6*60,3*60,2*60,2*60,2*60,2*60,2*60,2*60,
    1*60,2*60,1*60,2*60,2*60,2*60,2*60,2*60,3*60,4*60,
    3*60,2*60,2*60,2*60,4*60
  ]
};

function formatMMSS(sec) {
  const m = Math.floor(sec/60), s = sec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

Object.entries(interstationTiming).forEach(([dir, arr])=>{
  const sum = arr.reduce((a,b)=>a+b, 0);
  console.log(`${dir.toUpperCase()} journey = ${sum} sec  →  ${formatMMSS(sum)}`);
});

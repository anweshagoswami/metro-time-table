// client/src/components/TimeTableForm.jsx
import React, { useState } from 'react';
import { generateTimetable } from '../utils/api';

export default function TimeTableForm({ onGenerate }) {
  // 1) Operating window
  const [upStart, setUpStart] = useState('06:00');
  const [upEnd,   setUpEnd]   = useState('22:00');
  const [dnStart, setDnStart] = useState('06:00');
  const [dnEnd,   setDnEnd]   = useState('22:00');

  // 2) Frequency intervals
  const [intervalsUp, setIntervalsUp] = useState([{ from: '06:00', to: '10:00', freq: '10' }]);
  const [intervalsDn, setIntervalsDn] = useState([{ from: '06:00', to: '10:00', freq: '10' }]);

  // 3) Constraints
  const [totalRakes,   setTotalRakes]   = useState(20);
  const [serviceCount, setServiceCount] = useState(50);
  const [shadeToLine,  setShadeToLine]  = useState(5);
  const [shadeCapKS,   setShadeCapKS]   = useState(30);
  const [shadeCapNP,   setShadeCapNP]   = useState(30);
  const [rakeReversal, setRakeReversal] = useState(3);

  const updateInterval = (dir, idx, field, value) => {
    const arr = dir==='up'?[...intervalsUp]:[...intervalsDn];
    arr[idx][field] = value;
    dir==='up'?setIntervalsUp(arr):setIntervalsDn(arr);
  };

  const addInterval = dir => {
    const blank = { from:'',to:'',freq:'' };
    dir==='up'?setIntervalsUp([...intervalsUp,blank]):setIntervalsDn([...intervalsDn,blank]);
  };

  const validateIntervals = (ints, start, end) =>
    ints.every(({ from,to,freq }) =>
      from && to && freq && from<to && from>=start && to<=end
    );

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateIntervals(intervalsUp, upStart, upEnd)) {
      return alert('Check UP intervals vs operating window');
    }
    if (!validateIntervals(intervalsDn, dnStart, dnEnd)) {
      return alert('Check DN intervals vs operating window');
    }

    const payload = {
      upStart, upEnd,
      downStart: dnStart, downEnd: dnEnd,
      upIntervals:   intervalsUp.map(({ from,to,freq }) => ({ from,to,frequency:Number(freq) })),
      downIntervals: intervalsDn.map(({ from,to,freq }) => ({ from,to,frequency:Number(freq) })),
      totalRakes,
      serviceCount,
      shadeToLine,
      shadeCapacityKS: shadeCapKS,
      shadeCapacityNP: shadeCapNP,
      rakeReversal
    };

    try {
      const data = await generateTimetable(payload);
      const combined = [
        ...(Array.isArray(data.up)?data.up:[]),
        ...(Array.isArray(data.down)?data.down:[])
      ];
      onGenerate(combined);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Operating Window */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>UP Start Time</label>
          <input type="time" value={upStart} onChange={e=>setUpStart(e.target.value)} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label>UP End Time</label>
          <input type="time" value={upEnd}   onChange={e=>setUpEnd(e.target.value)}   className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label>DN Start Time</label>
          <input type="time" value={dnStart} onChange={e=>setDnStart(e.target.value)} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label>DN End Time</label>
          <input type="time" value={dnEnd}   onChange={e=>setDnEnd(e.target.value)}   className="p-2 border rounded w-full"/>
        </div>
      </div>

      {/* UP Intervals */}
      <div>
        <h3>UP Intervals</h3>
        {intervalsUp.map((int,i)=>(
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input type="time" value={int.from} onChange={e=>updateInterval('up',i,'from',e.target.value)} className="p-2 border rounded"/>
            <input type="time" value={int.to}   onChange={e=>updateInterval('up',i,'to',e.target.value)}   className="p-2 border rounded"/>
            <input type="number" value={int.freq} onChange={e=>updateInterval('up',i,'freq',e.target.value)} placeholder="Freq" className="p-2 border rounded"/>
          </div>
        ))}
        <button type="button" onClick={()=>addInterval('up')} className="text-blue-500">Add Interval</button>
      </div>

      {/* DN Intervals */}
      <div>
        <h3>DN Intervals</h3>
        {intervalsDn.map((int,i)=>(
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input type="time" value={int.from} onChange={e=>updateInterval('dn',i,'from',e.target.value)} className="p-2 border rounded"/>
            <input type="time" value={int.to}   onChange={e=>updateInterval('dn',i,'to',e.target.value)}   className="p-2 border rounded"/>
            <input type="number" value={int.freq} onChange={e=>updateInterval('dn',i,'freq',e.target.value)} placeholder="Freq" className="p-2 border rounded"/>
          </div>
        ))}
        <button type="button" onClick={()=>addInterval('dn')} className="text-blue-500">Add Interval</button>
      </div>

      {/* Constraints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label>Total Rakes Available</label>
          <input type="number" min="1" value={totalRakes} onChange={e=>setTotalRakes(Number(e.target.value))} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label>Number of Services</label>
          <input type="number" min="1" value={serviceCount} onChange={e=>setServiceCount(Number(e.target.value))} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label>Shade‑to‑Line Time (min)</label>
          <input type="number" min="0" value={shadeToLine} onChange={e=>setShadeToLine(Number(e.target.value))} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label>Shade Capacity (KS)</label>
          <input type="number" min="1" value={shadeCapKS} onChange={e=>setShadeCapKS(Number(e.target.value))} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label>Shade Capacity (NP)</label>
          <input type="number" min="1" value={shadeCapNP} onChange={e=>setShadeCapNP(Number(e.target.value))} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label>Rake Reversal Time (min)</label>
          <input type="number" min="0" value={rakeReversal} onChange={e=>setRakeReversal(Number(e.target.value))} className="p-2 border rounded w-full"/>
        </div>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Generate Time Table
      </button>
    </form>
  );
}

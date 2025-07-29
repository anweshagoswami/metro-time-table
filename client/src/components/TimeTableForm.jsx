import React, { useState } from 'react';
import { generateTimetable } from '../utils/api';

export default function TimeTableForm({ onGenerate }) {
  const [upStart, setUpStart] = useState('06:00');
  const [upEnd, setUpEnd] = useState('22:00');
  const [dnStart, setDnStart] = useState('06:00');
  const [dnEnd, setDnEnd] = useState('22:00');

  const [intervalsUp, setIntervalsUp] = useState([{ from: '', to: '', freq: '' }]);
  const [intervalsDn, setIntervalsDn] = useState([{ from: '', to: '', freq: '' }]);

  const [totalRakes, setTotalRakes] = useState(4);
  const [shadeToLine, setShadeToLine] = useState(5);
  const [rakeReversal, setRakeReversal] = useState(5);
  const [shadeCapacityNP, setShadeCapacityNP] = useState(2);
  const [shadeCapacityKS, setShadeCapacityKS] = useState(2);
  const [singleTrackBuffer, setSingleTrackBuffer] = useState(3);
  const [totalServices, setTotalServices] = useState(20);

  const updateInterval = (dir, idx, field, value) => {
    const arr = dir === 'up' ? [...intervalsUp] : [...intervalsDn];
    arr[idx][field] = value;
    dir === 'up' ? setIntervalsUp(arr) : setIntervalsDn(arr);
  };

  const addInterval = dir => {
    const arr = { from: '', to: '', freq: '' };
    dir === 'up' ? setIntervalsUp([...intervalsUp, arr]) : setIntervalsDn([...intervalsDn, arr]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const upBlocks = intervalsUp.map(({ from, to, freq }) => ({
      from, to, frequency: Number(freq)
    }));
    const dnBlocks = intervalsDn.map(({ from, to, freq }) => ({
      from, to, frequency: Number(freq)
    }));

    const payload = {
      upStart,
      upEnd,
      downStart: dnStart,
      downEnd: dnEnd,
      upIntervals: upBlocks,
      downIntervals: dnBlocks,
      totalRakes,
      shadeToLine,
      reversalTime: rakeReversal,
      shadeCapacityUp: shadeCapacityKS,
      shadeCapacityDown: shadeCapacityNP,
      singleTrackBuffer,
      totalServices,
    };

    try {
      const data = await generateTimetable(payload);
      onGenerate([...(data.up || []), ...(data.down || [])]);
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Time Ranges */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>UP Start Time</label>
          <input type="time" value={upStart} onChange={e => setUpStart(e.target.value)} className="w-full" />
        </div>
        <div>
          <label>UP End Time</label>
          <input type="time" value={upEnd} onChange={e => setUpEnd(e.target.value)} className="w-full" />
        </div>
        <div>
          <label>DN Start Time</label>
          <input type="time" value={dnStart} onChange={e => setDnStart(e.target.value)} className="w-full" />
        </div>
        <div>
          <label>DN End Time</label>
          <input type="time" value={dnEnd} onChange={e => setDnEnd(e.target.value)} className="w-full" />
        </div>
      </div>

      {/* UP Intervals */}
      <div>
        <h2 className="font-semibold text-lg">UP Intervals</h2>
        {intervalsUp.map((block, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input type="time" value={block.from} onChange={e => updateInterval('up', idx, 'from', e.target.value)} className="flex-1" />
            <input type="time" value={block.to} onChange={e => updateInterval('up', idx, 'to', e.target.value)} className="flex-1" />
            <input type="number" value={block.freq} onChange={e => updateInterval('up', idx, 'freq', e.target.value)} placeholder="Freq" className="w-20" />
          </div>
        ))}
        <button type="button" onClick={() => addInterval('up')} className="text-blue-600">+ Add Interval</button>
      </div>

      {/* DN Intervals */}
      <div>
        <h2 className="font-semibold text-lg">DN Intervals</h2>
        {intervalsDn.map((block, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input type="time" value={block.from} onChange={e => updateInterval('down', idx, 'from', e.target.value)} className="flex-1" />
            <input type="time" value={block.to} onChange={e => updateInterval('down', idx, 'to', e.target.value)} className="flex-1" />
            <input type="number" value={block.freq} onChange={e => updateInterval('down', idx, 'freq', e.target.value)} placeholder="Freq" className="w-20" />
          </div>
        ))}
        <button type="button" onClick={() => addInterval('down')} className="text-blue-600">+ Add Interval</button>
      </div>

      {/* Rake + Yard Config */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label>Total Rakes Available</label>
          <input type="number" value={totalRakes} onChange={e => setTotalRakes(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label>Shade Capacity (Noapara)</label>
          <input type="number" value={shadeCapacityNP} onChange={e => setShadeCapacityNP(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label>Shade Capacity (Kavi Subhash)</label>
          <input type="number" value={shadeCapacityKS} onChange={e => setShadeCapacityKS(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label>Shade → Line Time (min)</label>
          <input type="number" value={shadeToLine} onChange={e => setShadeToLine(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label>Rake Reversal Time (min)</label>
          <input type="number" value={rakeReversal} onChange={e => setRakeReversal(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label>Single Track Buffer (min)</label>
          <input type="number" value={singleTrackBuffer} onChange={e => setSingleTrackBuffer(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label>Total Services Needed</label>
          <input type="number" value={totalServices} onChange={e => setTotalServices(+e.target.value)} className="w-full" />
        </div>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Generate Time Table</button>
    </form>
  );
}

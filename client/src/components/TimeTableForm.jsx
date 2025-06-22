
import React, { useState } from 'react';
import { generateTimetable } from '../utils/api';

export default function TimeTableForm({ onGenerate }) {
  const [upStart, setUpStart] = useState('06:00');
  const [upEnd, setUpEnd] = useState('22:00');
  const [dnStart, setDnStart] = useState('06:00');
  const [dnEnd, setDnEnd] = useState('22:00');
  const [intervalsUp, setIntervalsUp] = useState([{ from: '06:00', to: '10:00', freq: '10' }]);
  const [intervalsDn, setIntervalsDn] = useState([{ from: '06:00', to: '10:00', freq: '10' }]);

  const updateInterval = (dir, idx, field, value) => {
    const arr = dir === 'up' ? [...intervalsUp] : [...intervalsDn];
    arr[idx][field] = value;
    dir === 'up' ? setIntervalsUp(arr) : setIntervalsDn(arr);
  };

  const addInterval = dir => {
    if (dir === 'up') setIntervalsUp([...intervalsUp, { from: '', to: '', freq: '' }]);
    else setIntervalsDn([...intervalsDn, { from: '', to: '', freq: '' }]);
  };

  const validateIntervals = (intervals, start, end) => {
    return intervals.every(({ from, to, freq }) => {
      if (!from || !to || !freq) return false;
      if (from < start || to > end) return false;
      if (from >= to) return false;
      return true;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateIntervals(intervalsUp, upStart, upEnd)) {
      alert('UP intervals must be within UP Start and End times, and From < To');
      return;
    }
    if (!validateIntervals(intervalsDn, dnStart, dnEnd)) {
      alert('DN intervals must be within DN Start and End times, and From < To');
      return;
    }

    const upIntervals = intervalsUp.map(({ from, to, freq }) => ({ from, to, frequency: Number(freq) }));
    const downIntervals = intervalsDn.map(({ from, to, freq }) => ({ from, to, frequency: Number(freq) }));

    try {
      const data = await generateTimetable({
        upStart,
        upEnd,
        downStart: dnStart,
        downEnd: dnEnd,
        upIntervals,
        downIntervals
      });
      const combined = [
        ...(Array.isArray(data.up) ? data.up : []),
        ...(Array.isArray(data.down) ? data.down : [])
      ];
      onGenerate(combined);
    } catch (err) {
      alert('Error generating timetable: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold">UP Start Time</label>
          <input type="time" value={upStart} onChange={e => setUpStart(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block font-semibold">UP End Time</label>
          <input type="time" value={upEnd} onChange={e => setUpEnd(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block font-semibold">DN Start Time</label>
          <input type="time" value={dnStart} onChange={e => setDnStart(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block font-semibold">DN End Time</label>
          <input type="time" value={dnEnd} onChange={e => setDnEnd(e.target.value)} className="w-full p-2 border rounded" />
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-2">UP Intervals</h3>
        {intervalsUp.map((int, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
            <input type="time" value={int.from} onChange={e => updateInterval('up', idx, 'from', e.target.value)} className="p-2 border rounded" />
            <input type="time" value={int.to} onChange={e => updateInterval('up', idx, 'to', e.target.value)} className="p-2 border rounded" />
            <input type="number" value={int.freq} onChange={e => updateInterval('up', idx, 'freq', e.target.value)} className="p-2 border rounded" placeholder="Freq (min)" />
          </div>
        ))}
        <button type="button" onClick={() => addInterval('up')} className="mt-1 text-blue-500 underline">Add Interval</button>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-2">DN Intervals</h3>
        {intervalsDn.map((int, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
            <input type="time" value={int.from} onChange={e => updateInterval('dn', idx, 'from', e.target.value)} className="p-2 border rounded" />
            <input type="time" value={int.to} onChange={e => updateInterval('dn', idx, 'to', e.target.value)} className="p-2 border rounded" />
            <input type="number" value={int.freq} onChange={e => updateInterval('dn', idx, 'freq', e.target.value)} className="p-2 border rounded" placeholder="Freq (min)" />
          </div>
        ))}
        <button type="button" onClick={() => addInterval('dn')} className="mt-1 text-blue-500 underline">Add Interval</button>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Generate Time Table</button>
    </form>
  );
}

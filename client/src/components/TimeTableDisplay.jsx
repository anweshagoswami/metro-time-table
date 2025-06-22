
import React from 'react';

export default function TimeTableDisplay({ trips }) {
  if (!Array.isArray(trips) || trips.length === 0) {
    return <p className="mt-8 text-center text-gray-500">No timetable data available.</p>;
  }

  return (
    <table className="w-full mt-8 table-auto border-collapse">
      <thead>
        <tr>
          <th className="border px-2 py-1">Journey Code</th>
          <th className="border px-2 py-1">Rake ID</th>
          <th className="border px-2 py-1">Source</th>
          <th className="border px-2 py-1">Dep Time</th>
          <th className="border px-2 py-1">Destination</th>
          <th className="border px-2 py-1">Arr Time</th>
        </tr>
      </thead>
      <tbody>
        {trips.map((t, idx) => (
          <tr key={idx}>
            <td className="border px-2 py-1">{t.journey_code}</td>
            <td className="border px-2 py-1">{t.rake_id}</td>
            <td className="border px-2 py-1">{t.source}</td>
            <td className="border px-2 py-1">{t.start_time}</td>
            <td className="border px-2 py-1">{t.destination}</td>
            <td className="border px-2 py-1">{t.end_time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
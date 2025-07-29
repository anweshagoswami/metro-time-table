import React from 'react';

export default function TimeTableDisplay({ trips }) {
  // Make sure we handle the case when trips is an object with up and down arrays
  const allTrips = Array.isArray(trips)
    ? trips
    : [...(trips?.up || []), ...(trips?.down || [])];

  if (!allTrips.length) {
    return <p className="mt-8 text-center text-gray-500">No timetable data available.</p>;
  }

  // Optional: Sort by journey_code
  const sortedTrips = allTrips.sort((a, b) => {
    const aNum = parseInt(a.journey_code?.split('-')[1] || 0, 10);
    const bNum = parseInt(b.journey_code?.split('-')[1] || 0, 10);
    return aNum - bNum;
  });

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
        {sortedTrips.map((t, idx) => (
          <tr key={idx}>
            <td className="border px-2 py-1">{t.journey_code}</td>
            <td className="border px-2 py-1">{t.rake_id}</td>
            <td className="border px-2 py-1">{t.source}</td>
            <td className="border px-2 py-1">{t.dep_time}</td>
            <td className="border px-2 py-1">{t.destination}</td>
            <td className="border px-2 py-1">{t.arr_time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


import React, { useState } from 'react';
import TimeTableForm from './components/TimeTableForm';
import TimeTableDisplay from './components/TimeTableDisplay';
import './App.css';

function App() {

  const [trips, setTrips] = useState([]);

  return (
    <div className="w-full bg-gray-50 py-4 sm:py-6">
      <div className="mx-4 sm:mx-10 md:mx-20 lg:mx-28 xl:mx-32 2xl:mx-44 mb-6 sm:mb-8 rounded-3xl overflow-hidden shadow-lg">
        <img
          src="/assets/metro-header.jpg"
          alt="Metro"
          className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 object-cover"
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg sm:max-w-2xl lg:max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 text-center">
            Time Table Generator
          </h1>
          <TimeTableForm onGenerate={setTrips} />
          <TimeTableDisplay trips={trips} />
        </div>
      </div>
    </div>
  );
}

export default App;
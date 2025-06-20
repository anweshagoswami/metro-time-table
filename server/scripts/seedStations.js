
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const Station = require('../models/Station');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const stations = [];
  fs.createReadStream(path.join(__dirname, '../data/stations.csv'))
    .pipe(csv())
    .on('data', row => {
      stations.push({
        stn_id: Number(row.STN_ID),
        stn_code: row.STN_CODE,
        next_station_id: Number(row.NEXT_STATION_ID),
        up_time_interval: Number(row.UP_TIME_INTERVAL),
        dn_time_interval: Number(row.DN_TIME_INTERVAL),
        halt_time: Number(row.HALT_TIME),
        distance: Number(row.DISTANCE)
      });
    })
    .on('end', async () => {
      await Station.deleteMany({});
      await Station.insertMany(stations);
      console.log('Station data seeded');
      mongoose.disconnect();
    });
}
seed().catch(console.error);


const { Schema, model } = require('mongoose');

const stationSchema = new Schema({
  stn_id: {
    type: Number,
    required: true,
    unique: true,
  },
  stn_code: {
    type: String,
    required: true,
    unique: true,
  },
  next_station_id: {
    type: Number,
    default: null,
  },
  up_time_interval: {
    type: Number,
    default: null, // optional if unused
  },
  dn_time_interval: {
    type: Number,
    default: null, // optional if unused
  },
  halt_time: {
    type: Number,
    required: true, // used in journey time calculation
  },
  distance: {
    type: Number,
    required: true, // used in journey time calculation
  }
});

module.exports = model('Station', stationSchema);

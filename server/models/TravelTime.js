const { Schema, model } = require('mongoose');

const travelTimeSchema = new Schema({
  journey_code: String,
  rake_id: String,
  source: String,
  start_time: String,
  destination: String,
  end_time: String
});

module.exports = model('TravelTime', travelTimeSchema);
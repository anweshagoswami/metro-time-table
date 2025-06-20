
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const timetableRouter = require('./routes/timetable');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(console.error);

app.use('/api/timetable', timetableRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
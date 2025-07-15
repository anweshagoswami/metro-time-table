import axios from 'axios';

export function generateTimetable(payload) {
  return axios
    .post('/api/timetable/generate', payload)
    .then(res => res.data)
    .catch(err => {
      console.error(err);
      throw err;
    });
}

import axios from 'axios';
export const generateTimetable = payload => axios.post('/api/timetable/generate', payload).then(res => res.data);

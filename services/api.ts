import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.43.178:4001/api', // your backend IP + port + /api
  timeout: 5000, // optional
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

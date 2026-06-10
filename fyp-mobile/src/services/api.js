import axios from 'axios';
const API_URL = 'http://10.0.102.163:5000/api';
const api = axios.create({
    baseURL: API_URL,

  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(
  (config) => {
    const token = global.userToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method, config.url);
    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', JSON.stringify(error));
    return Promise.reject(error);
  }
);
export default api;
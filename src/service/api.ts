import axios from 'axios';

console.log(process.env);
const API_URL = process.env.API_URL || 'http://localhost:3333';

const api = axios.create({
    baseURL: API_URL,
});

export default api;
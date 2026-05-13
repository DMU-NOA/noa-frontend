// src/api/client.js
import axios from 'axios';

// 백엔드 FastAPI 서버 주소
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
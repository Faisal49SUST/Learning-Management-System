import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 600000 // 10 minutes for large file uploads
});

// Add token to requests
api.interceptors.request.use(
    (config) => {            //request
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;   //modified request
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

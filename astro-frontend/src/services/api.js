import axios from "axios";

const API = axios.create({
  baseURL: "https://astro-app-upt9.onrender.com/api"
});

// Automatically attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
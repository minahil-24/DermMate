import axios from "axios";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`,
});

export default API;

// Login function
const handleLogin = async () => {
  try {
    const res = await API.post("/auth/login", { email, password });
    console.log(res.data); // check token & user
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};

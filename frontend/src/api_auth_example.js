// This is a sample file showing how to call the new Authentication Endpoints

const API_URL = 'http://localhost:5000/api/auth';

/**
 * Register a new user
 * Payload: { name, email, password, role, ... }
 */
export const registerUser = async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return response.json();
};

/**
 * Login User
 * Payload: { email, password }
 */
export const loginUser = async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    return response.json();
};

/**
 * Forgot Password - Request Reset Link
 * Payload: { email }
 */
export const forgotPassword = async (email) => {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return response.json();
};

/**
 * Reset Password
 * Payload: { password }
 * URL Param: token
 */
export const resetPassword = async (token, newPassword) => {
    const response = await fetch(`${API_URL}/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
    });
    return response.json();
};

/**
 * Verify Email
 * Payload: { token }
 */
export const verifyEmail = async (token) => {
    const response = await fetch(`${API_URL}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    return response.json();
};

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api/auth';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';
const NEW_PASSWORD = 'newpassword123';
//hgyfyf
async function runTest() {
    console.log('--- Starting Auth Flow Test ---');

    // Connect to DB to access tokens
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Register
    console.log(`\n1. Registering user: ${TEST_EMAIL}`);
    const regRes = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'patient'
        })
    });
    const regData = await regRes.json();
    console.log('Register Response:', regData);

    if (regRes.status !== 201) throw new Error('Registration failed');

    // 2. Login (Should fail - Unverified)
    console.log('\n2. Attempting Login (Unverified)...');
    const loginFailRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });
    console.log('Login Status:', loginFailRes.status);
    if (loginFailRes.status !== 401) throw new Error('Login should have failed');

    // 3. Verify Email
    console.log('\n3. Verifying Email...');
    const user = await User.findOne({ email: TEST_EMAIL });
    const verifyToken = user.verificationToken;
    console.log('Verification Token:', verifyToken);

    const verifyRes = await fetch(`${API_URL}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify Response:', verifyData);

    // 4. Login (Should success)
    console.log('\n4. Attempting Login (Verified)...');
    const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });
    const loginData = await loginRes.json();
    console.log('Login Result:', loginData.token ? 'Success' : 'Failed');
    if (!loginData.token) throw new Error('Login failed');

    // 5. Forgot Password
    console.log('\n5. Requesting Password Reset...');
    const forgotRes = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL })
    });
    console.log('Forgot Password Status:', forgotRes.status);

    // 6. Reset Password
    console.log('\n6. Resetting Password...');
    const userWithReset = await User.findOne({ email: TEST_EMAIL });
    const resetToken = userWithReset.resetPasswordToken;
    console.log('Reset Token:', resetToken);

    const resetRes = await fetch(`${API_URL}/reset-password/${resetToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: NEW_PASSWORD })
    });
    const resetData = await resetRes.json();
    console.log('Reset Response:', resetData);

    // 7. Login with New Password
    console.log('\n7. Login with New Password...');
    const newLoginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL, password: NEW_PASSWORD })
    });
    const newLoginData = await newLoginRes.json();
    console.log('New Login Result:', newLoginData.token ? 'Success' : 'Failed');

    if (!newLoginData.token) throw new Error('New password login failed');

    console.log('\n--- Test Completed Successfully ---');

    // Cleanup
    await User.deleteOne({ email: TEST_EMAIL });
    await mongoose.disconnect();
}

runTest().catch(console.error);

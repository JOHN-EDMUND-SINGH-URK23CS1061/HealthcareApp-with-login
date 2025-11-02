// client-app/src/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';

const SERVER_BASE_URL = "https://healthcare-app-with-login.vercel.app/"; // Use localhost for development

const Login = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({
        identifier: '', // Can be username or email
        password: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e, role) => {
        e.preventDefault();
        setMessage('');

        try {
            // Pass the role along with other form data
            const response = await axios.post(`${SERVER_BASE_URL}/api/login`, { ...formData, role });
            
            // If login is successful, call the prop function
            onLoginSuccess(response.data.user); 
        } catch (error) {
            const msg = error.response?.data?.status || 'Login failed.';
            setMessage(`Error: ${msg}`);
        }
    };

    return (
        <div className="card p-4 mx-auto" style={{ maxWidth: '450px' }}>
            <h2 className="text-center mb-4">User Login</h2>
            <form>
                <div className="mb-3">
                    <input
                        type="text"
                        name="identifier"
                        className="form-control"
                        placeholder="Username or Email"
                        value={formData.identifier}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                {/* We now have two buttons, each calling handleSubmit with a different role */}
                <div className="d-grid gap-2">
                    <button type="button" onClick={(e) => handleSubmit(e, 'hr')} className="btn btn-primary">HR Login</button>
                    <button type="button" onClick={(e) => handleSubmit(e, 'employee')} className="btn btn-success">Employee Login</button>
                </div>
            </form>

            {message && <div className="alert alert-danger mt-3">{message}</div>}
            <p className="text-center mt-3">
                Don't have an account? <span className="text-primary" style={{cursor: 'pointer'}} onClick={onSwitchToRegister}>Register here</span>
            </p>
        </div>
    );
};

export default Login;
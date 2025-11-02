// client-app/src/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';

const SERVER_BASE_URL = "https://healthcare-app-with-login.vercel.app"; // Use localhost for development

const Register = ({ role, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        full_name: '', email: '', username: '', password: '', confirmPassword: '', role: role
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            return setMessage('Error: Passwords do not match.');
        }
        
        // Basic password strength check (e.g., min length 6)
        if (formData.password.length < 6) {
            return setMessage('Error: Password must be at least 6 characters.');
        }

        try {
            const response = await axios.post(`${SERVER_BASE_URL}/api/register`, { ...formData, role: role });
            setMessage(`Success: ${response.data.status} You can now log in.`);
            setFormData({ full_name: '', email: '', username: '', password: '', confirmPassword: '', role: role }); // Clear form
            onSwitchToLogin(); // Redirect to login after success
        } catch (error) {
            const msg = error.response?.data?.status || 'Registration failed due to server error.';
            setMessage(`Error: ${msg}`);
        }
    };

    return (
        <div className="card p-4 mx-auto" style={{ maxWidth: '450px' }}>
            <h2 className="text-center mb-4">Register as {role === 'hr' ? 'HR' : 'Employee'}</h2>
            <form onSubmit={handleSubmit}>
                {['full_name', 'email', 'username', 'password', 'confirmPassword'].map(field => (
                    <div className="mb-3" key={field}>
                        <input
                            type={field.includes('password') ? 'password' : (field === 'email' ? 'email' : 'text')}
                            name={field}
                            className="form-control"
                            placeholder={field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            value={formData[field]}
                            onChange={handleChange}
                            required
                        />
                    </div>
                ))}
                <button type="submit" className="btn btn-primary w-100 mb-3">Register</button>
            </form>
            {message && <div className={`alert ${message.startsWith('Success') ? 'alert-success' : 'alert-danger'} mt-3`}>{message}</div>}
            <p className="text-center mt-3">
                Already have an account? <span className="text-primary" style={{cursor: 'pointer'}} onClick={onSwitchToLogin}>Login here</span>
            </p>
        </div>
    );
};

export default Register;
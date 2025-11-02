import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import Login from './Login';      // Import the Login component (Step 4)
import Register from './Register'; // Import the Register component (Step 3)
import MainApp from './MainApp';  // Import the CRUD component (Step 1)

function App() {
    // State to track if the user is logged in
    const [user, setUser] = useState(null); 
    // State to switch between Login and Register views
    const [currentView, setCurrentView] = useState('login'); 
    // State to hold the role for registration
    const [registerRole, setRegisterRole] = useState(null);

    // Function called by Login.jsx upon successful authentication
    const handleLoginSuccess = (userData) => {
        setUser(userData); // Set the user data to show the app is logged in
    };

    // Function called by MainApp.jsx to sign the user out
    const handleLogout = () => {
        setUser(null); // Clear the user data
        setRegisterRole(null); // Reset registration role
        setCurrentView('login'); // Go back to the login screen
    };

    // --- Conditional Rendering (The Gatekeeper Logic) ---

    if (user) {
        // CONDITION 1: If logged in (user is not null), show the main CRUD app
        return <MainApp user={user} onLogout={handleLogout} />;
    } 
    
    // CONDITION 2: If not logged in, show either the Login or Register screen
    return (
        <div className="container p-3 mt-5">
            <h1 className="text-center mb-5">Payroll Management</h1>
            
            {/* Renders Login, Register Choice, or Register Form based on the currentView state */}
            {currentView === 'login' ? (
                <Login 
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToRegister={() => setCurrentView('registerChoice')}
                />
            ) : currentView === 'registerChoice' ? (
                <div className="card p-4 mx-auto" style={{ maxWidth: '450px' }}>
                    <h2 className="text-center mb-4">Choose Registration Type</h2>
                    <div className="d-grid gap-3">
                        <button className="btn btn-primary" onClick={() => { setRegisterRole('hr'); setCurrentView('register'); }}>
                            Register as HR
                        </button>
                        <button className="btn btn-success" onClick={() => { setRegisterRole('employee'); setCurrentView('register'); }}>
                            Register as Employee
                        </button>
                    </div>
                    <p className="text-center mt-4">
                        Already have an account? <span className="text-primary" style={{cursor: 'pointer'}} onClick={() => setCurrentView('login')}>Login here</span>
                    </p>
                </div>
            ) : currentView === 'register' ? (
                <Register
                    role={registerRole}
                    onSwitchToLogin={() => {
                        setCurrentView('login');
                        setRegisterRole(null); // Reset role
                    }}
                />
            ) : null}
        </div>
    );
}

export default App;
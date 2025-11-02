import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";
import { useEffect, useState } from "react";

const SERVER_BASE_URL = "https://healthcare-app-with-login.vercel.app"; // Use localhost for development

// Accept user data and logout function as props
function MainApp({ user, onLogout }) { 
    
    // State for employees
    const [employees, setEmployees] = useState([]);
    // State for user messages (success/error)
    const [message, setMessage] = useState(null);
    
    // States for form inputs (Employee fields)
    const [employeeName, setEmployeeName] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [department, setDepartment] = useState("");
    const [position, setPosition] = useState("");
    const [salary, setSalary] = useState("");
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);

    // State for Salary Management
    const [managingSalaryFor, setManagingSalaryFor] = useState(null); // Employee object
    const [currentBasePay, setCurrentBasePay] = useState(0);
    const [currentAllowances, setCurrentAllowances] = useState([]);
    const [currentDeductions, setCurrentDeductions] = useState([]);
    const [salaryMessage, setSalaryMessage] = useState('');
    
    // State for Employee View
    const [myDetails, setMyDetails] = useState(null);
    const [myLeaves, setMyLeaves] = useState([]);
    const [leaveFormData, setLeaveFormData] = useState({
        leaveType: 'Casual',
        reason: '',
        startDate: '',
        endDate: ''
    });
    const [leaveMessage, setLeaveMessage] = useState('');

    // Load all data on component mount
    useEffect(() => {
        if (user.role === 'hr') {
            loadEmployees();
        } else {
            loadMyDetails();
            loadMyLeaves();
        }
    }, [user.role]);

    // Function to fetch all employees from the server
    const loadEmployees = () => {
        axios.get(`${SERVER_BASE_URL}/api/employees`) 
            .then((res) => setEmployees(res.data))
            .catch((err) => console.log(err));
    };

    const loadMyDetails = () => {
        axios.get(`${SERVER_BASE_URL}/api/me/details?username=${user.username}`)
            .then(res => setMyDetails(res.data));
    };

    const loadMyLeaves = () => {
        if (myDetails) {
            axios.get(`${SERVER_BASE_URL}/api/leaves/my-leaves?employeeId=${myDetails._id}`)
                .then(res => setMyLeaves(res.data));
        }
    };
    useEffect(loadMyLeaves, [myDetails]);

    // Function to add or update an employee
    const handleEmployeeSubmit = (event) => {
        event.preventDefault();
        const employeeData = { employeeName, employeeId, department, position, basePay: salary };

        if (editingEmployeeId) {
            // Update existing employee
            axios.post(`${SERVER_BASE_URL}/api/employees/update`, { id: editingEmployeeId, ...employeeData })
                .then((res) => {
                    setMessage(res.data.status);
                    loadEmployees();
                    cancelEmployeeEdit();
                });
        } else {
            // Add new employee
            axios.post(`${SERVER_BASE_URL}/api/employees/new`, employeeData)
                .then((res) => {
                    setMessage(res.data.status);
                    loadEmployees();
                    cancelEmployeeEdit();
                });
        }
    };

    // Function to delete an employee by its MongoDB ID
    const deleteEmployee = (id) => {
        axios.post(`${SERVER_BASE_URL}/api/employees/delete`, { id })
            .then((res) => {
                setMessage(res.data.status);
                loadEmployees(); // Refresh the table
            })
            .catch((err) => console.log(err));
    };

    const startEmployeeEdit = (employee) => {
        setEditingEmployeeId(employee._id);
        setEmployeeName(employee.employeeName);
        setEmployeeId(employee.employeeId);
        setDepartment(employee.department);
        setPosition(employee.position);
        setSalary(employee.basePay);
    };

    const cancelEmployeeEdit = () => {
        setEditingEmployeeId(null);
        setEmployeeName('');
        setEmployeeId('');
        setDepartment('');
        setPosition('');
        setSalary('');
    };

    // --- Salary Management Functions ---
    const openSalaryManager = (employee) => {
        setManagingSalaryFor(employee);
        setCurrentBasePay(employee.basePay || 0);
        setCurrentAllowances(employee.allowances || []);
        setCurrentDeductions(employee.deductions || []);
    };

    const handleSalaryUpdate = async () => {
        if (!managingSalaryFor) return;
        try {
            const response = await axios.post(`${SERVER_BASE_URL}/api/employees/update`, {
                id: managingSalaryFor._id,
                basePay: currentBasePay,
                allowances: currentAllowances,
                deductions: currentDeductions
            });
            setSalaryMessage(response.data.status);
            loadEmployees(); // Refresh employee data
            setTimeout(() => {
                setManagingSalaryFor(null);
                setSalaryMessage('');
            }, 2000);
        } catch (error) {
            setSalaryMessage('Error updating salary.');
        }
    };

    const addSalaryComponent = (type) => {
        const name = prompt(`Enter name for new ${type}:`);
        const amount = parseFloat(prompt(`Enter amount for ${name}:`));
        if (name && !isNaN(amount)) {
            if (type === 'allowance') {
                setCurrentAllowances([...currentAllowances, { name, amount }]);
            } else {
                setCurrentDeductions([...currentDeductions, { name, amount }]);
            }
        }
    };

    const handleLeaveFormChange = (e) => {
        setLeaveFormData({ ...leaveFormData, [e.target.name]: e.target.value });
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        setLeaveMessage('');
        try {
            // Ensure dates are in YYYY-MM-DD format
            const formattedStartDate = new Date(leaveFormData.startDate).toISOString().split('T')[0];
            const formattedEndDate = new Date(leaveFormData.endDate).toISOString().split('T')[0];

            const response = await axios.post(`${SERVER_BASE_URL}/api/leaves/apply`, {
                ...leaveFormData,
                employeeId: myDetails._id,
                startDate: formattedStartDate,
                endDate: formattedEndDate
            });
            setLeaveMessage(response.data.status);
            loadMyLeaves(); // Refresh leave list
            setLeaveFormData({ leaveType: 'Casual', reason: '', startDate: '', endDate: '' });
        } catch (error) {
            const msg = error.response?.data?.status || 'Failed to submit application.';
            setLeaveMessage(`Error: ${msg}`);
        }
    };

    return (
        <div className="container p-3 mt-4">
            <button className="btn btn-warning float-end" onClick={onLogout}>
                Logout ({user.username})
            </button>
            <div className="p-3 card bg-light text-center w-75 mx-auto">
                <h1 className="mb-4">Employee Management System</h1>
                
                {/* --- Employee Section (HR Only) --- */}
                {user.role === 'hr' && (
                    <>
                        <hr className="my-4"/>
                        <h3 className="mb-3">{editingEmployeeId ? 'Edit Employee' : 'Add New Employee'}</h3>
                        <div className="p-5">
                            <form onSubmit={handleEmployeeSubmit}>
                                <input
                                    type="text" id="employeeName" placeholder="Employee Name"
                                    value={employeeName} className="form-control mb-3" required
                                    onChange={(e) => setEmployeeName(e.target.value)}
                                />
                                <input
                                    type="text" id="employeeId" placeholder="Employee ID"
                                    value={employeeId} className="form-control mb-3" required
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                />
                                <input
                                    type="text" id="department" placeholder="Department"
                                    value={department} className="form-control mb-3" required
                                    onChange={(e) => setDepartment(e.target.value)}
                                />
                                <input
                                    type="text" id="position" placeholder="Position"
                                    value={position} className="form-control mb-3" required
                                    onChange={(e) => setPosition(e.target.value)}
                                />
                                <input
                                    type="number" id="salary" placeholder="Salary"
                                    value={salary} className="form-control mb-3" required
                                    onChange={(e) => setSalary(e.target.value)}
                                />
                                <button className="btn btn-primary btn-lg">{editingEmployeeId ? 'Update Employee' : 'Add Employee'}</button>
                                {editingEmployeeId && (
                                    <button type="button" className="btn btn-secondary btn-lg ms-2" onClick={cancelEmployeeEdit}>Cancel</button>
                                )}
                            </form>
                            <div className="text-success mt-4 fs-4">
                                {message && <span>{message}</span>}
                            </div>
                            <div className="mt-5">
                                <h3 className="mb-3">Employee List</h3>
                                <table className="table table-bordered table-stripped">
                                    <thead>
                                        <tr className="bg-light">
                                            <th>#</th>
                                            <th>Employee Name</th>
                                            <th>Employee ID</th>
                                            <th>Department</th>
                                            <th>Position</th>
                                            <th>Base Pay</th>
                                            <th>Net Salary</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!employees || employees.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" align="center">No Employees Found</td>
                                            </tr>
                                        ) : (
                                            employees.map((employee, index) => {
                                                const totalAllowances = (employee.allowances || []).reduce((sum, item) => sum + item.amount, 0);
                                                const totalDeductions = (employee.deductions || []).reduce((sum, item) => sum + item.amount, 0);
                                                const netSalary = (employee.basePay || 0) + totalAllowances - totalDeductions;
                                                return (
                                                    <tr key={employee._id}>
                                                        <td>{index + 1}</td>
                                                        <td>{employee.employeeName}</td>
                                                        <td>{employee.employeeId}</td>
                                                        <td>{employee.department}</td>
                                                        <td>{employee.position}</td>
                                                        <td>{employee.basePay || 0}</td>
                                                        <td>{netSalary}</td>
                                                        <td>
                                                            <button className="btn btn-sm btn-info me-2" onClick={() => startEmployeeEdit(employee)}>
                                                                Edit
                                                            </button>
                                                            <button className="btn btn-sm btn-primary me-2" onClick={() => openSalaryManager(employee)}>
                                                                Manage Salary
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => deleteEmployee(employee._id)}>
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- Salary Structure Section (HR Only) --- */}
                {user.role === 'hr' && (
                    managingSalaryFor && (
                        <>
                            <hr className="my-4"/>
                            <h3 className="mb-3">Define Salary Structure and Deductions</h3>
                            <div className="p-5">
                                {managingSalaryFor ? (
                                    <div>
                                        <h4>Managing Salary for: {managingSalaryFor.employeeName}</h4>
                                        {salaryMessage && <div className="alert alert-info">{salaryMessage}</div>}
                                        <div className="mb-3">
                                            <label className="form-label">Base Pay</label>
                                            <input type="number" className="form-control" value={currentBasePay} onChange={e => setCurrentBasePay(parseFloat(e.target.value) || 0)} />
                                        </div>
                                        
                                        <h5>Allowances</h5>
                                        {currentAllowances.map((item, index) => <div key={index}>{item.name}: {item.amount}</div>)}
                                        <button className="btn btn-sm btn-outline-success mb-3" onClick={() => addSalaryComponent('allowance')}>+ Add Allowance</button>

                                        <h5>Deductions</h5>
                                        {currentDeductions.map((item, index) => <div key={index}>{item.name}: {item.amount}</div>)}
                                        <button className="btn btn-sm btn-outline-danger mb-3" onClick={() => addSalaryComponent('deduction')}>+ Add Deduction</button>

                                        <div>
                                            <button className="btn btn-primary" onClick={handleSalaryUpdate}>Save Salary Structure</button>
                                            <button className="btn btn-secondary ms-2" onClick={() => setManagingSalaryFor(null)}>Back to List</button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    )
                )}

                {user.role === 'employee' && (
                    <div className="p-5 text-center">
                        <h2>Welcome, {myDetails?.employeeName || user.username}</h2>
                        <hr/>

                        {/* --- Dashboard Summary --- */}
                        <div className="row text-start mb-4">
                            <div className="col-md-4">
                                <h5>Attendance Summary</h5>
                                <p>Present: 18 / 22 Days (Example)</p>
                            </div>
                            <div className="col-md-4">
                                <h5>Leave Balance</h5>
                                {myDetails?.leaveBalances.map(lb => (
                                    <p key={lb.leaveType}>{lb.leaveType}: {lb.balance}</p>
                                ))}
                            </div>
                            <div className="col-md-4">
                                <h5>Next Payday</h5>
                                <p>November 30, 2025</p>
                            </div>
                        </div>

                        {/* --- Apply for Leave --- */}
                        <div className="card text-start mb-4">
                            <div className="card-header">Apply for Leave</div>
                            <div className="card-body">
                                <form onSubmit={handleLeaveSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Leave Type</label>
                                            <select name="leaveType" className="form-select" value={leaveFormData.leaveType} onChange={handleLeaveFormChange}>
                                                <option>Casual</option>
                                                <option>Sick</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <label className="form-label">Start Date</label>
                                            <input type="date" name="startDate" className="form-control" value={leaveFormData.startDate} onChange={handleLeaveFormChange} required />
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <label className="form-label">End Date</label>
                                            <input type="date" name="endDate" className="form-control" value={leaveFormData.endDate} onChange={handleLeaveFormChange} required />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Reason</label>
                                        <textarea name="reason" className="form-control" value={leaveFormData.reason} onChange={handleLeaveFormChange} required></textarea>
                                    </div>
                                    <button type="submit" className="btn btn-primary">Submit Application</button>
                                </form>
                                {leaveMessage && <div className={`alert ${leaveMessage.startsWith('Error') ? 'alert-danger' : 'alert-success'} mt-3`}>{leaveMessage}</div>}
                            </div>
                        </div>

                        {/* --- Leave Status --- */}
                        <div className="text-start">
                            <h5>My Leave Applications</h5>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Applied On</th>
                                        <th>Type</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myLeaves.length === 0 ? (
                                        <tr><td colSpan="4">No applications found.</td></tr>
                                    ) : (
                                        myLeaves.map(leave => (
                                            <tr key={leave._id}>
                                                <td>{new Date(leave.appliedOn).toLocaleDateString()}</td>
                                                <td>{leave.leaveType}</td>
                                                <td>
                                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                </td>
                                                <td>{leave.status}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                <hr className="my-4"/>
            </div>
        </div>
    );
}

export default MainApp;
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="dashboard">
      <div className="header">
        <h1>FIR Management System</h1>
        <p>Welcome, {user.name} ({user.district} District)</p>
        <div className="nav">
          <Link to="/file-fir" className="nav-btn">File New FIR</Link>
          <Link to="/analytics" className="nav-btn">View Analytics</Link>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      
      <div className="content">
        <h2>Quick Actions</h2>
        <p>Use the navigation above to manage FIRs and view analytics.</p>
        
        <div style={{ marginTop: '30px', padding: '20px', background: 'white', borderRadius: '10px' }}>
          <h3>System Features:</h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>File new FIR with AI-powered severity prediction</li>
            <li>View crime analytics and trends for your district</li>
            <li>Real-time severity classification using machine learning</li>
            <li>Secure police authentication system</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
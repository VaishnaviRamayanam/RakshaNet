import React, { useState } from 'react';
import axios from 'axios';

const FileFIR = ({ user, token }) => {
  const [formData, setFormData] = useState({
    complainantName: '',
    incidentDetails: '',
    location: ''
  });
  const [severity, setSeverity] = useState(null);
  const [confidence, setConfidence] = useState(null);

  const predictSeverity = async (details) => {
    try {
      const response = await axios.post('http://localhost:5000/predict-severity', {
        firDetails: details
      });
      setSeverity(response.data.severityClass);
      setConfidence(response.data.confidence);
    } catch (error) {
      console.error('Prediction error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/fir/file', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('FIR filed successfully!');
      setFormData({ complainantName: '', incidentDetails: '', location: '' });
      setSeverity(null);
    } catch (error) {
      alert('Error filing FIR');
    }
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h1>File New FIR</h1>
        <p>District: {user.district}</p>
      </div>

      <form className="fir-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Complainant Name:</label>
          <input
            type="text"
            value={formData.complainantName}
            onChange={(e) => setFormData({...formData, complainantName: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Incident Details:</label>
          <textarea
            value={formData.incidentDetails}
            onChange={(e) => {
              setFormData({...formData, incidentDetails: e.target.value});
              if (e.target.value.length > 10) {
                predictSeverity(e.target.value);
              }
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>Location:</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            required
          />
        </div>

        {severity && (
          <div className={`severity-display severity-${severity.toLowerCase()}`}>
            Predicted Severity: {severity} (Confidence: {(confidence * 100).toFixed(1)}%)
          </div>
        )}

        <button type="submit" className="btn">File FIR</button>
      </form>
    </div>
  );
};

export default FileFIR;
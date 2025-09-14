const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fir_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PoliceUserSchema = new mongoose.Schema({
  badgeId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  district: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'officer' }
});

const FIRSchema = new mongoose.Schema({
  complainantName: { type: String, required: true },
  incidentDetails: { type: String, required: true },
  location: {
    address: String,
    district: { type: String, required: true },
    coordinates: { lat: Number, lng: Number }
  },
  time: { type: Date, default: Date.now },
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceUser' },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
  status: { type: String, default: 'Filed' },
  aiConfidence: { type: Number }
});

const PoliceUser = mongoose.model('PoliceUser', PoliceUserSchema);
const FIR = mongoose.model('FIR', FIRSchema);

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { badgeId, name, district, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new PoliceUser({ badgeId, name, district, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id, district: user.district }, process.env.JWT_SECRET || 'your-secret-key');
    res.status(201).json({ token, user: { id: user._id, name: user.name, district: user.district } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { badgeId, password } = req.body;
    const user = await PoliceUser.findOne({ badgeId });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, district: user.district }, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ token, user: { id: user._id, name: user.name, district: user.district } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fir/file', authMiddleware, async (req, res) => {
  try {
    const { complainantName, incidentDetails, location } = req.body;
    
    const aiResponse = await axios.post('http://localhost:5000/predict-severity', {
      firDetails: incidentDetails
    });

    const fir = new FIR({
      complainantName,
      incidentDetails,
      location: { ...location, district: req.user.district },
      filedBy: req.user.userId,
      severity: aiResponse.data.severityClass,
      aiConfidence: aiResponse.data.confidence
    });

    await fir.save();
    res.status(201).json(fir);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fir', authMiddleware, async (req, res) => {
  try {
    const firs = await FIR.find({ 'location.district': req.user.district }).populate('filedBy', 'name badgeId');
    res.json(firs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/district', authMiddleware, async (req, res) => {
  try {
    const analytics = await FIR.aggregate([
      { $match: { 'location.district': req.user.district } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
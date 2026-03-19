require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Internal Modules
const db = require('./models/Database');
const ilcs = require('./logic/ilcs');
const fraud = require('./logic/fraud');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve simple UI

// For Prototype, skipping actual DB connection requirement unless MONGODB_URI is provided
// Connect to MongoDB
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.error(err));
} else {
    console.log("Running without DB for MVP demo. Data will be mapped in memory.");
}

// ----------------------------------------------------
// 1. MOCK DATA APIs (Weather, Demand, Payment)
// ----------------------------------------------------

// Mock Weather & Demand Source
const mockCityStats = {
    'Mumbai_South': { currentDemand: 45, baselineDemand: 100, weatherCondition: 'Rain' },
    'Delhi_NCR': { currentDemand: 80, baselineDemand: 90, weatherCondition: 'Clear' },
    'Bangalore_Koramangala': { currentDemand: 20, baselineDemand: 100, weatherCondition: 'Storm' }
};

app.get('/api/mock/zone/:zoneId', (req, res) => {
    const data = mockCityStats[req.params.zoneId] || { currentDemand: 50, baselineDemand: 50, weatherCondition: 'Clear' };
    res.json(data);
});

app.post('/api/mock/payment/payout', (req, res) => {
    return res.json({ success: true, transactionId: 'txn_' + Date.now(), status: "PROCESSED" });
});

// ----------------------------------------------------
// 2. CORE SYSTEM APIs
// ----------------------------------------------------

// In-Memory Storage since DB is optional for MVP execution
const users = {};
const logs = {};
const claimsHistory = {};

// User Registration & Risk Profiling
app.post('/api/register', (req, res) => {
    const { workerId, name, zoneId } = req.body;
    
    if(!workerId || !name || !zoneId) return res.status(400).json({error: "Missing fields"});

    // Risk Profiling Logic => assigns Weekly Premium
    // e.g. Bangalore_Koramangala is high risk (Storm, high drop), assigning ₹35 weekly.
    let riskLevel = 'Low';
    let premiumPlan = 15;

    if (zoneId === 'Bangalore_Koramangala') {
        riskLevel = 'High';
        premiumPlan = 35;
    } else if (zoneId === 'Mumbai_South') {
        riskLevel = 'Medium';
        premiumPlan = 25;
    }

    users[workerId] = { workerId, name, zoneId, riskLevel, premiumPlan, walletBalance: 0 };
    logs[workerId] = [];
    claimsHistory[workerId] = [];

    res.json({ message: "Registered Successfully", user: users[workerId] });
});

app.get('/api/user/:workerId', (req, res) => {
    res.json(users[req.params.workerId]);
});

// Worker Activity Validation (Log ingestion)
app.post('/api/log_activity', (req, res) => {
    const { workerId, lat, lng, isMocked, status } = req.body;
    if(!users[workerId]) return res.status(404).json({error: "Worker not found"});

    logs[workerId].push({
        lat, lng, isMocked, status, timestamp: new Date()
    });
    
    res.json({ success: true, loggedAt: new Date(), logCount: logs[workerId].length });
});

app.get('/api/logs/:workerId', (req, res) => {
    const workerId = req.params.workerId;
    if(!users[workerId]) return res.status(404).json({error: "Worker not found"});
    res.json(logs[workerId] || []);
});

// Calculate ILCS API
app.get('/api/calculate_ilcs/:workerId', (req, res) => {
    const workerId = req.params.workerId;
    const user = users[workerId];
    if(!user) return res.status(404).json({error: "Worker not found"});

    const zoneData = mockCityStats[user.zoneId];
    if (!zoneData) return res.status(400).json({error: "Zone data unavailable"});

    const workerLogs = logs[workerId];
    
    // Calculate Score
    const result = ilcs.computeILCS(zoneData.weatherCondition, zoneData.currentDemand, zoneData.baselineDemand, workerLogs);
    
    res.json({
        workerId,
        score: result.score,
        breakdown: result.breakdown
    });
});

// Claim Trigger API
app.post('/api/claim', async (req, res) => {
    const { workerId } = req.body;
    const user = users[workerId];
    if(!user) return res.status(404).json({error: "Worker not found"});

    const workerLogs = logs[workerId] || [];
    const pastClaims = claimsHistory[workerId] || [];

    // 1. FRAUD DETECTION
    const fraudResult = fraud.detectFraud(workerLogs, pastClaims);
    if (fraudResult.decision === 'REJECT') {
        return res.json({
            status: 'REJECTED',
            reason: fraudResult.flags,
            message: 'Claim flagged for fraudulent activity.'
        });
    }

    // 2. ILCS VERIFICATION
    const zoneData = mockCityStats[user.zoneId];
    if (!zoneData) return res.status(400).json({error: "Zone data unavailable"});

    const scoreResult = ilcs.computeILCS(zoneData.weatherCondition, zoneData.currentDemand, zoneData.baselineDemand, workerLogs);
    
    // ILCS Threshold
    if (scoreResult.score < 60) { // e.g., anything below 60/100 implies not a valid income loss due to env/demand
        return res.json({
            status: 'REJECTED',
            reason: ['LOW_ILCS_CONFIDENCE'],
            score: scoreResult.score,
            message: 'System did not detect significant income loss factors.'
        });
    }

    // 3. APPROVAL AND PAYOUT
    // Calculate Payout Amount based on Premium Plan
    // Rs 15 -> Payout ₹300, Rs 25 -> Payout ₹500, Rs 35 -> Payout ₹750
    let payoutAmount = 0;
    if (user.premiumPlan === 15) payoutAmount = 300;
    else if (user.premiumPlan === 25) payoutAmount = 500;
    else if (user.premiumPlan === 35) payoutAmount = 750;

    user.walletBalance += payoutAmount;

    // Log Claim Status
    const claim = {
        workerId, date: new Date(), ilcsScore: scoreResult.score, status: 'APPROVED', payoutAmount
    };
    claimsHistory[workerId].push(claim);

    // Call Mock Payment API simulation internal
    res.json({
        status: 'APPROVED',
        payoutAmount,
        walletBalance: user.walletBalance,
        ilcsScore: scoreResult.score,
        message: 'Claim automatically approved based on high parametric confidence.'
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`EarnGuard AI Backend running on http://localhost:${PORT}`);
});

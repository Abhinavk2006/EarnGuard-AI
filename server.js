require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Internal Modules
const db = require('./models/Database');
const ilcs = require('./logic/ilcs');
const fraud = require('./logic/fraud');
const premiumCalc = require('./logic/premium');
const automation = require('./logic/automation');
const claimAI = require('./logic/claimAI');
const txManager = require('./logic/transactions');

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
const policies = {}; // Phase 2: Active Policies Map
const globalTransactions = {}; // Phase 2: Finance System Ledgers

// Phase 2: Automation Trigger Interval (Mocking Cron)
// In production, this would be a CRON job. Here we expose a trigger endpoint for UI testing.
app.get('/api/trigger_automation', (req, res) => {
    const notifications = automation.runAutomationCycle(users, mockCityStats, policies);
    res.json({ success: true, count: notifications.length, notifications });
});

// Phase 2: User Registration & Dynamic Risk Profiling
app.post('/api/register', (req, res) => {
    const { workerId, name, phone, jobType, zoneId } = req.body;
    
    if(!workerId || !name || !phone || !jobType || !zoneId) return res.status(400).json({error: "Missing fields"});

    const zoneData = mockCityStats[zoneId] || { currentDemand: 50, baselineDemand: 50, weatherCondition: 'Clear' };
    
    // Dynamic Premium Calculation implementation
    const calculatedPremium = premiumCalc.calculateDynamicPremium(zoneId, jobType, zoneData);

    // Initial basic risk
    let riskLevel = 'Low';
    if (zoneId === 'Bangalore_Koramangala') riskLevel = 'High';
    else if (zoneId === 'Mumbai_South') riskLevel = 'Medium';

    // Save User (Wallet initialized with Mock ₹100 instead of 0)
    users[workerId] = { 
        workerId, name, phone, jobType, zoneId, riskLevel, walletBalance: 100, isEligibleForAutoClaim: false 
    };
    
    // Generate Policy
    const policyId = 'POL_' + Date.now();
    policies[workerId] = {
        policyId: policyId,
        workerId,
        coverageType: 'Comprehensive',
        weeklyPremium: calculatedPremium,
        status: 'Pending Payment', // Phase 3 UX: Requires manual payment activation
        lastUpdated: new Date()
    };

    logs[workerId] = [];
    claimsHistory[workerId] = [];
    globalTransactions[workerId] = [];

    res.json({ message: "Registered Successfully. Please pay premium to activate.", user: users[workerId], policy: policies[workerId] });
});

// Phase 3: Premium Payment & Wallet Deduction Handler
app.post('/api/pay_premium', (req, res) => {
    const { workerId } = req.body;
    const user = users[workerId];
    const policy = policies[workerId];

    if(!user || !policy) return res.status(404).json({error: "User or Policy not found."});
    
    if(policy.status === 'Active') return res.status(400).json({error: "Policy is already active."});

    if(user.walletBalance < policy.weeklyPremium) {
        return res.status(400).json({error: "Insufficient Balance", walletBalance: user.walletBalance, required: policy.weeklyPremium});
    }

    // Safely Deduct Premium
    user.walletBalance -= policy.weeklyPremium;
    policy.status = 'Active';

    // Log the transaction
    const newTx = {
        id: 'TX_' + Date.now(),
        workerId, type: 'Premium_Payment', amount: policy.weeklyPremium, status: 'Success', refId: policy.policyId, timestamp: new Date()
    };
    globalTransactions[workerId].push(newTx);

    res.json({ 
        message: "Payment Successful", 
        walletBalance: user.walletBalance,
        status: "Active",
        transactionId: newTx.id
    });
});

// Fetch user policy
app.get('/api/policy/:workerId', (req, res) => {
    if(!policies[req.params.workerId]) return res.status(404).json({error: "No active policy"});
    res.json(policies[req.params.workerId]);
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

// Claim Trigger API (Phase 2 Multi-Stage Flow)
app.post('/api/claim', async (req, res) => {
    const { workerId, reason } = req.body;
    const user = users[workerId];
    if(!user) return res.status(404).json({error: "Worker not found"});

    const workerLogs = logs[workerId] || [];
    const pastClaims = claimsHistory[workerId] || [];

    // Phase 2: Claim Flow Initialization -> Submitted
    const claim = {
        claimId: 'CLM_' + Date.now(),
        workerId, date: new Date(), ilcsScore: 0, status: 'Submitted', payoutAmount: 0, reason: reason || 'Parametric Auto-Claim'
    };

    // 1. FRAUD DETECTION
    const fraudResult = fraud.detectFraud(workerLogs, pastClaims);
    if (fraudResult.decision === 'REJECT') {
        claim.status = 'Rejected';
        claim.fraudFlags = fraudResult.flags;
        claimsHistory[workerId].push(claim);
        return res.json({ status: 'Rejected', reason: fraudResult.flags });
    }

    claim.status = 'Processing'; // Status transition
    
    // 2. ILCS VERIFICATION (STATIC HEURISTIC -> REAL AI LOGISTIC REGRESSION)
    const zoneData = mockCityStats[user.zoneId];
    const scoreResult = ilcs.computeILCS(zoneData.weatherCondition, zoneData.currentDemand, zoneData.baselineDemand, workerLogs);
    claim.ilcsScore = scoreResult.score; // Keep logging metric, discarding usage below
    
    // UI Trigger 3: ML Evaluation logic
    // Determine the demand drop percent using math payload
    const demandDrop = zoneData.currentDemand < zoneData.baselineDemand ? ((zoneData.baselineDemand - zoneData.currentDemand) / zoneData.baselineDemand) * 100 : 0;
    
    const mlDecision = claimAI.approveClaimAI(scoreResult.score, zoneData.weatherCondition, demandDrop, workerLogs.length);

    if (mlDecision.decision === 0 && !user.isEligibleForAutoClaim) {
        claim.status = 'Rejected';
        claimsHistory[workerId].push(claim);
        return res.json({ status: 'Rejected', reason: [`AI Logistic Classifier Rejection: ${mlDecision.reason}`], score: scoreResult.score });
    }

    // 3. APPROVAL AND PAYOUT (From Dynamic Premium)
    const activePolicy = policies[workerId];
    const payoutAmount = activePolicy ? activePolicy.weeklyPremium * 20 : 500; 

    user.walletBalance += payoutAmount;
    claim.status = 'Approved';
    claim.payoutAmount = payoutAmount;
    claimsHistory[workerId].push(claim);

    // TRANSACTION HOOK - Payout Success!
    const claimTx = {
        id: 'TX_' + Date.now(),
        workerId, type: 'Claim_Payout', amount: payoutAmount, status: 'Success', refId: claim.claimId, timestamp: new Date()
    };
    globalTransactions[workerId].push(claimTx);

    // GENERATE BILL RECEIPT FOR SUCCESSFUL CLAIM
    const payoutBill = txManager.generateBill(claimTx, user, activePolicy);

    // Reset auto eligibility token after successful claim
    user.isEligibleForAutoClaim = false;

    res.json({
        status: 'Approved',
        payoutAmount,
        walletBalance: user.walletBalance,
        ilcsScore: scoreResult.score,
        claimData: claim,
        transactionId: claimTx.id
    });
});

// FINANCIAL SERVICES API (Phase 3 PDFs)
app.get('/api/finances/statement/pdf/:workerId', (req, res) => {
    const workerId = req.params.workerId;
    const history = globalTransactions[workerId] || [];
    const user = users[workerId];
    
    if(!user) return res.status(404).send('Worker not found');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=EarnGuard_Statement_${workerId}.pdf`);
    
    txManager.generatePDFStatement(history, user, res);
});

// Generic Bill Download API utilizing PDFKit
app.get('/api/finances/bill/:workerId/:txId', (req, res) => {
    const { workerId, txId } = req.params;
    const history = globalTransactions[workerId] || [];
    const tx = history.find(t => t.id === txId);
    const user = users[workerId];
    const policy = policies[workerId];

    if(!tx || !user) return res.status(404).send('Transaction not found');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=EarnGuard_Bill_${txId}.pdf`);

    txManager.generatePDFBill(tx, user, policy, res);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`EarnGuard AI Backend running on http://localhost:${PORT}`);
});

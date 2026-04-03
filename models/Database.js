const mongoose = require('mongoose');

// Users Schema
const UserSchema = new mongoose.Schema({
    workerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    jobType: { type: String, enum: ['Food Delivery', 'Ride-Share', 'Courier'], required: true },
    zoneId: { type: String, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    walletBalance: { type: Number, default: 0 },
    isEligibleForAutoClaim: { type: Boolean, default: false } // Triggered by automation
});

// Policy Schema
const PolicySchema = new mongoose.Schema({
    policyId: { type: String, required: true, unique: true },
    workerId: { type: String, required: true },
    coverageType: { type: String, enum: ['Basic', 'Comprehensive', 'Severe-Weather Only'], default: 'Comprehensive' },
    weeklyPremium: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Expired', 'Processing'], default: 'Active' },
    lastUpdated: { type: Date, default: Date.now }
});

// Activity Log Schema (GPS + Order interaction)
const ActivityLogSchema = new mongoose.Schema({
    workerId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    status: { type: String, enum: ['IDLE', 'DELIVERING', 'WAITING_AT_REST'], default: 'IDLE' },
    isMocked: { type: Boolean, default: false } // Fraud flag
});

// Claims Schema
const ClaimSchema = new mongoose.Schema({
    claimId: { type: String, required: true, unique: true },
    workerId: { type: String, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    ilcsScore: { type: Number, required: true },
    fraudFlags: { type: Array, default: [] },
    status: { type: String, enum: ['Submitted', 'Processing', 'Approved', 'Rejected'], default: 'Submitted' },
    payoutAmount: { type: Number, default: 0 }
});

// Zone Demand Data (Mock representation of city areas)
const ZoneSchema = new mongoose.Schema({
    zoneId: { type: String, required: true, unique: true },
    currentDemand: { type: Number, required: true }, // 0 to 100
    baselineDemand: { type: Number, required: true },
    weatherCondition: { type: String, enum: ['Clear', 'Rain', 'Storm', 'Heatwave'], default: 'Clear' }
});

// Transactions Schema (Financial Ledger)
const TransactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    workerId: { type: String, required: true },
    type: { type: String, enum: ['Premium_Payment', 'Claim_Payout'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Success' },
    refId: { type: String }, // Links to PolicyID or ClaimID
    timestamp: { type: Date, default: Date.now }
});

module.exports = {
    User: mongoose.model('User', UserSchema),
    Policy: mongoose.model('Policy', PolicySchema),
    ActivityLog: mongoose.model('ActivityLog', ActivityLogSchema),
    Claim: mongoose.model('Claim', ClaimSchema),
    Transaction: mongoose.model('Transaction', TransactionSchema),
    Zone: mongoose.model('Zone', ZoneSchema)
};

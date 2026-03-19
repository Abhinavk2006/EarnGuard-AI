const mongoose = require('mongoose');

// Users Schema
const UserSchema = new mongoose.Schema({
    workerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    zoneId: { type: String, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    premiumPlan: { type: Number, enum: [15, 25, 35], default: 25 }, // ₹ per week
    walletBalance: { type: Number, default: 0 }
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
    workerId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    ilcsScore: { type: Number, required: true },
    fraudFlags: { type: Array, default: [] },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    payoutAmount: { type: Number, default: 0 }
});

// Zone Demand Data (Mock representation of city areas)
const ZoneSchema = new mongoose.Schema({
    zoneId: { type: String, required: true, unique: true },
    currentDemand: { type: Number, required: true }, // 0 to 100
    baselineDemand: { type: Number, required: true },
    weatherCondition: { type: String, enum: ['Clear', 'Rain', 'Storm', 'Heatwave'], default: 'Clear' }
});

module.exports = {
    User: mongoose.model('User', UserSchema),
    ActivityLog: mongoose.model('ActivityLog', ActivityLogSchema),
    Claim: mongoose.model('Claim', ClaimSchema),
    Zone: mongoose.model('Zone', ZoneSchema)
};

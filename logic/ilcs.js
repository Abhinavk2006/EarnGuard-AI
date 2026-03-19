// Income Loss Confidence Score (ILCS) Logic

/**
 * Calculates ILCS for a gig worker making a claim.
 * ILCS = (w1 * Environmental Risk) + (w2 * Demand Drop) + (w3 * Worker Activity Score)
 *
 * Scoring from 0 to 100
 * w1 = 0.3 (30%) - Weather + Pollution
 * w2 = 0.5 (50%) - Fewer orders than baseline in the zone
 * w3 = 0.2 (20%) - Was the worker active and in the right place?
 */

const WEIGHT_ENV = 0.3;
const WEIGHT_DEMAND = 0.5;
const WEIGHT_ACTIVITY = 0.2;

// Environmental Risk
function calculateEnvironmentalRisk(weatherCondition) {
    const riskMap = {
        'Clear': 0,
        'Heatwave': 50, // 50/100 severity
        'Rain': 70,
        'Storm': 100
    };
    return riskMap[weatherCondition] || 0;
}

// Demand Drop
function calculateDemandDrop(currentDemand, baselineDemand) {
    // If current is less than baseline, calculate % drop
    if (currentDemand >= baselineDemand) return 0; // No drop
    const dropPercent = ((baselineDemand - currentDemand) / baselineDemand) * 100;
    // Cap at 100
    return Math.min(dropPercent * 2, 100); // 50% drop is considered 100 "Demand Risk"
}

// Worker Activity
function calculateActivityScore(recentLogs) {
    if (!recentLogs || recentLogs.length === 0) return 0;
    
    // Simplistic Logic:
    // +10 per log if logged as DELIVERING or WAITING_AT_REST within zone in last 3 hours
    // Cap at 100 (10 logs)
    let score = 0;
    recentLogs.forEach(log => {
        if (!log.isMocked) {
            score += 10;
        }
    });
    return Math.min(score, 100);
}

function computeILCS(weather, currentDemand, baselineDemand, recentLogs) {
    const envRisk = calculateEnvironmentalRisk(weather);
    const delDrop = calculateDemandDrop(currentDemand, baselineDemand);
    const actScore = calculateActivityScore(recentLogs);

    const ilcs = (WEIGHT_ENV * envRisk) + (WEIGHT_DEMAND * delDrop) + (WEIGHT_ACTIVITY * actScore);

    return {
        score: ilcs,
        breakdown: {
            environment: envRisk,
            demandDrop: delDrop,
            activity: actScore
        }
    };
}

module.exports = { computeILCS };

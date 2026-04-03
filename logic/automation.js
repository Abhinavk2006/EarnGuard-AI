/**
 * AUTOMATION TARGETS (PHASE 2)
 * 
 * Includes 3 automated triggers simulating background scheduled tasks:
 * 1. Weather Alert Auto-Eligibility
 * 2. Premium Auto-adjustment based on area shifts
 * 3. Income Disruption AI Notifier
 */

function runAutomationCycle(users, mockCityStats, activePolicies) {
    const notifications = [];

    Object.values(users).forEach(user => {
        const envData = mockCityStats[user.zoneId];
        if (!envData) return;

        // TRIGGER 1: Weather API -> Detect Heavy Rain/Storm -> Trigger Claim Auto-Eligibility
        if (envData.weatherCondition === 'Storm' || envData.weatherCondition === 'Rain') {
            if (!user.isEligibleForAutoClaim) {
                user.isEligibleForAutoClaim = true; 
                notifications.push({
                    workerId: user.workerId,
                    type: 'SYSTEM_AUTOMATION',
                    message: `CRITICAL ALERT: Severe ${envData.weatherCondition} detected in ${user.zoneId}. Your profile has been auto-authorized for zero-touch claims.`
                });
            }
        }

        // TRIGGER 2: Location Risk Shift -> Adjust Premium dynamically (Mocking shift mapping)
        // If demand drops significantly, the area becomes riskier for guaranteed income
        const policy = activePolicies[user.workerId];
        if (policy) {
            const isHighRiskShift = envData.currentDemand < (envData.baselineDemand * 0.4); 
            if (isHighRiskShift && policy.weeklyPremium < 40) {
                // Adjust dynamically - bump premium by 5 due to volatility (if theoretically updated on Monday cycle)
                policy.weeklyPremium += 5;
                notifications.push({
                    workerId: user.workerId,
                    type: 'POLICY_UPDATE',
                    message: `Zone Risk Auto-Detection: Demand in ${user.zoneId} dropped >60%. Weekly premium dynamically adjusted to ₹${policy.weeklyPremium}`
                });
            }
        }

        // TRIGGER 3: Income Disruption Auto-Notifier 
        // If demand falls and they have an active session, auto-suggest claim
        if (user.isEligibleForAutoClaim && envData.currentDemand < 30) {
            notifications.push({
                workerId: user.workerId,
                type: 'AUTO_SUGGESTION',
                message: `INCOME DISRUPTION DETECTED. You are eligible to file a claim instantly for loss of wages today.`
            });
        }
    });

    return notifications;
}

module.exports = { runAutomationCycle };

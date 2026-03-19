// Fraud Detection Logic for EarnGuard AI

/**
 * Validates Worker Activity
 * - GPS movement within delivery zone
 * - Speeds between pings
 * - Repeated suspicious claims
 */

function detectFraud(recentLogs, claimHistory) {
    const flags = [];

    // 1. Check for realistic movement (Rough Distance/Time)
    // Assume lat/lng coordinates to meters
    // Haversine formula
    for (let i = 1; i < recentLogs.length; i++) {
        const p1 = recentLogs[i - 1];
        const p2 = recentLogs[i];

        const R = 6371e3; // metres
        const lat1 = p1.lat * Math.PI / 180; // φ, λ in radians
        const lat2 = p2.lat * Math.PI / 180;
        const deltaLat = (p2.lat - p1.lat) * Math.PI / 180;
        const deltaLng = (p2.lng - p1.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // in metres

        const timeDiff = Math.abs(new Date(p2.timestamp) - new Date(p1.timestamp)) / 1000; // in seconds

        if (timeDiff > 0) {
            const speed = (distance / timeDiff) * 3.6; // km/h
            if (speed > 120) {
                // Suspicious (unrealistic for local delivery)
                flags.push('UNREALISTIC_MOVEMENT_JUMPS_AEROPLANE_SPEED');
                break;
            }
        }
    }

    // 2. Spoofing mock location flag
    const hasMockedPings = recentLogs.some(log => log.isMocked);
    if (hasMockedPings) {
        flags.push('GPS_MOCK_LOCATION_SPOOFING');
    }

    // 3. Repeated suspicious claims
    const recentClaims = claimHistory.filter(c => Date.now() - new Date(c.date).getTime() < 30 * 24 * 60 * 60 * 1000);
    if (recentClaims.length >= 3) {
        flags.push('REPEATED_HIGH_FREQUENCY_CLAIMS_30_DAYS');
    }

    // Reject claim automatically if highly fraudulent
    const decision = flags.length > 0 ? "REJECT" : "APPROVE_PENDING_ILCS";

    return {
        decision,
        flags
    };
}

module.exports = { detectFraud };

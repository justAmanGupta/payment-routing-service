const GATEWAYS = {
    razorpay: {
        name: 'razorpay',
        weight: 50,
        healthThreshold: 0.90
    },
    payu: {
        name: 'payu',
        weight: 30,
        healthThreshold: 0.90
    },
    cashfree: {
        name: 'cashfree',
        weight: 20,
        healthThreshold: 0.90
    }
};

const HEALTH_CONFIG = {
    trackingWindowMs: 15 * 60 * 1000, // 15 minutes
    cooldownPeriodMs: 30 * 60 * 1000  // 30 minutes
};

module.exports = {
    GATEWAYS,
    HEALTH_CONFIG
};

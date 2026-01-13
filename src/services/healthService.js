const { GATEWAYS, HEALTH_CONFIG } = require('../config/gatewayConfig');
const logger = require('../utils/logger');

const gatewayHealth = {};

Object.keys(GATEWAYS).forEach(gatewayName => {
    gatewayHealth[gatewayName] = {
        events: [],
        isHealthy: true,
        unhealthyUntil: null
    };
});

function recordEvent(gatewayName, status) {
    if (!gatewayHealth[gatewayName]) {
        logger.error(`Unknown gateway: ${gatewayName}`);
        return;
    }

    const now = Date.now();
    const health = gatewayHealth[gatewayName];

    health.events.push({
        timestamp: now,
        status: status
    });

    const windowStart = now - HEALTH_CONFIG.trackingWindowMs;
    health.events = health.events.filter(event => event.timestamp >= windowStart);

    logger.info(`Recorded ${status} event for ${gatewayName}`, {
        totalEvents: health.events.length
    });

    checkGatewayHealth(gatewayName);
}

function checkGatewayHealth(gatewayName) {
    const health = gatewayHealth[gatewayName];
    const gateway = GATEWAYS[gatewayName];
    const now = Date.now();

    if (health.unhealthyUntil && now < health.unhealthyUntil) {
        health.isHealthy = false;
        logger.debug(`Gateway ${gatewayName} still in cooldown until ${new Date(health.unhealthyUntil).toISOString()}`);
        return;
    }

    if (health.unhealthyUntil && now >= health.unhealthyUntil) {
        health.unhealthyUntil = null;
        health.isHealthy = true;
        logger.info(`Gateway ${gatewayName} cooldown expired, marked as healthy`);
    }

    if (health.events.length === 0) {
        health.isHealthy = true;
        return;
    }

    const successCount = health.events.filter(e => e.status === 'success').length;
    const failureCount = health.events.filter(e => e.status === 'failure').length;
    const totalCount = successCount + failureCount;
    const successRate = totalCount > 0 ? successCount / totalCount : 1.0;

    logger.debug(`Gateway ${gatewayName} health check`, {
        successCount,
        failureCount,
        successRate: (successRate * 100).toFixed(2) + '%',
        threshold: (gateway.healthThreshold * 100) + '%'
    });

    if (successRate < gateway.healthThreshold) {
        if (health.isHealthy) {
            health.isHealthy = false;
            health.unhealthyUntil = now + HEALTH_CONFIG.cooldownPeriodMs;

            logger.warn(`Gateway ${gatewayName} marked UNHEALTHY`, {
                successRate: (successRate * 100).toFixed(2) + '%',
                threshold: (gateway.healthThreshold * 100) + '%',
                cooldownUntil: new Date(health.unhealthyUntil).toISOString()
            });
        }
    } else {
        if (!health.isHealthy && !health.unhealthyUntil) {
            health.isHealthy = true;
            logger.info(`Gateway ${gatewayName} recovered to HEALTHY status`);
        }
    }
}

function getHealthyGateways() {
    const now = Date.now();
    const healthy = [];

    Object.keys(gatewayHealth).forEach(gatewayName => {
        const health = gatewayHealth[gatewayName];

        if (health.unhealthyUntil && now >= health.unhealthyUntil) {
            health.unhealthyUntil = null;
            health.isHealthy = true;
            logger.info(`Gateway ${gatewayName} cooldown expired, marked as healthy`);
        }

        if (health.isHealthy) {
            healthy.push(gatewayName);
        }
    });

    return healthy;
}

function getGatewayStatus(gatewayName) {
    const health = gatewayHealth[gatewayName];
    if (!health) return null;

    const now = Date.now();
    const windowStart = now - HEALTH_CONFIG.trackingWindowMs;
    const recentEvents = health.events.filter(e => e.timestamp >= windowStart);

    const successCount = recentEvents.filter(e => e.status === 'success').length;
    const failureCount = recentEvents.filter(e => e.status === 'failure').length;
    const totalCount = successCount + failureCount;
    const successRate = totalCount > 0 ? successCount / totalCount : 1.0;

    return {
        gateway: gatewayName,
        isHealthy: health.isHealthy,
        successRate: successRate,
        successCount,
        failureCount,
        totalEvents: totalCount,
        unhealthyUntil: health.unhealthyUntil ? new Date(health.unhealthyUntil).toISOString() : null
    };
}

function getAllGatewayStatus() {
    return Object.keys(gatewayHealth).map(name => getGatewayStatus(name));
}

module.exports = {
    recordEvent,
    getHealthyGateways,
    getGatewayStatus,
    getAllGatewayStatus
};

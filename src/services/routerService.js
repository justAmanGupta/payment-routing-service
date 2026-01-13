const { GATEWAYS } = require('../config/gatewayConfig');
const healthService = require('./healthService');
const logger = require('../utils/logger');

function selectGateway() {
    const healthyGateways = healthService.getHealthyGateways();

    if (healthyGateways.length === 0) {
        logger.error('No healthy gateways available');
        const allGateways = Object.keys(GATEWAYS);
        if (allGateways.length > 0) {
            const fallback = allGateways[0];
            logger.warn(`Fallback to ${fallback} despite being unhealthy`);
            return fallback;
        }
        return null;
    }

    let totalWeight = 0;
    const weightedGateways = healthyGateways.map(name => {
        const weight = GATEWAYS[name].weight;
        totalWeight += weight;
        return { name, weight };
    });

    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;

    for (const gateway of weightedGateways) {
        cumulativeWeight += gateway.weight;
        if (random <= cumulativeWeight) {
            logger.info(`Gateway selected: ${gateway.name}`, {
                healthyCount: healthyGateways.length,
                totalGateways: Object.keys(GATEWAYS).length
            });
            return gateway.name;
        }
    }

    const selected = weightedGateways[0].name;
    logger.info(`Gateway selected (fallback): ${selected}`);
    return selected;
}

function getRoutingStats() {
    const healthyGateways = healthService.getHealthyGateways();
    const allGateways = Object.keys(GATEWAYS);

    return {
        totalGateways: allGateways.length,
        healthyGateways: healthyGateways.length,
        unhealthyGateways: allGateways.length - healthyGateways.length,
        healthyList: healthyGateways,
        unhealthyList: allGateways.filter(name => !healthyGateways.includes(name))
    };
}

module.exports = {
    selectGateway,
    getRoutingStats
};

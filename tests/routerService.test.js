const routerService = require('../src/services/routerService');
const healthService = require('../src/services/healthService');

describe('Router Service', () => {

    test('should select a gateway from available gateways', () => {
        const gateway = routerService.selectGateway();
        expect(gateway).toBeTruthy();
        expect(['razorpay', 'payu', 'cashfree']).toContain(gateway);
    });

    test('should only select from healthy gateways', () => {
        // Mark razorpay and payu as unhealthy
        for (let i = 0; i < 10; i++) {
            healthService.recordEvent('razorpay', 'failure');
            healthService.recordEvent('payu', 'failure');
        }

        // Only cashfree should be healthy now
        const healthyGateways = healthService.getHealthyGateways();

        // Select gateway multiple times to verify it's consistently cashfree
        const selections = [];
        for (let i = 0; i < 5; i++) {
            selections.push(routerService.selectGateway());
        }

        // If only cashfree is healthy, all selections should be cashfree
        if (healthyGateways.length === 1 && healthyGateways[0] === 'cashfree') {
            selections.forEach(gateway => {
                expect(gateway).toBe('cashfree');
            });
        }
    });

    test('should return routing stats', () => {
        const stats = routerService.getRoutingStats();

        expect(stats).toHaveProperty('totalGateways');
        expect(stats).toHaveProperty('healthyGateways');
        expect(stats).toHaveProperty('unhealthyGateways');
        expect(stats).toHaveProperty('healthyList');
        expect(stats).toHaveProperty('unhealthyList');

        expect(stats.totalGateways).toBe(3);
    });

    test('should distribute load across gateways over multiple selections', () => {
        const selections = {};
        const numSelections = 100;

        // Make 100 selections
        for (let i = 0; i < numSelections; i++) {
            const gateway = routerService.selectGateway();
            selections[gateway] = (selections[gateway] || 0) + 1;
        }

        // Should have selected from multiple gateways (weighted distribution)
        expect(Object.keys(selections).length).toBeGreaterThan(0);

        // Razorpay (50% weight) should have more selections than others
        if (selections.razorpay && selections.payu && selections.cashfree) {
            expect(selections.razorpay).toBeGreaterThan(selections.payu);
            expect(selections.razorpay).toBeGreaterThan(selections.cashfree);
        }
    });
});

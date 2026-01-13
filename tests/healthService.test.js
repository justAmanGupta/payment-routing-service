const healthService = require('../src/services/healthService');

describe('Health Service', () => {

    beforeEach(() => {
        // Reset health state before each test
        jest.resetModules();
    });

    test('should return all gateways as healthy initially', () => {
        const healthyGateways = healthService.getHealthyGateways();
        expect(healthyGateways).toHaveLength(3);
        expect(healthyGateways).toContain('razorpay');
        expect(healthyGateways).toContain('payu');
        expect(healthyGateways).toContain('cashfree');
    });

    test('should record success events', () => {
        healthService.recordEvent('razorpay', 'success');
        const status = healthService.getGatewayStatus('razorpay');

        expect(status.successCount).toBe(1);
        expect(status.failureCount).toBe(0);
        expect(status.isHealthy).toBe(true);
    });

    test('should record failure events', () => {
        healthService.recordEvent('payu', 'failure');
        const status = healthService.getGatewayStatus('payu');

        expect(status.successCount).toBe(0);
        expect(status.failureCount).toBe(1);
    });

    test('should mark gateway unhealthy when failure rate exceeds threshold', () => {
        // Record 10 failures and 1 success (9% success rate, below 90% threshold)
        for (let i = 0; i < 10; i++) {
            healthService.recordEvent('cashfree', 'failure');
        }
        healthService.recordEvent('cashfree', 'success');

        const status = healthService.getGatewayStatus('cashfree');
        expect(status.isHealthy).toBe(false);
        expect(status.successRate).toBeLessThan(0.90);

        const healthyGateways = healthService.getHealthyGateways();
        expect(healthyGateways).not.toContain('cashfree');
    });

    test('should keep gateway healthy when success rate is above threshold', () => {
        // Record 9 successes and 1 failure (90% success rate)
        for (let i = 0; i < 9; i++) {
            healthService.recordEvent('razorpay', 'success');
        }
        healthService.recordEvent('razorpay', 'failure');

        const status = healthService.getGatewayStatus('razorpay');
        expect(status.isHealthy).toBe(true);
        expect(status.successRate).toBeGreaterThanOrEqual(0.90);
    });

    test('should return status for all gateways', () => {
        const allStatus = healthService.getAllGatewayStatus();
        expect(allStatus).toHaveLength(3);
        expect(allStatus[0]).toHaveProperty('gateway');
        expect(allStatus[0]).toHaveProperty('isHealthy');
        expect(allStatus[0]).toHaveProperty('successRate');
    });
});

const request = require('supertest');
const app = require('../src/app');

describe('API Integration Tests', () => {

    describe('GET /health', () => {
        test('should return healthy status', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Server is running');
        });
    });

    describe('POST /transactions/initiate', () => {
        test('should initiate transaction successfully', async () => {
            const payload = {
                order_id: 'ORD123',
                amount: 499.0,
                payment_instrument: {
                    type: 'card',
                    card_number: '****',
                    expiry: 'MM/YY'
                }
            };

            const response = await request(app)
                .post('/transactions/initiate')
                .send(payload);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.transaction).toHaveProperty('id');
            expect(response.body.transaction.order_id).toBe('ORD123');
            expect(response.body.transaction.amount).toBe(499.0);
            expect(response.body.transaction.status).toBe('pending');
            expect(response.body.transaction.gateway).toBeTruthy();
            expect(response.body).toHaveProperty('gateway_response');
        });

        test('should fail with missing order_id', async () => {
            const payload = {
                amount: 499.0,
                payment_instrument: {
                    type: 'card'
                }
            };

            const response = await request(app)
                .post('/transactions/initiate')
                .send(payload);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('order_id is required and must be a string');
        });

        test('should fail with invalid amount', async () => {
            const payload = {
                order_id: 'ORD456',
                amount: -100,
                payment_instrument: {
                    type: 'card'
                }
            };

            const response = await request(app)
                .post('/transactions/initiate')
                .send(payload);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /transactions/callback', () => {
        test('should process success callback', async () => {
            // First create a transaction
            const initiatePayload = {
                order_id: 'ORD789',
                amount: 999.0,
                payment_instrument: {
                    type: 'upi'
                }
            };

            await request(app)
                .post('/transactions/initiate')
                .send(initiatePayload);

            // Then send callback
            const callbackPayload = {
                order_id: 'ORD789',
                status: 'success',
                gateway: 'razorpay'
            };

            const response = await request(app)
                .post('/transactions/callback')
                .send(callbackPayload);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.transaction.status).toBe('success');
            expect(response.body.transaction.order_id).toBe('ORD789');
        });

        test('should process failure callback with reason', async () => {
            // Create transaction
            const initiatePayload = {
                order_id: 'ORD999',
                amount: 199.0,
                payment_instrument: {
                    type: 'card'
                }
            };

            await request(app)
                .post('/transactions/initiate')
                .send(initiatePayload);

            // Send failure callback
            const callbackPayload = {
                order_id: 'ORD999',
                status: 'failure',
                gateway: 'payu',
                reason: 'Customer Cancelled'
            };

            const response = await request(app)
                .post('/transactions/callback')
                .send(callbackPayload);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.transaction.status).toBe('failure');
        });

        test('should fail with missing gateway', async () => {
            const callbackPayload = {
                order_id: 'ORD111',
                status: 'success'
            };

            const response = await request(app)
                .post('/transactions/callback')
                .send(callbackPayload);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should return 404 for non-existent transaction', async () => {
            const callbackPayload = {
                order_id: 'NONEXISTENT',
                status: 'success',
                gateway: 'cashfree'
            };

            const response = await request(app)
                .post('/transactions/callback')
                .send(callbackPayload);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Transaction not found');
        });
    });

    describe('GET /transactions/stats/summary', () => {
        test('should return statistics', async () => {
            const response = await request(app).get('/transactions/stats/summary');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.stats).toHaveProperty('transactions');
            expect(response.body.stats).toHaveProperty('routing');
            expect(response.body.stats).toHaveProperty('gateway_health');
        });
    });
});

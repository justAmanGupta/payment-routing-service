const express = require('express');
const router = express.Router();

const routerService = require('../services/routerService');
const healthService = require('../services/healthService');
const transactionService = require('../services/transactionService');
const gatewayService = require('../services/gatewayService');
const { validateInitiateRequest, validateCallbackRequest } = require('../middleware/validator');
const logger = require('../utils/logger');

router.post('/initiate', validateInitiateRequest, async (req, res) => {
    try {
        const { order_id, amount, payment_instrument } = req.body;

        logger.info('Transaction initiation request received', { order_id, amount });

        const selectedGateway = routerService.selectGateway();

        if (!selectedGateway) {
            logger.error('No gateway available for transaction', { order_id });
            return res.status(503).json({
                success: false,
                message: 'No payment gateway available at the moment'
            });
        }

        const transaction = transactionService.createTransaction({
            orderId: order_id,
            amount: amount,
            paymentInstrument: payment_instrument,
            gateway: selectedGateway
        });

        const gatewayResponse = gatewayService.initiatePayment(
            selectedGateway,
            order_id,
            amount,
            payment_instrument
        );

        logger.info('Transaction initiated successfully', {
            transactionId: transaction.id,
            orderId: order_id,
            gateway: selectedGateway
        });

        res.status(200).json({
            success: true,
            transaction: {
                id: transaction.id,
                order_id: transaction.orderId,
                amount: transaction.amount,
                status: transaction.status,
                gateway: transaction.gateway,
                created_at: transaction.createdAt
            },
            gateway_response: gatewayResponse.gatewayResponse
        });

    } catch (error) {
        logger.error('Error initiating transaction', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

router.post('/callback', validateCallbackRequest, async (req, res) => {
    try {
        logger.info('Payment callback received', req.body);

        const callbackData = gatewayService.parseCallback(req.body);

        const updatedTransaction = transactionService.updateTransactionStatus(
            callbackData.orderId,
            callbackData.status,
            callbackData.failureReason
        );

        if (!updatedTransaction) {
            logger.error('Transaction not found for callback', { orderId: callbackData.orderId });
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        healthService.recordEvent(callbackData.gateway, callbackData.status);

        logger.info('Callback processed successfully', {
            orderId: callbackData.orderId,
            gateway: callbackData.gateway,
            status: callbackData.status
        });

        res.status(200).json({
            success: true,
            message: 'Callback processed successfully',
            transaction: {
                id: updatedTransaction.id,
                order_id: updatedTransaction.orderId,
                status: updatedTransaction.status,
                gateway: updatedTransaction.gateway,
                updated_at: updatedTransaction.updatedAt
            }
        });

    } catch (error) {
        logger.error('Error processing callback', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

router.get('/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const transaction = transactionService.getTransactionByOrderId(orderId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.status(200).json({
            success: true,
            transaction: transaction
        });
    } catch (error) {
        logger.error('Error fetching transaction', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

router.get('/stats/summary', (req, res) => {
    try {
        const transactionStats = transactionService.getTransactionStats();
        const routingStats = routerService.getRoutingStats();
        const gatewayHealth = healthService.getAllGatewayStatus();

        res.status(200).json({
            success: true,
            stats: {
                transactions: transactionStats,
                routing: routingStats,
                gateway_health: gatewayHealth
            }
        });
    } catch (error) {
        logger.error('Error fetching stats', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router;

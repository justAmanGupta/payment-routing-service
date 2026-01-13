const logger = require('../utils/logger');

function validateInitiateRequest(req, res, next) {
    const { order_id, amount, payment_instrument } = req.body;

    const errors = [];

    if (!order_id || typeof order_id !== 'string') {
        errors.push('order_id is required and must be a string');
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        errors.push('amount is required and must be a positive number');
    }

    if (!payment_instrument || typeof payment_instrument !== 'object') {
        errors.push('payment_instrument is required and must be an object');
    } else {
        if (!payment_instrument.type) {
            errors.push('payment_instrument.type is required');
        }
    }

    if (errors.length > 0) {
        logger.warn('Validation failed for initiate request', { errors });
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }

    next();
}

function validateCallbackRequest(req, res, next) {
    const { order_id, status, gateway } = req.body;

    const errors = [];

    if (!order_id || typeof order_id !== 'string') {
        errors.push('order_id is required and must be a string');
    }

    if (!status || typeof status !== 'string') {
        errors.push('status is required and must be a string');
    }

    if (!gateway || typeof gateway !== 'string') {
        errors.push('gateway is required and must be a string');
    }

    if (errors.length > 0) {
        logger.warn('Validation failed for callback request', { errors });
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }

    next();
}

module.exports = {
    validateInitiateRequest,
    validateCallbackRequest
};

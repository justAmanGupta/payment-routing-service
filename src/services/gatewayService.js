const logger = require('../utils/logger');

const GATEWAY_MOCKS = {
    razorpay: {
        createOrder: (orderId, amount) => ({
            id: `rzp_${generateRandomId()}`,
            entity: 'order',
            amount: amount * 100, // let's say it returns amount in paise
            currency: 'INR',
            status: 'created',
            order_id: orderId,
            created_at: Date.now()
        })
    },

    payu: {
        createOrder: (orderId, amount) => ({
            txnid: `payu_${generateRandomId()}`,
            merchantTransactionId: orderId,
            amount: amount,
            productInfo: 'Payment',
            status: 'initiated',
            timestamp: new Date().toISOString()
        })
    },

    cashfree: {
        createOrder: (orderId, amount) => ({
            cf_order_id: `cf_${generateRandomId()}`,
            order_id: orderId,
            order_amount: amount,
            order_currency: 'INR',
            order_status: 'ACTIVE',
            created_at: new Date().toISOString()
        })
    }
};

function initiatePayment(gateway, orderId, amount, paymentInstrument) {
    if (!GATEWAY_MOCKS[gateway]) {
        logger.error(`Unknown gateway: ${gateway}`);
        throw new Error(`Gateway ${gateway} not supported`);
    }

    logger.info(`Initiating payment with ${gateway}`, {
        orderId,
        amount,
        paymentType: paymentInstrument.type
    });

    const mockResponse = GATEWAY_MOCKS[gateway].createOrder(orderId, amount);

    logger.info(`Payment initiated successfully with ${gateway}`, {
        gatewayOrderId: mockResponse.id || mockResponse.txnid || mockResponse.cf_order_id
    });

    return {
        success: true,
        gateway: gateway,
        gatewayResponse: mockResponse
    };
}

function parseCallback(callbackPayload) {
    const { gateway, order_id, status, reason } = callbackPayload;

    logger.info(`Parsing callback from ${gateway}`, {
        orderId: order_id,
        status: status
    });

    const normalizedStatus = normalizeStatus(status);

    return {
        gateway: gateway,
        orderId: order_id,
        status: normalizedStatus,
        failureReason: reason || null,
        rawPayload: callbackPayload
    };
}

function normalizeStatus(status) {
    const successStatuses = ['success', 'captured', 'completed', 'paid', 'SUCCESS', 'PAID'];
    const failureStatuses = ['failure', 'failed', 'cancelled', 'FAILURE', 'CANCELLED'];

    if (successStatuses.includes(status)) {
        return 'success';
    } else if (failureStatuses.includes(status)) {
        return 'failure';
    }

    logger.warn(`Unknown status: ${status}, defaulting to failure`);
    return 'failure';
}

function generateRandomId() {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
}

module.exports = {
    initiatePayment,
    parseCallback
};

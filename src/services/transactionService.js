const logger = require('../utils/logger');

const transactions = new Map();

function createTransaction(data) {
    const transaction = {
        id: generateTransactionId(),
        orderId: data.orderId,
        amount: data.amount,
        paymentInstrument: data.paymentInstrument,
        gateway: data.gateway,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    transactions.set(transaction.id, transaction);

    logger.info(`Transaction created: ${transaction.id}`, {
        orderId: transaction.orderId,
        gateway: transaction.gateway,
        amount: transaction.amount
    });

    return transaction;
}

function updateTransactionStatus(orderId, status, failureReason = null) {
    let transaction = null;
    for (const [id, txn] of transactions.entries()) {
        if (txn.orderId === orderId) {
            transaction = txn;
            break;
        }
    }

    if (!transaction) {
        logger.error(`Transaction not found for orderId: ${orderId}`);
        return null;
    }

    transaction.status = status;
    transaction.updatedAt = new Date().toISOString();

    if (failureReason) {
        transaction.failureReason = failureReason;
    }

    transactions.set(transaction.id, transaction);

    logger.info(`Transaction updated: ${transaction.id}`, {
        orderId: transaction.orderId,
        status: status,
        failureReason: failureReason
    });

    return transaction;
}

function getTransactionByOrderId(orderId) {
    for (const transaction of transactions.values()) {
        if (transaction.orderId === orderId) {
            return transaction;
        }
    }
    return null;
}

function getTransactionById(id) {
    return transactions.get(id) || null;
}

function getAllTransactions() {
    return Array.from(transactions.values());
}

function getTransactionStats() {
    const allTxns = Array.from(transactions.values());

    return {
        total: allTxns.length,
        pending: allTxns.filter(t => t.status === 'pending').length,
        success: allTxns.filter(t => t.status === 'success').length,
        failure: allTxns.filter(t => t.status === 'failure').length
    };
}

function generateTransactionId() {
    return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
    createTransaction,
    updateTransactionStatus,
    getTransactionByOrderId,
    getTransactionById,
    getAllTransactions,
    getTransactionStats
};

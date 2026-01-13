const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Payment Gateway Routing Service started`);
    logger.info(`Server listening on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Initiate transaction: POST http://localhost:${PORT}/transactions/initiate`);
    logger.info(`Callback endpoint: POST http://localhost:${PORT}/transactions/callback`);
});

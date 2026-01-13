const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
};

function formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;

    if (data) {
        logMessage += ` | Data: ${JSON.stringify(data)}`;
    }

    return logMessage;
}

const logger = {
    info: (message, data) => {
        console.log(formatMessage(LOG_LEVELS.INFO, message, data));
    },

    warn: (message, data) => {
        console.warn(formatMessage(LOG_LEVELS.WARN, message, data));
    },

    error: (message, data) => {
        console.error(formatMessage(LOG_LEVELS.ERROR, message, data));
    },

    debug: (message, data) => {
        console.log(formatMessage(LOG_LEVELS.DEBUG, message, data));
    }
};

module.exports = logger;

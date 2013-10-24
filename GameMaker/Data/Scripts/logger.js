GM.Logger = (function () {
    var loggers = {
        message: [console.log, alertify.log],
        success: [console.info, alertify.success],
        error: [console.error, alertify.error]
    };

    function logError(message) {
        for (var i in loggers.error) {
            loggers.error[i].call(console, message);
        }
    }

    function logSuccess(message) {
        for (var i in loggers.success) {
            loggers.success[i].call(console, message);
        }
    }

    function logMessage(message) {
        for (var i in loggers.message) {
            loggers.message[i].call(console, message);
        }
    }

    return {
        loggers: loggers,
        logError: logError,
        logSuccess: logSuccess,
        logMessage: logMessage
    }
    
}());
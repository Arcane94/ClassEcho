require('logger');

// DBLogger logs to a the logging/mysql.php page,
// which saves to a MySQL database. See more in
// logging/README.md
function DBLogger(interval) {
    Logger.call(this, interval);
}

DBLogger.prototype = Object.create(Logger.prototype);

DBLogger.prototype.storeMessages = function (logs) {
    var data = {
        'userInfo': this.userInfo(),
        'logs': logs,
    };
    // Approximate max length of a TEXT field in MySQL
    var maxCodeLength = 16000000;
    var maxMessageLength = 64;
    logs.forEach(function (log) {
        if (log.code && log.code.length > maxCodeLength) {
            Trace.logErrorMessageLater(
                'Attempted to log code with length ' + log.code.length +
                ' > ' + maxCodeLength + '. ' + 'Log was truncated.');
            log.code = log.code.substring(0, maxCodeLength);
        }
        if (log.message && log.message.length > maxMessageLength) {
            this.logErrorMessageLater('Log messages must be < 64 characters: ' +
                log.message);
            log.message = log.message.substring(0, maxMessageLength - 3) +
                '...';
        }
    }, this);
    this.sendToServer(JSON.stringify(data), 0);
};

DBLogger.prototype.sendToServer = function (data, attempts) {
    if (attempts >= 3) {
        // Trace.log('Log.failure'); // creates a loop, probably not good
        return; // max retries if the logging fails
    }

    var xhr = new XMLHttpRequest();
    var myself = this;
    var retry = false;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            try {
                let response = JSON.parse(xhr.responseText);

                if (xhr.status !== 200 || !response.success) {
                    console.error('Failed to log data:', xhr.responseText);
                    myself.logErrorMessageNow(`Failed to log data: ${xhr.responseText}`);

                    // Retry sending if the API call fails
                    if (!retry && xhr.status !== 200) {
                        retry = true;
                        setTimeout(() => {
                            myself.sendToServer(data, attempts + 1);
                        }, 1000);
                    }
                } else {
                    console.log("Logs stored successfully.");
                }
            } catch (e) {
                console.error("Invalid JSON response from logging API:", e);
            }
        }
    };
    xhr.open('POST', 'https://localhost:443/api/v1/logs/storeActionLogs', true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
};

DBLogger.prototype.logErrorMessageNow = function (message) {
    // Send logs before and after to ensure that this message goes by itself
    this.sendLogs();
    this.logErrorMessage(message);
    this.sendLogs();
};

DBLogger.prototype.logErrorMessageLater = function (message) {
    var myself = this;
    // Delay the message so we can finish processing the current logs
    window.setTimeout(function () {
        myself.logErrorMessageNow(message);
    });
};
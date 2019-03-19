const config = require("./config");
const tdfeed = require("./consumers/tdfeed");
const vstpfeed = require("./consumers/vstpfeed");
const mvtfeed = require("./consumers/mvtfeed");
const tsrfeed = require("./consumers/tsrfeed");
const stompit = require("stompit");

// Server
const servers = [config.nrod.connectOptions];

const reconnectOptions = {
    "useExponentialBackOff": true,
    "maxReconnects": 30,
    "randomize": false
};

// Create fail managed connection
const manager = new stompit.ConnectFailover(servers, reconnectOptions);

// Open connection
manager.connect(function(error, client, reconnect) {
    const dt = new Date();
    if (error) {
        console.error(dt.toISOString(), "STOMP: Failed to connect:", error.message);
        console.error("Terminal error. Exiting in 60 sec...")
        setTimeout(exitProgram, 60000);
    } else {
        console.error(dt.toISOString(), "STOMP: Connected");
    }

    // Reconnect on error
    client.on("error", function(error) {
        const dt = new Date();
        console.error(dt.toISOString(), "STOMP: Disconnected. Start reconnecting in 30 sec...");
        setTimeout(reconnect, 30000);
    });

    // Subscribe to the TD Feed
    client.subscribe({
            "destination": "/topic/TD_ALL_SIG_AREA",
            "activemq.subscriptionName": "railty_td_all_sig_area",
            "ack": "client-individual"
        },
        function(error, message) {
            if (error) {
                console.error("TD_ALL_SIG_AREA: Subscribe error:", error.message);
                return;
            }
            message.readString("utf-8", function(error, body) {
                client.ack(message); 
                if (error) {
                    const dt = new Date();
                    console.error(dt.toISOString(), "TD_ALL_SIG_AREA: readString() failed:", error.message);
                    return;
                }
                // Send message to consumer
                tdfeed.processMessage(body, function() {
                    // done
                });
            });
        }
    );

    // Subscribe to the VSTP Feed
    client.subscribe({
            "destination": "/topic/VSTP_ALL",
            "activemq.subscriptionName": "railty_vstp_all",
            "ack": "client-individual"
        },
        function(error, message) {
            if (error) {
                console.error("VSTP_ALL: Subscribe error:", error.message);
                return;
            }
            message.readString("utf-8", function(error, body) {
                client.ack(message); 
                if (error) {
                    const dt = new Date();
                    console.error(dt.toISOString(), "VSTP_ALL: readString() failed:", error.message);
                    return;
                }
                // Send message to consumer
                vstpfeed.processMessage(body, function() {
                    // done
                });
            });
        }
    );

    // Subscribe to the Train Movements Feed
    client.subscribe({
            "destination": "/topic/TRAIN_MVT_ALL_TOC",
            "activemq.subscriptionName": "railty_train_mvt_all_toc",
            "ack": "client-individual"
        },
        function(error, message) {
            if (error) {
                console.error("TRAIN_MVT_ALL_TOC: Subscribe error:", error.message);
                return;
            }
            message.readString("utf-8", function(error, body) {
                client.ack(message);
                if (error) {
                    const dt = new Date();
                    console.error(dt.toISOString(), "TRAIN_MVT_ALL_TOC: readString() failed:", error.message);
                    return;
                }
                // Send message to consumer
                mvtfeed.processMessage(body, function() {
                    // done
                });
            });
        }
    );

    // Subscribe to the TSR Feed
    client.subscribe({
            "destination": "/topic/TSR_ALL_ROUTE",
            "activemq.subscriptionName": "railty_tsr_all_route",
            "ack": "client-individual"
        },
        function(error, message) {
            if (error) {
                console.error("TSR_ALL_ROUTE: Subscribe error:", error.message);
                return;
            }
            message.readString("utf-8", function(error, body) {
                client.ack(message);
                if (error) {
                    const dt = new Date();
                    console.error(dt.toISOString(), "TSR_ALL_ROUTE: readString() failed:", error.message);
                    return;
                }
                // Send message to consumer
                tsrfeed.processMessage(body, function() {
                    // done
                });
            });
        }
    );
});

const exitProgram = function() {
    process.exit();
}

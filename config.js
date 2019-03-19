var config = {};

/**
 * Some settings for accessing NR Data Feeds
 */
config.nrod = {};

config.nrod.login = "username",
config.nrod.passcode = "passwd";

/**
 * SCHEDULE feed
 * The query parameter "day" shall have one of the following values:
 * Daily update extract, CIF: toc-update-mon.CIF.gz  toc-update-tue.CIF.gz ...
 * Daily update extract, JSON: toc-update-mon  toc-update-tue ...
 * Weekly full extract, CIF: toc-full.CIF.gz
 * Daily full extract, JSON: toc-full
 */
config.nrod.scheduleUri = "https://datafeeds.networkrail.co.uk/ntrod/CifFileAuthenticate?type=CIF_ALL_UPDATE_DAILY&day=";

/**
 * Corpus, Smart and TPS
 */
config.nrod.corpusUri = "https://datafeeds.networkrail.co.uk/ntrod/SupportingFileAuthenticate?type=CORPUS";
config.nrod.smartUri = "https://datafeeds.networkrail.co.uk/ntrod/SupportingFileAuthenticate?type=SMART";
config.nrod.tpsUri = "https://datafeeds.networkrail.co.uk/ntrod/SupportingFileAuthenticate?type=TPS";

/**
 * Real-time feeds
 */
config.nrod.connectOptions = {
    host: "datafeeds.networkrail.co.uk",
    port: 61618,
    connectHeaders: {
        "heart-beat": "15000,15000",
        "client-id": "some_id",
        host: "/",
        login: config.nrod.login,
        passcode: config.nrod.passcode
    }
};

module.exports = config;
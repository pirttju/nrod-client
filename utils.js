/**
 * Some helper functions.
 */
var exports = module.exports = {};

var request = require("request"),
    zlib = require("zlib"),
    moment = require("moment-timezone");

/**
 * Filters
 */
exports.filterIntSql = function(val) {
    if (/^(\-|\+)?([0-9]+)$/.test(val)) {
        return Number(val);
    }
    
    return null;
}

exports.filterPowerType = function(val) {
    validPowerTypes = ["D", "DEM", "DMU", "E", "ED", "EML", "EMU", "HST", "S"]
    if (validPowerTypes.includes(val)) {
        return val;
    }
    else {
        return null;
    }
}

exports.filterTime = function(val) {
    if (isNaN(val)) {
        return null;
    }
    var r = moment((parseInt(val) / 1000), "X").tz("Europe/London");
    if (!r.isValid()) {
        return null;
    }
    return r.format();
}

exports.filterTimeUTC = function(val) {
    if (isNaN(val)) {
        return null;
    }
    var r = moment((parseInt(val) / 1000), "X").tz("Europe/London");
    if (!r.isValid()) {
        return null;
    }
    // FIX timestamp in DST time
    if (r.isDST()) {
        r.subtract(1, 'hours');
    }
    return r.format();
}

exports.filterTimetable = function(val) {
    /*
        4 characters: HHmm format
        5 characters: HHmmH format, where last H is half minute (30 seconds)
        6 characters: HHmmss format
    */
    var t = null;
    if (val === null || val === "") {
        return t;
    }
    val = val.trim();
    switch (val.length) {
        case 4:
            t = moment(val, "HHmm").format("HH:mm:ss");
            break;
        case 5:
            t = moment(val.substring(0, 4), "HHmm").add(30, 's').format("HH:mm:ss");
            break;
        case 6:
            t = moment(val, "HHmmss").format("HH:mm:ss");
            break;
    }
    return t;
}

exports.filterAllowance = function(val) {
    var t = null;
    if (val === null || val === "") {
        return t;
    }
    val = val.trim();
    if (val.length > 0) {
    		t = parseInt(val) * 60;
        if (isNaN(t)) {
        	t = 0;
        }
        if (val.indexOf("H") >= 0) {
            t += 30;
        }
    }
    return t;
}

exports.filterValue = function(val) {
    if (val === null || val === "") {
        return null;
    }
    val = val.trim();
    if (val) {
        return val;
    }
    return null;
}

exports.filterTrainType = function(val) {
    var t = "??";
    if (val === null || val === "") {
        return t;
    }
    val = val.trim();
    if (val) {
        return val;
    }
    return t;
}

exports.filterTrainNum = function(val) {
    var t = "****";
    if (val === null || val === "") {
        return t;
    }
    val = val.trim();
    if (val) {
        return val;
    }
    return t;
}

/**
 * Make a HTTP request with decompression handling
 */
exports.compressedRequest = function(options, outStream) {
    var req = request(options);

    req.on("response", function (res) {
        if (res.statusCode !== 200) {
            console.error("HTTP Status was not 200.");
        }

        var encoding;
        
        if (res.headers["content-encoding"]) {
            encoding = res.headers["content-encoding"];
        } else if (res.headers["content-type"] === "application/x-gzip") {
            encoding = "gzip";
        }
        
        if (encoding === "gzip") {
            res.pipe(zlib.createGunzip()).pipe(outStream);
        } else if (encoding === "deflate") {
            res.pipe(zlib.createInflate()).pipe(outStream);
        } else {
            res.pipe(outStream);
        }
    });

    req.on("error", function(err) {
        console.error("HTTP Request Failed: " + err);
    });
}

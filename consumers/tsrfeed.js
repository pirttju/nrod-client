/*
Process messages from TSR Feed (Temporary Speed Restrictions)
*/
const p = require("../pgconn");
const u = require("../utils");
const async = require("async");

// Reusable set of columns
const cs_nr_tsr = new p.pgp.helpers.ColumnSet(["tsrid", "creation_date", "publish_date", "route_group", "route_code",
    "route_order", "tsr_ref", "from_location", "to_location", "line_name", "subunit_type", "mileage_from", "subunit_from",
    "mileage_to", "subunit_to", "moving_mileage", "passenger_speed", "freight_speed", "valid_from", "valid_to",
    "won_valid_from", "won_valid_to", "reason", "requestor", "comments", "direction"], {table: {schema: "nrod", table: "tsr"}});

exports.processMessage = function(body, callback) {
    let data;

    try {
        data = JSON.parse(body);
    } catch (e) {
        const dt = new Date();
        console.error(dt.toISOString(), "TSR_ALL_ROUTE: JSON parse failed. " + e);
        return;
    }

    const tsr_values = [];

    if ((data.TSRBatchMsgV1 && data.TSRBatchMsgV1.TSRBatchMsg) && data.TSRBatchMsgV1.TSRBatchMsg.tsr) {
        async.eachSeries(data.TSRBatchMsgV1.TSRBatchMsg.tsr, function(d, next) {
            tsr_values.push({
                tsrid: u.filterIntSql(d.TSRID),
                creation_date: u.filterTime(d.creationDate),
                publish_date: u.filterTime(d.publishDate),
                route_group: d.RouteGroupName,
                route_code: d.RouteCode,
                route_order: u.filterIntSql(d.RouteOrder),
                tsr_ref: d.TSRReference,
                from_location: d.FromLocation,
                to_location: d.ToLocation,
                line_name: d.LineName,
                subunit_type: d.SubunitType,
                mileage_from: u.filterIntSql(d.MileageFrom),
                subunit_from: u.filterIntSql(d.SubunitFrom),
                mileage_to: u.filterIntSql(d.MileageTo),
                subunit_to: u.filterIntSql(d.SubunitTo),
                moving_mileage: d.MovingMileage,
                passenger_speed: u.filterIntSql(d.PassengerSpeed),
                freight_speed: u.filterIntSql(d.FreightSpeed),
                valid_from: u.filterTime(d.ValidFromDate),
                valid_to: u.filterTime(d.ValidToDate),
                won_valid_from: u.filterTime(d.WONValidFrom),
                won_valid_to: u.filterTime(d.WONValidTo),
                reason: d.Reason,
                requestor: d.Requestor,
                comments: d.Comments,
                direction: d.Direction
            });

            next();
        }, function(err) {
            // Run insert queries
            insertQuery(tsr_values, cs_nr_tsr, function() {
                callback();
            });
        });
    } else {
        const dt = new Date();
        console.error(dt.toISOString(), "TSR_ALL_ROUTE: No data");
        callback();
    }
}

const insertQuery = function(values, cs, callback) {
    if (typeof values !== "undefined" && values.length > 0) {
        // Generating a multi-row insert query
        const query = p.pgp.helpers.insert(values, cs);
        // Upsert
        const upsert = query + " ON CONFLICT (tsrid, route_code) DO UPDATE SET " +
            cs.assignColumns({from: "EXCLUDED", skip: ["tsrid", "route_code"]});
        // Executing the query:
        p.db.none(upsert)
        .then(data=> {
            // success;
            return callback();
        })
        .catch(error=> {
            // error;
            const dt = new Date();
            if (error.detail) {
                console.error(dt.toISOString(), "TSR_ALL_ROUTE:", error.severity, error.code, error.detail);
            } else {
                console.error(dt.toISOString(), "TSR_ALL_ROUTE:", error);
            }
            return callback("Insert failed");
        });
    } else {
        callback();
    }
}

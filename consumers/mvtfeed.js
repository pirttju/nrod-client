/*
Process messages from the Train Movements Feed
*/
const p = require("../pgconn");
const u = require("../utils");
const async = require("async");

const cs_mvt1 = new p.pgp.helpers.ColumnSet(["creation_timestamp", "train_id", "manual_call", "train_service_code", "origin_dep_time", "sched_origin_stanox",
    "tp_origin_stanox", "train_uid", "schedule_start_date", "schedule_end_date", "schedule_type", "vstp_schedule", "schedule_wtt_id", "toc_id"],
    {table: {schema: "nrod", table: "trust_activation"}});

const cs_mvt2 = new p.pgp.helpers.ColumnSet(["canx_timestamp", "train_id", "canx_reason_code", "canx_type", "dep_timestamp", "loc_stanox", "orig_loc_stanox",
    "orig_loc_timestamp", "original_data_source"], {table: {schema: "nrod", table: "trust_cancellation"}});

const cs_mvt3 = new p.pgp.helpers.ColumnSet(["actual_timestamp", "train_id", "arrival_event", "manual_event", "offroute_ind", "train_terminated", "loc_stanox",
    "original_loc_stanox", "planned_timestamp", "platform", "timetable_variation", "original_data_source"], {table: {schema: "nrod", table: "trust_movement"}});

const cs_mvt5 = new p.pgp.helpers.ColumnSet(["reinstatement_timestamp", "train_id", "loc_stanox", "dep_timestamp", "original_loc_stanox", "original_loc_timestamp",
    "original_data_source"], {table: {schema: "nrod", table: "trust_reinstatement"}});

const cs_mvt6 = new p.pgp.helpers.ColumnSet(["coo_timestamp", "train_id", "loc_stanox", "dep_timestamp", "original_loc_stanox", "original_loc_timestamp",
    "reason_code", "original_data_source"], {table: {schema: "nrod", table: "trust_changeorigin"}});

const cs_mvt7 = new p.pgp.helpers.ColumnSet(["event_timestamp", "train_id", "current_train_id", "revised_train_id", "train_service_code", "original_data_source"], 
    {table: {schema: "nrod", table: "trust_changeidentity"}});

const cs_mvt8 = new p.pgp.helpers.ColumnSet(["event_timestamp", "train_id", "loc_stanox", "dep_timestamp", "original_loc_stanox", "original_loc_timestamp",
    "original_data_source"], {table: {schema: "nrod", table: "trust_changelocation"}});

exports.processMessage = function(body, callback) {
    let data;

    try {
        data = JSON.parse(body);
    } catch (e) {
        return callback("JSON parse failed");
    }

    let mvt1 = [];
    let mvt2 = [];
    let mvt3 = [];
    let mvt5 = [];
    let mvt6 = [];
    let mvt7 = [];
    let mvt8 = [];

    async.eachSeries(data, function(item, next) {
        // Handle different message types (message 0004 not used)
        if (item.header && item.header.msg_type) {
            switch(item.header.msg_type) {
                case "0001":
                    mvt1.push(trainActivationMessage(item));
                    break;
                case "0002":
                    mvt2.push(trainCancellationMessage(item));
                    break;
                case "0003":
                    mvt3.push(trainMovementMessage(item));
                    break;
                case "0005":
                    mvt5.push(trainReinstatementMessage(item));
                    break;
                case "0006":
                    mvt6.push(changeOfOriginMessage(item));
                    break;
                case "0007":
                    mvt7.push(changeOfIdentityMessage(item));
                    break;
                case "0008":
                    mvt8.push(changeOfLocationMessage(item));
                    break;
            }
        }

        next();
    }, function(err) {
        // Run insert queries
        async.series([
            function(next) {
                if (mvt1.length > 0) insertQuery(mvt1, cs_mvt1, function(e) { next(null, e); });
                else next(null);
            },
            function(next) {
                if (mvt2.length > 0) insertQuery(mvt2, cs_mvt2, function(e) { next(null, e); });
                else next(null);
            },
            function(next) {
                if (mvt3.length > 0) insertQuery(mvt3, cs_mvt3, function(e) { next(null, e); });
                else next(null);
            },
            function(next) {
                if (mvt5.length > 0) insertQuery(mvt5, cs_mvt5, function(e) { next(null, e); });
                else next(null);
            },
            function(next) {
                if (mvt6.length > 0) insertQuery(mvt6, cs_mvt6, function(e) { next(null, e); });
                else next(null);
            },
            function(next) {
                if (mvt7.length > 0) insertQuery(mvt7, cs_mvt7, function(e) { next(null, e); });
                else next(null);
            },
            function(next) {
                if (mvt8.length > 0) insertQuery(mvt8, cs_mvt8, function(e) { next(null, e); });
                else next(null);
            }
        ],
        function(err, results) {
            callback(results);
        });
    });
}

const insertQuery = function(values, cs, callback) {
    if (typeof values !== "undefined" && values.length > 0) {
        // Generating a multi-row insert query
        let query = p.pgp.helpers.insert(values, cs);
        // Executing the query:
        p.db.none(query)
        .then(data=> {
            // success;
            return callback();
        })
        .catch(error=> {
            const dt = new Date();
            console.error(dt.toISOString(), "TRAIN_MVT_ALL_TOC", error);
            return callback();
        });
    } else {
        callback();
    }
}

const trainActivationMessage = function(item) {
    let d = {
        creation_timestamp: u.filterTimeUTC( item.body.creation_timestamp ),
        train_id: item.body.train_id,
        manual_call: item.body.train_call_type !== "AUTOMATIC",
        train_service_code: u.filterIntSql( item.body.train_service_code ),
        origin_dep_time: u.filterTimeUTC( item.body.origin_dep_timestamp ),
        sched_origin_stanox: u.filterIntSql( item.body.sched_origin_stanox ),
        tp_origin_stanox: u.filterIntSql( item.body.tp_origin_stanox ),
        train_uid: item.body.train_uid,
        schedule_start_date: item.body.schedule_start_date,
        schedule_end_date: item.body.schedule_end_date,
        schedule_type: item.body.schedule_type,
        vstp_schedule: item.body.schedule_source !== "C",
        schedule_wtt_id: item.body.schedule_wtt_id,
        toc_id: u.filterIntSql(item.body.toc_id)
    }

    // Work around a known bug... (sigh)
    if (d.schedule_type === "O") {
        d.schedule_type = "P";
    } else if (d.schedule_type === "P") {
        d.schedule_type = "O";
    }

    return d;
}

const trainCancellationMessage = function(item) {
    let d = {
        canx_timestamp: u.filterTimeUTC( item.body.canx_timestamp ),
        train_id: item.body.train_id,
        canx_reason_code: item.body.canx_reason_code,
        canx_type: item.body.canx_type,
        dep_timestamp: u.filterTimeUTC( item.body.dep_timestamp ),
        loc_stanox: u.filterIntSql( item.body.loc_stanox ),
        orig_loc_stanox: u.filterIntSql( item.body.orig_loc_stanox ),
        orig_loc_timestamp: u.filterTimeUTC( item.body.orig_loc_timestamp ),
        original_data_source: u.filterValue( item.header.original_data_source )
    };

    return d;
}

const trainMovementMessage = function(item) {
    let d = {
        actual_timestamp: u.filterTimeUTC( item.body.actual_timestamp ),
        train_id: item.body.train_id,
        arrival_event: item.body.event_type !== "DEPARTURE",
        manual_event: item.body.event_source !== "AUTOMATIC",
        offroute_ind: item.body.offroute_ind,
        train_terminated: item.body.train_terminated,
        loc_stanox: u.filterIntSql( item.body.loc_stanox ),
        original_loc_stanox: u.filterIntSql( item.body.original_loc_stanox ),
        planned_timestamp: u.filterTimeUTC( item.body.planned_timestamp ),
        platform: u.filterValue( item.body.platform ),
        timetable_variation: parseInt(item.body.timetable_variation),
        original_data_source: u.filterValue( item.header.original_data_source )
    };

    // Invert early variation to negative
    d.timetable_variation = item.body.variation_status === "EARLY" ? (d.timetable_variation * -1) : d.timetable_variation;

    return d;
}

const trainReinstatementMessage = function(item) {
    let d = {
        reinstatement_timestamp: u.filterTimeUTC( item.body.reinstatement_timestamp ),
        train_id: item.body.train_id,
        loc_stanox: u.filterIntSql( item.body.loc_stanox ),
        dep_timestamp: u.filterTimeUTC( item.body.dep_timestamp ),
        original_loc_stanox: u.filterIntSql( item.body.original_loc_stanox ),
        original_loc_timestamp: u.filterTimeUTC( item.body.original_loc_timestamp ),
        original_data_source: u.filterValue( item.header.original_data_source )
    };

    return d;
}

const changeOfOriginMessage = function(item) {
    let d = {
        coo_timestamp: u.filterTimeUTC( item.body.coo_timestamp ),
        train_id: item.body.train_id,
        loc_stanox: u.filterIntSql( item.body.loc_stanox ),
        dep_timestamp: u.filterTimeUTC( item.body.dep_timestamp ),
        original_loc_stanox: u.filterIntSql( item.body.original_loc_stanox ),
        original_loc_timestamp: u.filterTimeUTC( item.body.original_loc_timestamp ),
        reason_code: u.filterValue( item.body.reason_code ),
        original_data_source: u.filterValue( item.header.original_data_source )
    };

    return d;
}

const changeOfIdentityMessage = function(item) {
    let d = {
        event_timestamp: u.filterTimeUTC( item.body.event_timestamp ),
        train_id: item.body.train_id,
        current_train_id: u.filterValue( item.body.current_train_id ),
        revised_train_id: u.filterValue( item.body.revised_train_id ),
        train_service_code: u.filterIntSql( item.body.train_service_code ),
        original_data_source: u.filterValue( item.header.original_data_source )
    };

    return d;
}

const changeOfLocationMessage = function(item) {
    let d = {
        event_timestamp: u.filterTimeUTC( item.body.event_timestamp ),
        train_id: item.body.train_id,
        loc_stanox: u.filterIntSql( item.body.loc_stanox ),
        dep_timestamp: u.filterTimeUTC( item.body.dep_timestamp ),
        original_loc_stanox: u.filterIntSql( item.body.original_loc_stanox ),
        original_loc_timestamp: u.filterTimeUTC( item.body.original_loc_timestamp ),
        original_data_source: u.filterValue( item.header.original_data_source )
    };

    return d;
}

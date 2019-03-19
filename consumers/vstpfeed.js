/*
Process VSTP (Very Short Term Plan) schedule messages.

Quote of the day: "A VSTP schedule can contain anything. It"s probably best to say that you should expect 
anything and everything - even if it makes no sense." --Tom Cairns
*/
const p = require("../pgconn");
const u = require("../utils");

// Reusable set of columns
const cs_locations = new p.pgp.helpers.ColumnSet(["schedule_id", "position", "tiploc_id", "train_stopping", "commercial_stop", "arrival_time", "arrival_day",
    "departure_time", "departure_day", "gbtt_arrival_time", "gbtt_departure_time", "platform", "line", "path", "activity", "engineering_allowance",
    "pathing_allowance", "performance_allowance"], {table: {schema: "nrod", table: "schedule_locations"}});

exports.processMessage = function(body, callback) {
    let data;

    try {
        data = JSON.parse(body);
    } catch (e) {
        return callback("JSON parse failed");
    }

    vstpSchedule(data, function() {
        callback();
    });
}

// There are some industry processes, which populate the CIF_speed field incorrectly. This is a simple work-around.
const speedFix = function(speed) {
    switch (!isNaN(speed) && parseInt(speed)) {
        case false:
            return null;
        case 34:
            return 15;
        case 67:
            return 30;
        case 78:
            return 35;
        case 89:
            return 40;
        case 101:
            return 45;
        case 112:
            return 50;
        case 123:
            return 55;
        case 134:
            return 60;
        case 168:
            return 75;
        case 179:
            return 80;
        case 201:
            return 90;
        case 213:
            return 95;
        case 224:
            return 100;
        case 246:
            return 110;
        case 280:
            return 125;
        case 314:
            return 140;
        case 417:
            return 186;
        default:
            return parseInt(speed) || null;
    }
}

// Delete VSTP schedule from the database
const deleteVstpSchedule = function(values, callback) {
    p.db.none("UPDATE nrod.schedules SET deletion_time = $[creation_time] WHERE deletion_time IS NULL AND train_uid = $[train_uid] " +
              "AND start_date = $[start_date] AND schedule_type = $[schedule_type] AND vstp_schedule", values)
    .then(data => {
        return callback();
    })
    .catch(error => {
        const dt = new Date();
        console.error(dt.toISOString(), "VSTP_ALL:", error);
        return callback();
    });
}

// Insert VSTP schedule into the database
const insertVstpSchedule = function(values, callback) {
    p.db.one("INSERT INTO nrod.schedules VALUES(DEFAULT, $[train_uid], $[start_date], $[end_date], $[days_runs], "
         + "$[train_status], $[train_category], $[signalling_id], $[headcode], $[train_service_code], $[portion_id], "
         + "$[power_type], $[timing_load], $[speed], $[operating_chars], $[seating_class], $[sleepers], $[reservations], "
         + "$[catering_code], $[atoc_code], $[uic_code], $[schedule_type], TRUE, $[creation_time], NULL) RETURNING schedule_id", values)
    .then(data => {
        // Insert locations using data.schedule_id
        insertVstpScheduleLocations(values.timetableRows, data.schedule_id, cs_locations, function(err) {
            if (err) {
                return callback(err);
            }
            return callback();
        });
    })
    .catch(error => {
        const dt = new Date();
        console.error(dt.toISOString(), "VSTP_ALL:", error);
        return callback();
    });
}

// Insert schedule locations into the database
const insertVstpScheduleLocations = function(values, sid, cs, callback) {
    const length = values.length;
    for (let v = 0; v < length; v++) {
        values[v].schedule_id = sid;
    }
    // Generating a multi-row insert query
    const query = p.pgp.helpers.insert(values, cs);
    // Executing the query:
    p.db.none(query)
    .then(data=> {
        // success;
        return callback();
    })
    .catch(error=> {
        const dt = new Date();
        console.error(dt.toISOString(), "VSTP_ALL", error);
        return callback();
    });
}

const vstpSchedule = function(item, callback) {
    // Schedule headers
    const dt = new Date();

    let d = {
        transaction_type: item.VSTPCIFMsgV1.schedule.transaction_type,
        train_uid: item.VSTPCIFMsgV1.schedule.CIF_train_uid,
        start_date: item.VSTPCIFMsgV1.schedule.schedule_start_date,
        end_date: item.VSTPCIFMsgV1.schedule.schedule_end_date,
        days_runs: item.VSTPCIFMsgV1.schedule.schedule_days_runs,
        train_status: u.filterValue( item.VSTPCIFMsgV1.schedule.train_status ),
        applicable_timetable: (item.VSTPCIFMsgV1.schedule.applicable_timetable === "Y"),
        schedule_type: item.VSTPCIFMsgV1.schedule.CIF_stp_indicator,
        creation_time: u.filterTime( item.VSTPCIFMsgV1.timestamp )
    };

    if (item.VSTPCIFMsgV1.schedule.schedule_segment[0]) {
        // Additional schedule headers
        d.train_category = u.filterTrainType( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_train_category );
        d.signalling_id = u.filterTrainNum( item.VSTPCIFMsgV1.schedule.schedule_segment[0].signalling_id );
        d.headcode = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_headcode );
        d.train_service_code = u.filterIntSql( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_train_service_code );
        d.portion_id = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_business_sector );
        d.power_type = u.filterPowerType( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_power_type );
        d.timing_load = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_timing_load );
        d.speed = speedFix( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_speed );
        d.operating_chars = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_operating_characteristics );
        d.seating_class = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_train_class );
        d.sleepers = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_sleepers );
        d.reservations = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_reservations );
        d.catering_code = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].CIF_catering_code );
        d.atoc_code = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].atoc_code );
        d.uic_code = u.filterValue( item.VSTPCIFMsgV1.schedule.schedule_segment[0].uic_code );
        d.timetableRows = [];

        // Process all locations in the schedule
        let lastArrivalDay = 0;
        let lastDepartureDay = 0;
        let lastArrivalTime = "00:00:00";
        let lastDepartureTime = "00:00:00";

        const length = item.VSTPCIFMsgV1.schedule.schedule_segment[0].schedule_location.length;

        for (let position = 0; position < length; position++) {
            c = item.VSTPCIFMsgV1.schedule.schedule_segment[0].schedule_location[position];

            // Planned times and calculation of day numbers
            const arrivalTime = u.filterTimetable( c.scheduled_arrival_time );
            const departureTime = c.scheduled_departure_time.trim() ? u.filterTimetable( c.scheduled_departure_time ) : u.filterTimetable( c.scheduled_pass_time );
            const gbttArrivalTime = u.filterTimetable( c.public_arrival_time );
            const gbttDepartureTime = u.filterTimetable( c.public_departure_time );
            const arrivalDay = lastDepartureDay + (lastDepartureTime > arrivalTime) ? 1 : 0;
            const departureDay = arrivalDay + (arrivalTime > departureTime) ? 1 : 0;

            lastArrivalTime = arrivalTime;
            lastDepartureTime = departureTime;
            lastArrivalDay = arrivalDay;
            lastDepartureDay = departureDay;

            // Stopping logic
            let trainStopping = false;
            let commercialStop = false;

            if (c.CIF_activity.startsWith("TB")) {
                // Train begins
                trainStopping = true;
                commercialStop = true;
            } else if (c.CIF_activity.startsWith("TF")) {
                // Train finishes
                trainStopping = true;
                commercialStop = true;
            } else if (c.scheduled_pass_time.trim().length > 0) {
                // Passing location
                trainStopping = false;
                commercialStop = false;
            } else {
                // Intermediate location
                if (gbttArrivalTime || gbttDepartureTime) {
                    commercialStop = true;
                }

                if (arrivalTime) {
                    trainStopping = true;
                }
            }

            // Schedule location row
            let loc = {
                position: position,
                tiploc_id: c.location.tiploc.tiploc_id,
                train_stopping: trainStopping,
                commercial_stop: commercialStop,
                arrival_time: arrivalTime,
                arrival_day: arrivalDay,
                departure_time: departureTime,
                departure_day: departureDay,
                gbtt_arrival_time: gbttArrivalTime,
                gbtt_departure_time: gbttDepartureTime,
                platform: u.filterValue( c.CIF_platform ),
                path: u.filterValue( c.CIF_path ),
                line: u.filterValue( c.CIF_line ),
                activity: u.filterValue( c.CIF_activity ),
                engineering_allowance: u.filterValue( c.CIF_engineering_allowance ),
                pathing_allowance: u.filterValue( c.CIF_pathing_allowance ),
                performance_allowance: u.filterValue( c.CIF_performance_allowance )
            };

            d.timetableRows.push(loc);
        }
    }

    // Handle transactions
    if (d.transaction_type.toUpperCase() === "CREATE") {
        insertVstpSchedule(d, function(err) {
            if (err) {
                return callback(err);
            }
            callback();
        });
    } else if (d.transaction_type.toUpperCase() === "DELETE") {
        deleteVstpSchedule(d, function(err) {
            if (err) {
                return callback(err);
            }
            callback();
        });
    } else if (d.transaction_type.toUpperCase() === "UPDATE") {
        deleteVstpSchedule(d, function(err) {
            if (err) {
                return callback(err);
            }
            insertVstpSchedule(d, function(err) {
                if (err) {
                    return callback(err);
                }
                callback();
            });
        });
    }
}

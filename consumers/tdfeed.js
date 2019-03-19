/*
Process messages from TD Feed
*/
const p = require("../pgconn");
const u = require("../utils");
const async = require("async");

// Reusable set of columns
const cs_nr_tdfeed = new p.pgp.helpers.ColumnSet(["time", "area_id", "msg_type", "step_from", "step_to", "descr"], {table: {schema: "nrod", table: "td_cclass"}});
const cs_nr_tdheartbeat = new p.pgp.helpers.ColumnSet(["time", "area_id", "msg_type", "report_time"], {table: {schema: "nrod", table: "td_heartbeat"}});
const cs_nr_sigdata = new p.pgp.helpers.ColumnSet(["time", "area_id", "item_id", "state"], {table: {schema: "nrod", table: "td_sclass"}});

exports.processMessage = function(body, callback) {
    const dtNow = new Date();
    let data;

    try {
        data = JSON.parse(body);
    } catch (e) {
        return callback("JSON parse failed");
    }

    let td_values = [];
    let td_heartbeats = [];
    let sig_values = [];

    async.eachSeries(data, function(d, next) {
        let time;
        let dt;
        let foo;

        // C-Class messages:
        // CA: "Berth Step"
        if (d.CA_MSG) {
            time = parseInt(d.CA_MSG.time);
            dt = new Date(time);
            if (dt < dtNow) {
                td_values.push({
                    time: dt.toISOString(),
                    area_id: d.CA_MSG.area_id,
                    msg_type: "CA",
                    step_from: d.CA_MSG.from,
                    step_to: d.CA_MSG.to,
                    descr: d.CA_MSG.descr
                });
            }
            return next();
        }
        // CB: "Berth Cancel"
        else if (d.CB_MSG) {
            time = parseInt(d.CB_MSG.time);
            dt = new Date(time);
            if (dt < dtNow) {
                td_values.push({
                    time: dt.toISOString(),
                    area_id: d.CB_MSG.area_id,
                    msg_type: "CB",
                    step_from: d.CB_MSG.from,
                    step_to: null,
                    descr: d.CB_MSG.descr
                });
            }
            return next();
        }
        // CC: "Berth Interpose"
        else if (d.CC_MSG) {
            time = parseInt(d.CC_MSG.time);
            dt = new Date(time);
            if (dt < dtNow) {
                td_values.push({
                    time: dt.toISOString(),
                    area_id: d.CC_MSG.area_id,
                    msg_type: "CC",
                    step_from: null,
                    step_to: d.CC_MSG.to,
                    descr: d.CC_MSG.descr
                });
            }
            return next();
        }
        // CT: "Heartbeat"
        else if (d.CT_MSG) {
            time = parseInt(d.CT_MSG.time);
            dt = new Date(time);
            if (dt < dtNow) {
                // remove old value if exists (possible duplicate message and postgres will not be happy)
                const length = td_heartbeats.length
                for (let i = 0; i < length; i++) {
                    if (td_heartbeats[i].area_id && td_heartbeats[i].area_id === d.CT_MSG.area_id) {
                        td_heartbeats.splice(i, 1);
                    }
                }
                // push new value
                td_heartbeats.push({
                    time: dt.toISOString(),
                    area_id: d.CT_MSG.area_id,
                    msg_type: "CT",
                    report_time: d.CT_MSG.report_time
                });
            }
            return next();
        }
        // S-Class messages:
        // SF: "Signalling Update"
        else if (d.SF_MSG) {
            updateBits(d.SF_MSG, function(foo) {
                if (foo instanceof Array) {
                    sig_values = sig_values.concat(foo);
                } else {
                    sig_values.push(foo);
                }
                return next();
            });
        }
        // SG: "Signalling Refresh"
        else if (d.SG_MSG) {
            refreshBits(d.SG_MSG, function(foo) {
                if (foo instanceof Array) {
                    sig_values = sig_values.concat(foo);
                } else {
                    sig_values.push(foo);
                }
                return next();
            });
        }
        // SH: "Signalling Refresh Finished"
        else if (d.SH_MSG) {
            refreshBits(d.SH_MSG, function(foo) {
                if (foo instanceof Array) {
                    sig_values = sig_values.concat(foo);
                } else {
                    sig_values.push(foo);
                }
                return next();
            });
        }
    }, function(err) {
        // Run insert queries
        insertQuery(td_values, cs_nr_tdfeed, function() {
            insertQuery(sig_values, cs_nr_sigdata, function() {
                upsertQuery(td_heartbeats, cs_nr_tdheartbeat, function() {
                    callback();
                });
            });
        });
    });
}

const insertQuery = function(values, cs, callback) {
    if (typeof values !== "undefined" && values.length > 0) {
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
            console.error(dt.toISOString(), "TD_ALL_SIG_AREA", error);
            return callback();
        });
    } else {
        callback();
    }
}

const upsertQuery = function(values, cs, callback) {
    if (typeof values !== "undefined" && values.length > 0) {
        // Generating a multi-row upsert query
        const query = p.pgp.helpers.insert(values, cs) + 
                      " ON CONFLICT(area_id) DO UPDATE SET " +
                      cs.assignColumns({from: 'EXCLUDED', skip: 'area_id'});
        // Executing the query:
        p.db.any(query)
        .then(data=> {
            // success;
            return callback();
        })
        .catch(error=> {
            const dt = new Date();
            console.error(dt.toISOString(), "TD_ALL_SIG_AREA", error);
            return callback();
        });
    } else {
        callback();
    }
}

// helper class for signalling bits
const bits = {
    set: function(a, data) {
        // Return true only if the bit exists and changes
        // Check if exists
        if (this.bitData.hasOwnProperty(a)) {
            // yep; check if it has been changed
            if (this.bitData[a] !== data) {
                this.bitData[a] = data;
                return true;
            }
        } else {
            // doesn"t exist; set it now
            this.bitData[a] = data;
        }
        return false;
    },
    get: function(a) {
        let r = null;
        if (this.bitData.hasOwnProperty(a)) {
            r = this.bitData[a];
        }
        return r;
    },
    bitData: {}
};

const updateBits = function(d, callback) {
    let value = parseInt(d.data, 16);
    let address = parseInt(d.address, 16);
    let key, itemId;
    const r = [];
    const time = parseInt(d.time);
    const dt = new Date(time);
    const dtNow = new Date();
    if (dt < dtNow) {
        // Extract and test all bits from the address
        for (let bit = 0; bit < 8; bit++) {
            itemId = address * 8 + bit;
            key = d.area_id + itemId;
            if ((value & (1 << bit)) !== 0) {
                if (bits.set(key, 1)) {
                    // The bit has been changed (0 to 1)
                    r.push({
                        time: dt.toISOString(),
                        area_id: d.area_id,
                        item_id: itemId,
                        state: "t"
                    });
                }
            } else {
                if (bits.set(key, 0)) {
                    // The bit has been changed (1 to 0)
                    r.push({
                        time: dt.toISOString(),
                        area_id: d.area_id,
                        item_id: itemId,
                        state: "f"
                    });
                }
            }
        }
    }

    callback(r);
}

const refreshBits = function(d, callback) {
    let value, address, key, itemId;
    const r = [];
    const time = parseInt(d.time);
    const dt = new Date(time);
    const dtNow = new Date();
    if (dt < dtNow) {
        // Extract all bytes from the address (4 bytes for Signalling Refreshes)
        for (let byted = 0; byted < 4; byted++) {
            value = parseInt(d.data.substring(byted * 2, 2), 16);
            address = Number(parseInt(d.address, 16) + byted);
            // Extract and test all bits from the address
            for (let bit = 0; bit < 8; bit++) {
                itemId = address * 8 + bit;
                key = d.area_id + itemId;
                if ((value & (1 << bit)) !== 0) {
                    if (bits.set(key, 1)) {
                        // The bit has been changed (0 to 1)
                        r.push({
                            time: dt.toISOString(),
                            area_id: d.area_id,
                            item_id: itemId,
                            state: "t"
                        });
                    }
                } else {
                    if (bits.set(key, 0)) {
                        // The bit has been changed (1 to 0)
                        r.push({
                            time: dt.toISOString(),
                            area_id: d.area_id,
                            item_id: itemId,
                            state: "f"
                        });
                    }
                }
            }
        }
    }

    callback(r);
}

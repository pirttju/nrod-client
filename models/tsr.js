const { db } = require("../db");

function parsevalue(input) {
  const str = input || "";
  out = str.trim();

  if (out === "") return null;

  return out;
}

function parsets(ts) {
  if (ts) {
    let date;
    try {
      date = new Date(parseInt(ts));
    } catch {
      date = null;
    }
    return date;
  } else {
    return null;
  }
}

class TSRFeed {
  parse(data) {
    if (!data.TSRBatchMsgV1) return;
    if (!data.TSRBatchMsgV1.TSRBatchMsg) return;
    if (!data.TSRBatchMsgV1.TSRBatchMsg.tsr) return;
    if (!Array.isArray(data.TSRBatchMsgV1.TSRBatchMsg.tsr)) return;

    const tsr_batch_msg = {
      route_group: parsevalue(data.TSRBatchMsgV1.TSRBatchMsg.routeGroup),
      route_group_code: parsevalue(
        data.TSRBatchMsgV1.TSRBatchMsg.routeGroupCode
      ),
      publish_date: parsets(data.TSRBatchMsgV1.TSRBatchMsg.publishDate),
      publish_source: parsevalue(data.TSRBatchMsgV1.TSRBatchMsg.publishSource),
      route_group_coverage: parsevalue(
        data.TSRBatchMsgV1.TSRBatchMsg.routeGroupCoverage
      ),
      batch_publish_event: parsevalue(
        data.TSRBatchMsgV1.TSRBatchMsg.batchPublishEvent
      ),
      won_start_date: parsets(data.TSRBatchMsgV1.TSRBatchMsg.WONStartDate),
      won_end_date: parsets(data.TSRBatchMsgV1.TSRBatchMsg.WONEndDate),
    };

    const save = [];

    data.TSRBatchMsgV1.TSRBatchMsg.tsr.forEach((v) => {
      const tsr = {
        tsrid: parsevalue(v.TSRID),
        creation_date: parsets(v.creationDate),
        publish_date: parsets(v.publishDate),
        publish_event: parsevalue(v.publishEvent),
        route_group: parsevalue(v.RouteGroupName),
        route_code: parsevalue(v.RouteCode),
        route_order: parsevalue(v.RouteOrder),
        tsr_reference: parsevalue(v.TSRReference),
        from_location: parsevalue(v.FromLocation),
        to_location: parsevalue(v.ToLocation),
        line_name: parsevalue(v.LineName),
        subunit_type: parsevalue(v.SubunitType),
        mileage_from: parsevalue(v.MileageFrom),
        subunit_from: parsevalue(v.SubunitFrom),
        mileage_to: parsevalue(v.MileageTo),
        subunit_to: parsevalue(v.SubunitTo),
        moving_mileage: parsevalue(v.MovingMileage),
        passenger_speed: parsevalue(v.PassengerSpeed),
        freight_speed: parsevalue(v.FreightSpeed),
        valid_from_date: parsets(v.ValidFromDate),
        valid_to_date: parsets(v.ValidToDate),
        reason: parsevalue(v.Reason),
        requestor: parsevalue(v.Requestor),
        comments: parsevalue(v.Comments),
        direction: parsevalue(v.Direction),
      };
      save.push(tsr);
    });

    return db.tx("insert-tsr-batch-msg", async (t) => {
      const res = await t.tsr.insert(tsr_batch_msg);
      const queries = [];
      const tsrs = save.map((v) => ({
        ...v,
        tsr_batch_msg_id: res.id,
      }));
      queries.push(t.tsr.insert_tsr(tsrs));
      return t.batch(queries);
    });
  }
}

module.exports = TSRFeed;

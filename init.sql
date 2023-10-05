BEGIN;

-- Train Describer Data

-- C Class data
CREATE TABLE nrod_td_c (
  time        timestamptz,
  area_id     text,
  msg_type    text,
  from_berth  text,
  to_berth    text,
  descr       text
);

CREATE INDEX ON nrod_td_c(area_id);

-- S Class data
CREATE TABLE nrod_td_s (
  time        timestamptz,
  area_id     text,
  bit         smallint,
  state       boolean
);

CREATE INDEX ON nrod_td_s(area_id);


-- Train Movements: data from Network Rail's TRUST system

-- 0001 Train Activation
CREATE TABLE trust_activation(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  creation_timestamp    timestamptz,
  train_call_mode       text,
  train_call_type       text,
  train_service_code    integer,
  toc_id                smallint,
  sched_origin_stanox   integer,
  origin_dep_timestamp  timestamptz,
  tp_origin_stanox      integer,
  schedule_source       text,
  train_uid             text,
  schedule_start_date   date,
  schedule_end_date     date,
  schedule_type         text
);

CREATE INDEX ON trust_activation(train_id);

-- 0002 Train Cancellation
CREATE TABLE trust_cancellation(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  canx_timestamp        timestamptz,
  canx_type             text,
  canx_reason_code      text,
  loc_stanox            integer,
  dep_timestamp         timestamptz,
  orig_loc_stanox       integer,
  orig_loc_timestamp    timestamptz,
  original_data_source  text
);

CREATE INDEX ON trust_cancellation(train_id);

-- 0003 Train Movement
CREATE TABLE trust_movement(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  loc_stanox            integer,
  actual_timestamp      timestamptz,
  event_type            text,
  platform              text,
  planned_timestamp     timestamptz,
  timetable_variation   smallint,
  offroute_ind          boolean,
  original_data_source  text
);

CREATE INDEX ON trust_movement(train_id);
CREATE INDEX ON trust_movement(planned_timestamp);

-- 0005 Train Reinstatement
CREATE TABLE trust_reinstatement(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  reinstatement_timestamp timestamptz,
  loc_stanox            integer,
  dep_timestamp         timestamptz,
  original_loc_stanox   integer,
  original_loc_timestamp timestamptz,
  original_data_source  text
);

CREATE INDEX ON trust_reinstatement(train_id);

-- 0006 Change of Origin
CREATE TABLE trust_change_origin(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  coo_timestamp         timestamptz,
  reason_code           text,
  loc_stanox            integer,
  dep_timestamp         timestamptz,
  original_loc_stanox   integer,
  original_loc_timestamp timestamptz,
  original_data_source  text
);

CREATE INDEX ON trust_change_origin(train_id);

-- 0007 Change of Identity
CREATE TABLE trust_change_identity(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  revised_train_id      text,
  event_timestamp       timestamptz,
  original_data_source  text
);

CREATE INDEX ON trust_change_identity(train_id);

-- 0008 Change of Location
CREATE TABLE trust_change_location(
  id                    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  train_id              text,
  current_train_id      text,
  event_timestamp       timestamptz,
  loc_stanox            integer,
  dep_timestamp         timestamptz,
  original_loc_stanox   integer,
  original_loc_timestamp timestamptz,
  original_data_source  text
);

CREATE INDEX ON trust_change_location(train_id);


-- SCHEDULE & VSTP Feed

CREATE TABLE nrod_tiploc (
    tiploc_code                 text PRIMARY KEY,
    nalco                       int,
    check_char                  text,
    tps_description             text,
    stanox                      int,
    crs_code                    text,
    description                 text
);

-- AA Records (Association)
CREATE TABLE nrod_association (
    id                          integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    main_train_uid              text,
    assoc_train_uid             text,
    assoc_start_date            date,
    assoc_end_date              date,
    assoc_days                  bit(7),
    category                    text,
    date_indicator              text,
    location                    text,
    base_location_suffix        smallint,
    assoc_location_suffix       smallint,
    association_type            text,
    stp_indicator               text
);

CREATE UNIQUE INDEX nrod_association_unique_idx ON nrod_association (main_train_uid, assoc_start_date, stp_indicator);

-- BS and BX Records (Schedule)
CREATE TABLE nrod_schedule (
    id                          integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    is_vstp                     boolean NOT NULL DEFAULT FALSE,
    train_uid                   text NOT NULL,
    schedule_start_date         date NOT NULL,
    schedule_end_date           date,
    schedule_days_runs          bit(7),
    train_status                text,
    train_category              text,
    signalling_id               text,
    train_service_code          integer,
    power_type                  text,
    timing_load                 text,
    speed                       smallint,
    operating_characteristics   text,
    train_class                 text,
    sleepers                    text,
    reservations                text,
    catering_code               text,
    service_branding            text,
    stp_indicator               text NOT NULL,
    uic_code                    text,
    atoc_code                   text,
    applicable_timetable        boolean,
    last_modified               timestamptz
);

CREATE UNIQUE INDEX nrod_schedule_unique_idx ON nrod_schedule (train_uid, schedule_start_date, stp_indicator, is_vstp);
CREATE INDEX ON nrod_schedule USING BRIN (schedule_start_date);
CREATE INDEX ON nrod_schedule (stp_indicator);
CREATE INDEX ON nrod_schedule (train_uid);
CREATE INDEX ON nrod_schedule (is_vstp);

-- LO, LI and LT Records (Location)
CREATE TABLE nrod_schedule_location (
    schedule_id                 integer REFERENCES nrod_schedule (id) ON DELETE CASCADE,
    position                    smallint,
    tiploc_code                 text NOT NULL,
    tiploc_instance             smallint,
    arrival_day                 smallint,
    departure_day               smallint,
    arrival                     time without time zone,
    departure                   time without time zone,
    public_arrival              time without time zone,
    public_departure            time without time zone,
    platform                    text,
    line                        text,
    path                        text,
    activity                    text,
    engineering_allowance       text,
    pathing_allowance           text,
    performance_allowance       text,
    PRIMARY KEY (schedule_id, position)
);

CREATE INDEX ON nrod_schedule_location (tiploc_code);

-- CR Record (Changes En Route)
CREATE TABLE nrod_changes_en_route (
    schedule_id                 integer REFERENCES nrod_schedule (id) ON DELETE CASCADE,
    tiploc_code                 text NOT NULL,
    tiploc_instance             smallint,
    train_status                text,
    train_category              text,
    signalling_id               text,
    train_service_code          integer,
    power_type                  text,
    timing_load                 text,
    speed                       smallint,
    operating_characteristics   text,
    train_class                 text,
    sleepers                    text,
    reservations                text,
    catering_code               text,
    service_branding            text,
    uic_code                    text
);

CREATE INDEX ON nrod_changes_en_route (schedule_id);


-- TSR Feed

-- Headers of the TSR message
CREATE TABLE nrod_tsr_batch_msg(
    id                          integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    route_group                 text,
    route_group_code            text,
    publish_date                timestamptz,
    publish_source              text,
    route_group_coverage        text,
    batch_publish_event         text,
    won_start_date              timestamptz,
    won_end_date                timestamptz
);

-- Temporary Speed Restrictions
CREATE TABLE nrod_tsr(
    tsr_batch_msg_id            int REFERENCES nrod_tsr_batch_msg(id) ON DELETE CASCADE,
    tsrid                       int,
    creation_date               timestamptz,
    publish_date                timestamptz,
    publish_event               text,
    route_group                 text,
    route_code                  text,
    route_order                 smallint,
    tsr_reference               text,
    from_location               text,
    to_location                 text,
    line_name                   text,
    subunit_type                text,
    mileage_from                smallint,
    subunit_from                smallint,
    mileage_to                  smallint,
    subunit_to                  smallint,
    moving_mileage              boolean,
    passenger_speed             smallint,
    freight_speed               smallint,
    valid_from_date             timestamptz,
    valid_to_date               timestamptz,
    reason                      text,
    requestor                   text,
    comments                    text,
    direction                   text,
    PRIMARY KEY (tsr_batch_msg_id, tsrid)
);

COMMIT;

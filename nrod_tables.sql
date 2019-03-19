BEGIN;

CREATE SCHEMA nrod;

-------------------------------------------------------------------------------
-- SCHEDULE tables
-------------------------------------------------------------------------------

CREATE TABLE nrod.schedule_updates (
    file_identity           text,
    acceptance_date         timestamptz,
    current_file_ref        text,
    start_date              date,
    end_date                date
);

CREATE TABLE nrod.schedule_associations (
    association_id          serial NOT NULL,
    main_train_uid          text,
    assoc_train_uid         text,
    start_date              date,
    end_date                date,
    days_runs               bit(7),
    category                text,
    date_indicator          text,
    tiploc_id               text,
    base_suffix             smallint,
    assoc_suffix            smallint,
    assoc_type              text,
    schedule_type           text,
    PRIMARY KEY (association_id)
);

CREATE INDEX ON nrod.schedule_associations(main_train_uid);

CREATE TABLE nrod.schedules (
    schedule_id             serial NOT NULL,
    train_uid               text NOT NULL,
    start_date              date NOT NULL,
    end_date                date,
    days_runs               bit(7),
    train_status            text,
    train_category          text,
    signalling_id           text,
    headcode                text,
    train_service_code      int,
    portion_id              text,
    power_type              text,
    timing_load             text,
    speed                   smallint,
    operating_chars         text,
    seating_class           text,
    sleepers                text,
    reservations            text,
    catering_code           text,
    atoc_code               text,
    uic_code                text,
    schedule_type           text NOT NULL,
    vstp_schedule           boolean NOT NULL DEFAULT FALSE,
    creation_time           timestamptz NOT NULL,
    deletion_time           timestamptz,
    PRIMARY KEY (schedule_id)
);

ALTER TABLE nrod.schedules ADD CONSTRAINT nrod_schedules_uniq UNIQUE (train_uid, start_date, schedule_type, vstp_schedule, creation_time);
CREATE INDEX ON nrod.schedules(vstp_schedule);

-- STP cancellations
CREATE TABLE nrod.schedule_stpcancel (
    departure_date          date,
    train_uid               text,
    vstp_cancel             boolean,
    PRIMARY KEY (departure_date, train_uid, vstp_cancel)
);

CREATE TABLE nrod.schedule_locations (
    schedule_id             int NOT NULL REFERENCES nrod.schedules(schedule_id) ON DELETE CASCADE,
    position                smallint NOT NULL,
    tiploc_id               text NOT NULL,
    train_stopping          boolean DEFAULT FALSE,
    commercial_stop         boolean DEFAULT FALSE,
    arrival_time            time without time zone,
    arrival_day             smallint,
    departure_time          time without time zone,
    departure_day           smallint,
    gbtt_arrival_time       time without time zone,
    gbtt_departure_time     time without time zone,
    platform                text,
    line                    text,
    path                    text,
    activity                text,
    engineering_allowance   text,
    pathing_allowance       text,
    performance_allowance   text,
    PRIMARY KEY (schedule_id, position)
);

CREATE INDEX ON nrod.schedule_locations(tiploc_id);

CREATE TABLE nrod.schedule_tiplocs (
    tiploc_id               text NOT NULL,
    nalco                   int,
    check_char              text,
    tps_description         text,
    stanox                  int,
    crs_code                text,
    description             text,
    creation_time           timestamptz NOT NULL,
    deletion_time           timestamptz,
    PRIMARY KEY (tiploc_id, creation_time)
);

CREATE INDEX ON nrod.schedule_tiplocs(stanox);

CREATE TABLE nrod.schedule_changes (
    schedule_id             int NOT NULL REFERENCES nrod.schedules(schedule_id) ON DELETE CASCADE,
    position                smallint NOT NULL,
    tiploc_id               text NOT NULL,
    column_name             text NOT NULL,
    new_value               text
);

CREATE INDEX ON nrod.schedule_changes(schedule_id);


-------------------------------------------------------------------------------
-- TRUST tables
-------------------------------------------------------------------------------

-- Activation messages (0001)
CREATE TABLE nrod.trust_activation (
    creation_timestamp      timestamptz NOT NULL,
    train_id                text NOT NULL,
    manual_call             boolean,
    train_service_code      int,
    origin_dep_time         timestamptz NOT NULL,
    sched_origin_stanox     int,
    tp_origin_stanox        int,
    train_uid               text,
    schedule_start_date     date,
    schedule_end_date       date,
    schedule_type           text,
    vstp_schedule           boolean,
    schedule_wtt_id         text,
    toc_id                  smallint
);

CREATE INDEX ON nrod.trust_activation(train_id);
CREATE INDEX ON nrod.trust_activation(train_uid);

-- Cancellation messages (0002)
CREATE TYPE nrod.canx_type AS ENUM ('AT ORIGIN', 'EN ROUTE', 'ON CALL', 'OUT OF PLAN');

CREATE TABLE nrod.trust_cancellation (
    canx_timestamp          timestamptz NOT NULL,
    train_id                text NOT NULL,
    canx_reason_code        text,
    canx_type               nrod.canx_type,
    dep_timestamp           timestamptz,
    loc_stanox              int,
    orig_loc_stanox         int,
    orig_loc_timestamp      timestamptz,
    original_data_source    text
);

CREATE INDEX ON nrod.trust_cancellation(train_id);

-- Movement messages (0003)
CREATE TABLE nrod.trust_movement (
    actual_timestamp        timestamptz NOT NULL,
    train_id                text NOT NULL,
    arrival_event           boolean,
    manual_event            boolean,
    offroute_ind            boolean,
    train_terminated        boolean,
    loc_stanox              int,
    original_loc_stanox     int,
    planned_timestamp       timestamptz,
    platform                text,
    timetable_variation     smallint,
    original_data_source    text
);

CREATE INDEX ON nrod.trust_movement(train_id);

-- Train Reinstatement messages (0005)
CREATE TABLE nrod.trust_reinstatement (
    reinstatement_timestamp timestamptz NOT NULL,
    train_id                text NOT NULL,
    loc_stanox              int,
    dep_timestamp           timestamptz,
    original_loc_stanox     int,
    original_loc_timestamp  timestamptz,
    original_data_source    text
);

CREATE INDEX ON nrod.trust_reinstatement(train_id);

-- Change of Origin messages (0006)
CREATE TABLE nrod.trust_changeorigin (
    coo_timestamp           timestamptz NOT NULL,
    train_id                text NOT NULL,
    loc_stanox              int,
    dep_timestamp           timestamptz,
    original_loc_stanox     int,
    original_loc_timestamp  timestamptz,
    reason_code             text,
    original_data_source    text
);

CREATE INDEX ON nrod.trust_changeorigin(train_id);

-- Change of Identity messages (0007)
CREATE TABLE nrod.trust_changeidentity (
    event_timestamp         timestamptz NOT NULL,
    train_id                text NOT NULL,
    current_train_id        text,
    revised_train_id        text,
    train_service_code      int,
    original_data_source    text
);

CREATE INDEX ON nrod.trust_changeidentity(train_id);

-- Change of Location messages (0008)
CREATE TABLE nrod.trust_changelocation (
    event_timestamp         timestamptz NOT NULL,
    train_id                text NOT NULL,
    loc_stanox              int,
    dep_timestamp           timestamptz,
    original_loc_stanox     int,
    original_loc_timestamp  timestamptz,
    original_data_source    text
);

CREATE INDEX ON nrod.trust_changelocation(train_id);


-------------------------------------------------------------------------------
-- TD feed tables
-------------------------------------------------------------------------------

-- TD areas
CREATE TABLE nrod.td_areas (
    area_id         text,
    description     text,
    commissioning   date,
    abolished       date
);

-- S-class items (max. 2048 items per area)
CREATE TABLE nrod.td_sclassitems (
    area_id         text,
    item_id         smallint,
    function_name   text,
    item_type       text,
    signal_prefix   text,
    signal_number   text,
    route_letter    text,
    route_class     text,
    inversed        boolean,
    sop_version     text,
    valid_from      timestamptz,
    valid_to        timestamptz
);

-- C-class messages (train describer)
CREATE TABLE nrod.td_cclass (
    time            timestamptz NOT NULL,
    area_id         text,
    msg_type        text,
    step_from       text,
    step_to         text,
    descr           text
);

CREATE INDEX ON nrod.td_cclass(area_id);

-- Heartbeat messages (train describer)
CREATE TABLE nrod.td_heartbeat (
    time            timestamptz NOT NULL,
    area_id         text NOT NULL PRIMARY KEY,
    msg_type        text,
    report_time     text
);

-- S-class messages (signalling state)
CREATE TABLE nrod.td_sclass (
    time            timestamptz NOT NULL,
    area_id         text,
    item_id         smallint,
    state           boolean
);

CREATE INDEX ON nrod.td_sclass(area_id);


-------------------------------------------------------------------------------
-- TSR feed table
-------------------------------------------------------------------------------

CREATE TABLE nrod.tsr (
    tsrid           int,
    creation_date   timestamptz,
    publish_date    timestamptz,
    route_group     text,
    route_code      text,
    route_order     smallint,
    tsr_ref         text,
    from_location   text,
    to_location     text,
    line_name       text,
    subunit_type    text,
    mileage_from    smallint,
    subunit_from    smallint,
    mileage_to      smallint,
    subunit_to      smallint,
    moving_mileage  boolean,
    passenger_speed smallint,
    freight_speed   smallint,
    valid_from      timestamptz,
    valid_to        timestamptz,
    won_valid_from  timestamptz,
    won_valid_to    timestamptz,
    reason          text,
    requestor       text,
    comments        text,
    direction       text,
    PRIMARY KEY (tsrid, route_code)
);

CREATE INDEX ON nrod.tsr(route_code);


-------------------------------------------------------------------------------
-- Set up TimescaleDB hypertables
-------------------------------------------------------------------------------

SELECT create_hypertable('nrod.trust_activation', 'creation_timestamp');
SELECT create_hypertable('nrod.trust_cancellation', 'canx_timestamp');
SELECT create_hypertable('nrod.trust_movement', 'actual_timestamp');
SELECT create_hypertable('nrod.trust_reinstatement', 'reinstatement_timestamp');
SELECT create_hypertable('nrod.trust_changeorigin', 'coo_timestamp');
SELECT create_hypertable('nrod.trust_changeidentity', 'event_timestamp');
SELECT create_hypertable('nrod.trust_changelocation', 'event_timestamp');
SELECT create_hypertable('nrod.td_cclass', 'time');
SELECT create_hypertable('nrod.td_sclass', 'time');

-- set specific intervals for chunks
SELECT set_chunk_time_interval('nrod.trust_activation', interval '2 month');
SELECT set_chunk_time_interval('nrod.trust_cancellation', interval '3 month');
SELECT set_chunk_time_interval('nrod.trust_movement', interval '1 month');
SELECT set_chunk_time_interval('nrod.trust_reinstatement', interval '6 month');
SELECT set_chunk_time_interval('nrod.trust_changeorigin', interval '6 month');
SELECT set_chunk_time_interval('nrod.trust_changeidentity', interval '6 month');
SELECT set_chunk_time_interval('nrod.trust_changelocation', interval '6 month');
SELECT set_chunk_time_interval('nrod.td_cclass', interval '1 week');
SELECT set_chunk_time_interval('nrod.td_sclass', interval '1 week');

COMMIT;
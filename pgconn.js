var options = {};
var pgp = require("pg-promise")(options);
var cn = "postgres://user:pass@localhost:5432/dbname"; // Postgres connection string
var db = pgp(cn);

module.exports = {
    pgp, db
};

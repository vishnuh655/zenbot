var _ = require("lodash");
var path = require("path");
var minimist = require("minimist");
var version = require("./package.json").version;
var EventEmitter = require("events");

module.exports = function (cb) {
  var zenbot = { version };
  var args = minimist(process.argv.slice(3));
  var conf = {};
  var config = {};
  var overrides = {};

  module.exports.debug = args.debug;

  // 1. load conf overrides file if present
  if (!_.isUndefined(args.conf)) {
    try {
      overrides = require(path.resolve(process.cwd(), args.conf));
    } catch (err) {
      console.error(err + ", failed to load conf overrides file!");
    }
  }

  // 2. load conf.js if present
  try {
    conf = require("./conf");
  } catch (err) {
    console.error(err + ", falling back to conf-sample");
  }

  // 3. Load conf-sample.js and merge
  var defaults = require("./conf-sample");
  _.defaultsDeep(config, overrides, conf, defaults);
  zenbot.conf = config;

  var eventBus = new EventEmitter();
  zenbot.conf.eventBus = eventBus;

  var authStr = "",
    authMechanism,
    connectionString;

  if (zenbot.conf.mongo.username) {
    authStr = encodeURIComponent(zenbot.conf.mongo.username);

    if (zenbot.conf.mongo.password)
      authStr += ":" + encodeURIComponent(zenbot.conf.mongo.password);

    authStr += "@";

    // authMechanism could be a conf.js parameter to support more mongodb authentication methods
    authMechanism = zenbot.conf.mongo.authMechanism || "DEFAULT";
  }

  if (zenbot.conf.mongo.connectionString) {
    connectionString = zenbot.conf.mongo.connectionString;
  } else {
    connectionString =
      "mongodb://" +
      authStr +
      zenbot.conf.mongo.host +
      ":" +
      zenbot.conf.mongo.port +
      "/" +
      zenbot.conf.mongo.db +
      "?" +
      (zenbot.conf.mongo.replicaSet
        ? "&replicaSet=" + zenbot.conf.mongo.replicaSet
        : "") +
      (authMechanism ? "&authMechanism=" + authMechanism : "");
  }

  const Datastore = require("@seald-io/nedb");
  const db = {};
  db.trades = new Datastore({ filename: "data/trades", autoload: true });
  db.resume_markers = new Datastore({
    filename: "data/resume_markers",
    autoload: true,
  });
  db.balances = new Datastore({ filename: "data/balances" });
  db.sessions = new Datastore({ filename: "data/sessions" });
  db.periods = new Datastore({ filename: "data/periods" });
  db.my_trades = new Datastore({ filename: "data/my_trades" });
  db.sim_results = new Datastore({ filename: "data/sim_results" });
  _.set(zenbot, "conf.db", db);
  cb(null, zenbot);

  // db.loadDatabase(function (err) {
  //   if (err) {
  //     console.error("WARNING: MongoDB Connection Error: ", err);
  //     console.error(
  //       "WARNING: without MongoDB some features (such as backfilling/simulation) may be disabled."
  //     );
  //     console.error("Attempted authentication string: " + connectionString);
  //     cb(null, zenbot);
  //     return;
  //   }
  //   _.set(zenbot, "conf.db.mongo", db);
  //   cb(null, zenbot);
  //   // Now commands will be executed
  // });

  // require("mongodb").MongoClient.connect(
  //   connectionString,
  //   { useNewUrlParser: true, useUnifiedTopology: true },
  //   function (err, client) {
  //     if (err) {
  //       console.error("WARNING: MongoDB Connection Error: ", err);
  //       console.error(
  //         "WARNING: without MongoDB some features (such as backfilling/simulation) may be disabled."
  //       );
  //       console.error("Attempted authentication string: " + connectionString);
  //       cb(null, zenbot);
  //       return;
  //     }
  //     var db = client.db(zenbot.conf.mongo.db);
  //     _.set(zenbot, "conf.db.mongo", db);
  //     cb(null, zenbot);
  //   }
  // );
};

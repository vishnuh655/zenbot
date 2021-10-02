var _ = require("lodash");
var path = require("path");
var minimist = require("minimist");
var version = require("./package.json").version;
var EventEmitter = require("events");
var Datastore = require("@seald-io/nedb");

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

  //4. Setup Datastore
  const db = {};
  const dataPath = "data/";
  db.trades = new Datastore({
    filename: dataPath + "trades",
    autoload: true,
  });
  db.resume_markers = new Datastore({
    filename: dataPath + "resume_markers",
    autoload: true,
  });
  db.balances = new Datastore({
    filename: dataPath + "balances",
    autoload: true,
  });
  db.sessions = new Datastore({
    filename: dataPath + "sessions",
    autoload: true,
  });
  db.periods = new Datastore({
    filename: dataPath + "periods",
    autoload: true,
  });
  db.my_trades = new Datastore({
    filename: dataPath + "my_trades",
    autoload: true,
  });
  db.sim_results = new Datastore({
    filename: dataPath + "sim_results",
    autoload: true,
  });
  _.set(zenbot, "conf.db", db);
  cb(null, zenbot);
};

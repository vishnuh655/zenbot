module.exports = function (conf) {
  return {
    getTrades: () => {
      return conf.db.trades;
    },

    getResumeMarkers: () => {
      return conf.db.resume_markers;
    },

    getBalances: () => {
      return conf.db.balances;
    },

    getSessions: () => {
      return conf.db.sessions;
    },

    getPeriods: () => {
      return conf.db.periods;
    },

    getMyTrades: () => {
      return conf.db.my_trades;
    },

    getSimResults: () => {
      return conf.db.sim_results;
    },
  };
};

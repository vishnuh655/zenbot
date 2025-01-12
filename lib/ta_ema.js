var talib = require("talib");

module.exports = function ta_ema(s, length) {
  return new Promise(function (resolve, reject) {
    // create object for talib. only close is used for now but rest might come in handy
    if (!s.marketData) {
      s.marketData = { open: [], close: [], high: [], low: [], volume: [] };
    }

    if (s.lookback.length > s.marketData.close.length) {
      for (
        var i = s.lookback.length - s.marketData.close.length - 1;
        i >= 0;
        i--
      ) {
        s.marketData.close.push(s.lookback[i].close);
      }

      //dont calculate until we have enough data
      if (s.marketData.close.length >= length) {
        //fillup marketData for talib.
        //this might need improvment for performance.
        //for (var i = 0; i < length; i++) {
        //  s.marketData.close.push(s.lookback[i].close);
        //}
        //fillup marketData for talib.
        let tmpMarket = s.marketData.close.slice();

        //add current period
        tmpMarket.push(s.period.close);

        //doublecheck length.
        if (tmpMarket.length >= length) {
          talib.execute(
            {
              name: "EMA",
              startIdx: 0,
              endIdx: tmpMarket.length - 1,
              inReal: tmpMarket,
              optInTimePeriod: length,
            },
            function (err, result) {
              if (err) {
                console.log(err);
                reject(err, result);
                return;
              }

              //Result format: (note: outReal can have multiple items in the array)
              // {
              //   begIndex: 8,
              //   nbElement: 1,
              //   result: { outReal: [ 1820.8621111111108 ] }
              // }
              resolve({
                outReal: result.result.outReal[result.nbElement - 1],
              });
            }
          );
        }
      } else {
        resolve();
      }
    }
  });
};

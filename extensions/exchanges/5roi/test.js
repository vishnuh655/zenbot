var defaults = require("../../../conf-sample");
const fiveRoiTest = require(`./exchange`)(defaults);

fiveRoiTest.getTrades(
  { product_id: "ADA-USDT", from: 1632479335176 },
  function (term, logTerm) {
    console.log(logTerm);
  }
);

const opts = { product_id: "ADA-USDT", from: 1632479335176 };
// const opts = {
//   product_id: "ADA-USDT",
//   order_type: "taker",
//   size: 10,
// };

// const opts = {
//   order_id: "44124546",
// };

// fiveRoiTest.cancelOrder({
//   order_id: 1234556,
// });

// fiveRoiTest.buy(opts, function () {
//   console.log("done");
// });

// fiveRoiTest.getOrder(opts);
//   { product_id: "ADA-USDT", from: 1632479335176 },
//   function (term, logTerm) {
//     console.log(logTerm);
//   }
//   ();

// fiveRoiTest.getQuote({ product_id: "ADA-USDT" });

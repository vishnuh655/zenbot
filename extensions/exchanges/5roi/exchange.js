var request = require("micro-request"),
  minimist = require("minimist"),
  moment = require("moment"),
  CryptoJs = require("crypto-js"),
  n = require("numbro"),
  // eslint-disable-next-line no-unused-vars
  colors = require("colors");

module.exports = function container(conf) {
  var s = {
    options: minimist(process.argv),
  };
  var so = s.options;

  var baseApi = "https://api.5roi.com/";

  var public_client, authed_client;
  // var recoverableErrors = new RegExp(/(ESOCKETTIMEDOUT|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|API:Invalid nonce|API:Rate limit exceeded|between Cloudflare and the origin web server)/)
  var recoverableErrors = new RegExp(
    /(ESOCKETTIMEDOUT|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|API:Invalid nonce|between Cloudflare and the origin web server|The web server reported a gateway time-out|The web server reported a bad gateway|525: SSL handshake failed|Service:Unavailable|api.5roi.com \| 522:)/
  );
  var silencedRecoverableErrors = new RegExp(/(ESOCKETTIMEDOUT|ETIMEDOUT)/);

  function publicClient() {
    if (!public_client) {
      public_client = {
        api: (endpoint, args, cb) => {
          switch (endpoint) {
            case "Trades":
              request(
                baseApi + "openapi/quote/v1/trades?symbol=" + args.pair,
                function (err, res, body) {
                  cb(err, res, body);
                }
              );
              break;
            case "Ticker":
              request(
                baseApi + "openapi/quote/v1/ticker/24hr?symbol=" + args.pair,
                function (err, res, body) {
                  cb(err, res, body);
                }
              );
              break;
            default:
              throw new Error("Invalid Endpoint");
          }
        },
      };
    }
    return public_client;
  }

  function authedClient() {
    if (!authed_client) {
      // if (
      //   !conf.fiveRoi ||
      //   !conf.fiveRoi.key ||
      //   conf.fiveRoi.key === "YOUR-API-KEY"
      // ) {
      //   throw new Error("please configure your 5roi credentials in conf.js");
      // }
      // const authHeader = {
      //   "X-BH-APIKEY":
      //     "YeOohJl6R4rAD8VqrfN9C1NPljcrIafEIUUspXZ5ugiLb3j2TLbCAMUnPeNsuX0b",
      // };
      const authHeader = {
        "X-BH-APIKEY":
          "GadJmt3QjC1quXNqqKiMDSa94TtEFHr5N8yeUwL8TJkTvFokWGORgCtwLdu52Gtd",
      };
      const serializeParams = (body) => {
        var str = [];
        for (var p in body)
          if (body.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(body[p]));
          }
        return str.join("&");
      };

      const generateSignature = (body) =>
        CryptoJs.HmacSHA256(
          serializeParams(body),
          "rAjYXPxHNvplH40ERH00Tmae4fYALWvzV31Uubz647acMGbHeN2JPKhZjnRMiiAV"
        ).toString(CryptoJs.enc.Hex);

      const generateQueryParams = (data, withSignature = true) => {
        return withSignature
          ? serializeParams({
              signature: generateSignature(data),
              ...data,
            })
          : serializeParams(data);
      };

      authed_client = {
        api: (endpoint, args, cb) => {
          switch (endpoint) {
            case "Balance":
              request(
                baseApi + "/openapi/v1/account?" + generateQueryParams(args),
                { headers: authHeader },
                function (err, res, body) {
                  cb(err, res, body);
                }
              );
              break;
            case "CancelOrder":
              request.delete(
                baseApi + "/openapi/v1/order?" + generateQueryParams(args),
                { headers: authHeader },
                function (err, res, body) {
                  cb(err, res, body);
                }
              );
              break;
            case "AddOrder":
              var queryParams = {
                symbol: args.symbol,
                side: args.side,
                type: args.type,
                quantity: args.quantity,
              };
              var bodyParams = {
                timestamp: args.timestamp,
              };
              request.post(
                baseApi +
                  "/openapi/v1/order?" +
                  generateQueryParams(queryParams, false),
                {
                  headers: authHeader,
                  data: {
                    signature: generateSignature(args),
                    ...bodyParams,
                  },
                },
                function (err, res, body) {
                  cb(err, res, body);
                }
              );
              break;
            case "QueryOrders":
              request(
                baseApi + "/openapi/v1/order?" + generateQueryParams(args),
                {
                  headers: authHeader,
                },
                function (err, res, body) {
                  cb(err, res, body);
                }
              );
              break;
            default:
              throw new Error("Invalid Endpoint");
          }
        },
      };
    }
    return authed_client;
  }

  // This is to deal with a silly bug where kraken doesn't use a consistent definition for currency
  // with certain assets they will mix the use of 'Z' and 'X' prefixes
  function joinProductFormatted(product_id) {
    return product_id.split("-").join("");
  }

  function retry(method, args, error) {
    let timeout, errorMsg;
    if (error.message.match(/API:Rate limit exceeded/)) {
      timeout = 10000;
    } else {
      timeout = 150;
    }

    // silence common timeout errors
    if (so.debug || !error.message.match(silencedRecoverableErrors)) {
      if (error.message.match(/between Cloudflare and the origin web server/)) {
        errorMsg =
          "Connection between Cloudflare CDN and api.kraken.com failed";
      } else if (
        error.message.match(/The web server reported a gateway time-out/)
      ) {
        errorMsg = "Web server Gateway time-out";
      } else if (error.message.match(/The web server reported a bad gateway/)) {
        errorMsg = "Web server bad Gateway";
      } else if (error.message.match(/525: SSL handshake failed/)) {
        errorMsg = "SSL handshake failed";
      } else if (error.message.match(/Service:Unavailable/)) {
        errorMsg = "Service Unavailable";
      } else if (error.message.match(/api.kraken.com \| 522:/)) {
        errorMsg = "Generic 522 Server error";
      } else {
        errorMsg = error;
      }
      console.warn(
        (
          "\nKraken API warning - unable to call " +
          method +
          " (" +
          errorMsg +
          "), retrying in " +
          timeout / 1000 +
          "s"
        ).yellow
      );
    }
    setTimeout(function () {
      exchange[method].apply(exchange, args);
    }, timeout);
  }

  var orders = {};

  var exchange = {
    name: "kraken",
    historyScan: "forward",
    makerFee: 0.16,
    takerFee: 0.26,
    // The limit for the public API is not documented, 1750 ms between getTrades in backfilling seems to do the trick to omit warning messages.
    backfillRateLimit: 3500,

    getProducts: function () {
      return require("./products.json");
    },

    getTrades: function (opts, cb) {
      var func_args = [].slice.call(arguments);
      var client = publicClient();
      var args = {
        pair: joinProductFormatted(opts.product_id),
      };
      if (opts.from) {
        args.since = Number(opts.from) * 1000000;
      }

      client.api("Trades", args, function (error, body, data) {
        if (error && error.message.match(recoverableErrors)) {
          return retry("getTrades", func_args, error);
        }
        if (error) {
          console.error("\nTrades error:".red);
          console.error(error);
          return cb(null, []);
        }
        if (body.error) {
          //TODO: Validate body object an call callback function
          console.log(body.error);
          // return cb(data.error.join(","));
        }

        var trades = [];
        if (data) {
          //TODO: Validate data object
          data.forEach((trade) => {
            if (!opts.from || Number(opts.from) < moment.unix(trade.time)) {
              trades.push({
                trade_id: trade.time + trade.qty + trade.price,
                time: moment.unix(trade.time).valueOf(),
                size: parseFloat(trade.qty),
                price: parseFloat(trade.price),
                side: trade.isBuyerMaker ? "buy" : "sell",
              });
            }
          });
        }
        cb(null, trades);
      });
    },

    getBalance: function (opts, cb) {
      var args = [].slice.call(arguments);
      var client = authedClient();
      var apiArgs = {
        timestamp: new Date().valueOf(),
      };
      client.api("Balance", apiArgs, function (error, body, data) {
        //TODO: To Be Tested
        var balance = {
          asset: "0",
          asset_hold: "0",
          currency: "0",
          currency_hold: "0",
        };

        if (error) {
          if (error.message.match(recoverableErrors)) {
            return retry("getBalance", args, error);
          }
          console.error("\ngetBalance error:".red);
          console.error(error);
          return cb(error);
        }

        if (data) {
          data.balances.forEach((asset) => {
            if (asset.asset == opts.asset) {
              balance.asset = n(asset.free).format("0.00000000");
              balance.asset_hold = n(asset.locked).format("0.00000000");
            } else if (asset.asset == opts.currency) {
              balance.currency = n(asset.free).format("0.00000000");
              balance.currency_hold = n(asset.locked).format("0.00000000");
            }
          });
        }
        cb(null, balance);
      });
    },

    getQuote: function (opts, cb) {
      var args = [].slice.call(arguments);
      var client = publicClient();
      var pair = joinProductFormatted(opts.product_id);
      client.api(
        "Ticker",
        {
          pair: pair,
        },
        function (error, body, data) {
          if (error) {
            if (error.message.match(recoverableErrors)) {
              return retry("getQuote", args, error);
            }
            console.error("\ngetQuote error:".red);
            console.error(error);
            return cb(error);
          }
          if (!data) {
            return cb(data);
          }
          cb(null, {
            bid: data.bestBidPrice,
            ask: data.bestAskPrice,
          });
        }
      );
    },

    cancelOrder: function (opts, cb) {
      var args = [].slice.call(arguments);
      var client = authedClient();
      client.api(
        "CancelOrder",
        {
          orderId: opts.order_id,
          timestamp: new Date().valueOf(),
        },
        function (error, body, data) {
          if (error) {
            if (error.message.match(recoverableErrors)) {
              return retry("cancelOrder", args, error);
            }
            console.error("\ncancelOrder error:".red);
            console.error(error);
            return cb(error);
          }
          // if (data.error.length) {
          //   return cb(data.error.join(","));
          // }
          if (so.debug) {
            console.log("\nFunction: cancelOrder");
            console.log(data);
          }
          cb(error);
        }
      );
    },

    trade: function (type, opts, cb) {
      var args = [].slice.call(arguments);
      var client = authedClient();
      var params = {
        symbol: joinProductFormatted(opts.product_id),
        side: type,
        type: opts.order_type === "taker" ? "market" : "limit",
        quantity: opts.size,
        timestamp: new Date().valueOf(),
      };
      // if (opts.post_only === true && params.queryArgs.type === "limit") {
      //   params.oflags = "post";
      // }
      if ("price" in opts) {
        params.price = opts.price;
      }
      if (so.debug) {
        console.log("\nFunction: trade");
        console.log(params);
      }
      client.api("AddOrder", params, function (error, body, data) {
        if (error && error.message.match(recoverableErrors)) {
          return retry("trade", args, error);
        }
        var order = {
          id: data && data.result ? data.orderId : null,
          status: "open",
          price: opts.price,
          size: opts.size,
          created_at: new Date().getTime(),
          filled_size: "0",
        };

        // if (opts.order_type === "maker") {
        //   order.post_only = !!opts.post_only;
        // }

        if (so.debug) {
          console.log("\nData:");
          console.log(data);
          console.log("\nOrder:");
          console.log(order);
          console.log("\nError:");
          console.log(error);
        }

        //TODO: Exception Handling
        if (error) {
          if (error.message.match(/Order:Insufficient funds$/)) {
            order.status = "rejected";
            order.reject_reason = "balance";
            return cb(null, order);
          } else if (error.message.length) {
            console.error("\nUnhandeld AddOrder error:".red);
            console.error(error);
            order.status = "rejected";
            order.reject_reason = error.message;
            return cb(null, order);
          } else if (data.error.length) {
            console.error("\nUnhandeld AddOrder error:".red);
            console.error(data.error);
            order.status = "rejected";
            order.reject_reason = data.error.join(",");
          }
        }

        orders["~" + data.orderId] = order;
        cb(null, order);
      });
    },

    buy: function (opts, cb) {
      exchange.trade("buy", opts, cb);
    },

    sell: function (opts, cb) {
      exchange.trade("sell", opts, cb);
    },

    getOrder: function (opts, cb) {
      var args = [].slice.call(arguments);
      var order = orders["~" + opts.order_id];
      if (!order) return cb(new Error("order not found in cache"));
      var client = authedClient();
      var params = {
        orderId: opts.order_id,
        timestamp: new Date().valueOf(),
      };
      client.api("QueryOrders", params, function (error, body, data) {
        if (error) {
          if (error.message.match(recoverableErrors)) {
            return retry("getOrder", args, error);
          }
          console.error("\ngetOrder error:".red);
          console.error(error);
          return cb(error);
        }
        // if (data.error.length) {
        //   return cb(data.error.join(","));
        // }
        if (so.debug) {
          console.log("\nfunction: QueryOrders");
          console.log(data);
        }

        if (!data) {
          return cb("Order not found");
        }

        if (data.status === "REJECTED") {
          order.status = "rejected";
          order.reject_reason = "Rejected";
          order.done_at = new Date().getTime();
          order.filled_size = "0.00000000";
          return cb(null, order);
        }

        if (data.status === "FILLED" || data.status === "CANCELED") {
          order.status = "done";
          order.done_at = new Date().getTime();
          order.filled_size = n(data.executedQty).format("0.00000000");
          order.price = n(data.price).format("0.00000000");
          return cb(null, order);
        }

        cb(null, order);
      });
    },

    // return the property used for range querying.
    getCursor: function (trade) {
      return trade.time || trade;
    },
  };
  return exchange;
};

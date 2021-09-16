const normalizeSelector = require("./normalize-selector");
module.exports = function (selector) {
  let rtn;

  if (typeof selector == "string") {
    const normalizedSelector = normalizeSelector(selector);

    const exchangeId = normalizedSelector.split(".")[0];
    const pairId = normalizedSelector.split(".")[1];
    const asset = pairId.split("-")[0];
    const currency = pairId.split("-")[1];

    rtn = {
      exchange_id: exchangeId,
      product_id: pairId,
      asset: asset,
      currency: currency,
      normalized: normalizedSelector,
    };
  } else if (typeof selector == "object") {
    rtn = selector;
  }

  return rtn;
};

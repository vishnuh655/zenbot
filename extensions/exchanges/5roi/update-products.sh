#!/usr/bin/env node
const request = require('micro-request')

request('https://api.5roi.com/openapi/v1/brokerInfo', {headers: {'User-Agent': 'zenbot/4'}}, function (err, resp, data) {
  var products = []
  const markets = data.symbols

  var products = markets.map(function (market) {
    const filters = market.filters
    const price_filter = filters.find(f => f.filterType === 'PRICE_FILTER')
    const lot_size_filter = filters.find(f => f.filterType === 'LOT_SIZE')
    const notional_filter = filters.find(f => f.filterType === 'MIN_NOTIONAL')

    // NOTE: price_filter also contains minPrice and maxPrice
    return {
      id: market.symbol,
      asset: market.baseAsset,
      currency: market.quoteAsset,
      min_size: lot_size_filter.minQty,
      max_size: lot_size_filter.maxQty,
      min_total: notional_filter.minNotional,
      increment: price_filter.tickSize,
      asset_increment: lot_size_filter.stepSize,
      label: market.baseAsset + '/' + market.quoteAsset
    }
  })

  var target = require('path').resolve(__dirname, 'products.json')
  require('fs').writeFileSync(target, JSON.stringify(products, null, 2))
  console.log('wrote', target)
  process.exit()
})

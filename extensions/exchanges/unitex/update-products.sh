#!/usr/bin/env node
const request = require('micro-request')

request('https://pub-new.unitex.one/api/v1/market/list', {headers: {'User-Agent': 'zenbot/4'}}, function (err, resp, data) {
  var products = []
  const markets = data.list
  console.log(data);
  markets.forEach(function (market) {
    // NOTE: price_filter also contains minPrice and maxPrice
    products.push(
      {
      id: market.id,
      asset: market.leftCurrencyCode,
      currency: market.rightCurencyCode,
      min_size: market.minAmount,
      max_size: market.maxAmount,
      min_total: market.minAmount,
      increment: '0.000001',
      asset_increment: '0.000001',
      label: market.leftCurrencyCode + '/' + market.rightCurencyCode
    }
    )
  })

  var target = require('path').resolve(__dirname, 'products.json')
  require('fs').writeFileSync(target, JSON.stringify(products, null, 2))
  console.log('wrote', target)
  process.exit()
})

## Changelog

- [v4.1.0](https://github.com/carlos8f/zenbot/releases/tag/v4.1.0) (Latest)
  - more indicators
  - more strategies
  - more exchanges
  - too many bug fixes to list here
  - web UI
  - Travis
  - Docker automated builds
  - Automated tests
- [v4.0.5](https://github.com/carlos8f/zenbot/releases/tag/v4.0.5)
  - handle insufficient funds errors from gdax
  - new trend_ema defaults adjusted for latest btc movements: 20m period, neutral_rate=0
  - include more data in sim output
  - remove rarely useful trend_ema options
  - avoid abort in trader on failed getTrades()
- v4.0.4
  - debugging for polo odd results
  - sim: simplify and correct makerFee assessment
  - fix conf path in API credentials errors
  - fix order total under 0.0001 error on polo
  - Docker: extend README slightly (thanks [@DeviaVir](https://github.com/deviavir) and [@egorbenko](https://github.com/egorbenko))
  - docker-compose: do not expose mongodb by default! (thanks [@DeviaVir](https://github.com/deviavir))
- v4.0.3
  - fix for docker mongo host error
  - link for new Discord chat!
  - fix polo crash on getOrder weird result
  - fix oversold_rsi trigger while in preroll
  - fix polo "not enough..." errors
  - fancy colors for price report
  - display product id in report
  - fix poloniex backfill batches too big, mongo timeouts
  - fix cursorTo() crash on some node installs
  - memDump for debugging order failures
  - fix column spacing on progress report
- v4.0.2
  - minor overhaul to trend_ema strat - added whipsaw filtering via std. deviation (`--neutral_rate=auto`)
  - trim preroll of sim result graph
- v4.0.1
  - Added .dockerignore (thanks [@sulphur](https://github.com/sulphur))
  - fix crashing on mongo timeout during backfill
  - fix gaps in poloniex backfill
  - default backfill days 90 -> 14

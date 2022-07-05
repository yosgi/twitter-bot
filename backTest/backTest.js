
// back test accroding to the kline data
const moment = require('moment');
var Twit = require('../twit/lib/twitter')
const log4js = require("log4js");
log4js.configure({
  appenders: { log: { type: "file", filename: "kline.log" } },
  categories: { default: { appenders: ["log"], level: "error" } }
});
const logger = log4js.getLogger("log");
var T = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_CONSUMER_SECRET,
  timeout_ms:           2*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})
const  ccxt = require ('ccxt')
const  HttpsProxyAgent = require ('https-proxy-agent')
const config = require('config')
const proxy = config.proxy
const agent = proxy ? new HttpsProxyAgent (proxy) : ''
const _SYMBOL = 'DOGEUSDT'
const exchangeId = 'binance'
const Twitter = require('../db/twitter')
, exchangeClass = ccxt[exchangeId]
,  exchange = new exchangeClass ({
  'apiKey': process.env.EXCHANGE_APIKEY,
  'secret': process.env.EXCHANGE_APISECRET,
  'timeout': 10000,
  'enableRateLimit': true, 
  agent
})

// 进行每次推特和K线的关联性回测
var start =  async () => {
    var total_profit = 0,win= 0,breakup = 0,total_reduce = 0
    var searchK = async function (time) {
      var res = await exchange.publicGetKlines({startTime:time,symbol:_SYMBOL,interval:'1m',limit:1})
      res.forEach((v) => {
        var [start,startPrice,hight,low,endPrice,num,end] = v
        var profit = (endPrice - startPrice) / startPrice * 100
        var max_profit = (hight - startPrice) / startPrice * 100
        var max_reduce = (startPrice - low) / startPrice * 100
        if (profit > 0) {
          win ++ 
        }
        if (max_reduce > 0) {
          total_reduce += max_reduce
        }
        if (max_reduce > 1) {
          breakup ++
        }
        logger.fatal(`开盘时间` + moment(start).format('YYYY-MM-DD HH:mm:ss'))
        logger.fatal(`开盘价格 ${startPrice}`)
        logger.fatal(`收盘时间` + moment(end).format('YYYY-MM-DD HH:mm:ss'))
        logger.fatal(`收盘价格 ${endPrice}`)
        logger.fatal(`最低价格 ${low}`)
        logger.fatal(`收盘收益 ${profit.toFixed(3)}` )
        logger.fatal(`最高收益 ${max_profit.toFixed(3)}` )
        logger.fatal(`最高回撤 ${max_reduce.toFixed(3)}` )
        total_profit += profit
        logger.fatal(`----------------------------`)
      })
    }
    var count = 0
    var diff = 10
    var data = await Twitter.find({})
        for(let index = 0 ; index < data.length ; index ++) {
          let v = data[index]
          logger.fatal(`start check twitter ${index}`)
          if (v.relevance > 0) {
              count ++
              var twitter_time = moment (new Date(v.created_at))
              logger.fatal(`twitter time :${twitter_time.format('YYYY-MM-DD HH:mm:ss')}`)
              logger.fatal(v.text)
              var time = moment (twitter_time).add(diff,'m').valueOf()
              await searchK(time)
          }
        }
        var average = total_profit / count
        logger.fatal(`共测试 ${count} 条相关推特，距离${diff} 分钟内平均涨幅 ${average.toFixed(3)},胜率${win / count },平均最高回撤 ${ (total_reduce/ count).toFixed(3)  }, 100 * 杠杆强平率${ breakup / count * 100}`)
        console.log(`测试结束，请查看kline.log`)
}

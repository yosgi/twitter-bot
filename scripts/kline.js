const  ccxt = require ('ccxt')
const  HttpsProxyAgent = require ('https-proxy-agent')
const config = require('config')
const log4js = require("log4js");
const moment = require('moment');
const proxy = config.proxy
log4js.configure({
    appenders: { cheese: { type: "file", filename: "cheese.log" } },
    categories: { default: { appenders: ["cheese"], level: "error" } }
});
const logger = log4js.getLogger("cheese");
const agent = new HttpsProxyAgent (proxy)
async function  kline () {
    const exchangeId = 'binance'
        , exchangeClass = ccxt[exchangeId]
        ,  exchange = new exchangeClass ({
            'apiKey': process.env.EXCHANGE_APIKEY,
            'secret': process.env.EXCHANGE_APISECRET,
            'timeout': 10000,
            'enableRateLimit': true, 
            agent
})
    console.log (`name ${exchange.id}`)
    try {
            // await exchange.public_get_klines({})
            var res = await exchange.fetchOHLCV ('DOGE/USDT', '1s')
            res.forEach((v)=> {
                var [time,start,end] = v
                console.log(`${moment(time).format('YYYY MM DD hh:mm:ss')} , price: ${start},${end}`)
            })
    } catch (error) {
        console.log(error)
    }
};
kline()

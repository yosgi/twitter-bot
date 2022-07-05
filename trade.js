const  ccxt = require ('ccxt')
const  HttpsProxyAgent = require ('https-proxy-agent')
const config = require('config')
const log4js = require("log4js");
const proxy = config.proxy
log4js.configure({
    appenders: { cheese: { type: "file", filename: "cheese.log" } },
    categories: { default: { appenders: ["cheese"], level: "error" } }
});
const logger = log4js.getLogger("cheese");
const agent = proxy ? new HttpsProxyAgent (proxy) : ''
const _Number = 5000
const _SYMBOL = 'DOGE/USDT'
const exchangeId = 'binance'
        , exchangeClass = ccxt[exchangeId]
        , exchange = new exchangeClass ({
            'apiKey': process.env.EXCHANGE_APIKEY,
            'secret': process.env.EXCHANGE_APISECRET,
            'timeout': 10000,
            'enableRateLimit': true, 
            agent
})
console.log(`交易所名称 ${exchange.id}`)
async function  trade (flag) {
    try {
        var ticker = await (exchange.fetchTicker (_SYMBOL))
        var curPrice = ticker.last
        var buyPrice = curPrice * 1.0015.toFixed(5)
        var sellPrice = curPrice * 1.020.toFixed(5)
        if (flag) {
            console.log(`现价${curPrice}`)
            logger.fatal(`开始下单`);
            logger.fatal(`现价${curPrice}`);
            logger.fatal(`现货买入价格${buyPrice}`);
            logger.fatal(`现货卖出价格${sellPrice}`);
            let buyOrder = await exchange.createLimitBuyOrder (_SYMBOL, _Number,buyPrice)
            let sellOrder = await exchange.createLimitSellOrder (_SYMBOL,_Number,sellPrice)
            end(buyOrder,sellOrder,exchange)
        } else {
            console.log('暂不下单')
        }
    } catch (error) {
        logger.fatal(error)
    }
};
async function end(buyOrder,sellOrder,exchange) {
    // 55s 后强制撤销委托，强制市价卖出
    let buyId = buyOrder.info.orderId
    let sellId = sellOrder.info.orderId
    setTimeout( async function () {
        try {
            let buy = await exchange.fetchOrder(buyId,_SYMBOL)
            if (buy.info.status !== 'FILLED') {    
                await exchange.cancelOrder (buyId,_SYMBOL)
                await exchange.cancelOrder (sellId,_SYMBOL)
                logger.fatal(`没有成交，取消所有的挂单`);
            }
            let sell = await exchange.fetchOrder (sellId,_SYMBOL)
            if(buy.info.status == 'FILLED' && sell.info.status !== 'FILLED') {
                exchange.createMarketSellOrder(_SYMBOL,_Number)
                let ticker = await (exchange.fetchTicker (_SYMBOL))
                var curPrice = ticker.last
                logger.fatal(`成交但是没有卖出，直接市价${curPrice}卖出`);
            }
        } catch (error) {
            logger.fatal(error)
        }
    },  30 * 1000)
}
exports.start = trade

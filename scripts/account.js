const  ccxt = require ('ccxt')
const  HttpsProxyAgent = require ('https-proxy-agent')
const config = require('config')
const proxy = config.proxy
const params = {"symbol":"DOGEUSDT"}
const agent = proxy ? new HttpsProxyAgent (proxy) : ''
const log4js = require("log4js");
log4js.configure({
    appenders: { contact: { type: "file", filename: "contact.log" } },
    categories: { default: { appenders: ["contact"], level: "error" } }
});
const logger = log4js.getLogger("contact");
class Account {
    constructor(name,exchangeId,apiKey,secret,balence,disabled,leverage) {
        const exchangeClass = ccxt[exchangeId]
        , exchange = new exchangeClass ({
            'apiKey': apiKey,
            'secret': secret,
            'timeout': 60000,
            'enableRateLimit': true,
            agent
        })
        this.exchange = exchange;
        this.apiKey = apiKey;
        this.secret = secret;
        this.name = name
        this.balence = balence
        this.disabled = disabled
        this.leverage = leverage
    }
    // 获取合约USDT持仓
    // get position 
    async getUSDT() {
        let res = await this.exchange.fapiPrivateGetBalance()
        let USDT_OBJ = res.find((v) => {
            return v.asset === 'USDT'
        })
        return USDT_OBJ.withdrawAvailable
    }   
    // 获取账号所有数据
    // get all data
    async getAllInfo() {
        let res = await this.exchange.fapiPrivateV2GetAccount()
        return res
    }
    // 调整开仓倍率
    // change leverage
    async maxleverage(leverage) {
        let res = await this.exchange.fapiPrivatePostLeverage({leverage,...params})
    }
    async getleverage() {
        let res = await this.exchange.fapiPrivateV2GetAccount()
        let {positions} = res
        let item = positions.find((v) => {
            return v.symbol === 'DOGEUSDT'
        })
        console.log(item)
        return item.leverage

    }
    // 查询开仓方向
    // check dual side
    async getDual() {
        let res = await this.exchange.fapiPrivateGetPositionSideDual()
        return res.dualSidePosition;
    }
    // 调整开仓方向
    // change dual side
    async changeDual(dualSidePosition) {
        let res = await this.exchange.fapiPrivatePostPositionSideDual({dualSidePosition})
    }
    async contract({symbol,profit,withdraw,cancelTime,ratio} = {symbol:'DOGEUSDT',profit:0.01,withdraw:0.002,cancelTime:15,ratio:1}) {
        if (this.disabled) return 
        console.log(symbol,profit,withdraw,cancelTime)
        try {
            // var bid = await this.exchange.fapiPublicGetTickerBookTicker({"symbol":"DOGEUSDT"})
            var ticker = await this.exchange.fapiPublicGetTickerPrice({"symbol":symbol})
            var curPrice = ticker.price
            var sellPrice = (curPrice * (1 + profit)).toFixed(6)
            var stopPrice = (curPrice * (1 - withdraw)).toFixed(6)
            var quantity =  (this.balence / curPrice * 0.8 * this.leverage * ratio).toFixed(0) 
            // console.log(`最优价格${bid.bidPrice}`)
            console.log(`${symbol}合约现价${curPrice}`)
            console.log(`可开数字${quantity}`)
            logger.fatal(`${this.name}开启合约`);
            logger.fatal(`${symbol}现价${curPrice}`);
            logger.fatal(`委托买入${curPrice}`);
            logger.fatal(`委托止盈${sellPrice}`);
            logger.fatal(`委托止损${stopPrice}`);
            logger.fatal(`数量 ${quantity}`);
            var list = []
            // 市价下单
            list.push({"side":"BUY","quantity":quantity + "" ,"type":"MARKET","symbol":symbol})
            // 止盈
            list.push({"side":"SELL","stopPrice":sellPrice,"type":'TAKE_PROFIT_MARKET',"closePosition":"true","symbol":symbol})
            // 止损
            list.push({"side":"SELL","stopPrice":stopPrice,"type":'STOP_MARKET',"closePosition":"true","symbol":symbol})
            await this.exchange.fapiPrivatePostBatchOrders({"batchOrders":JSON.stringify(list)})
            setTimeout( async () => {
                await this.exchange.fapiPrivatePostOrder({"side":"SELL","quantity":quantity,"reduceOnly":true,"type":"MARKET","symbol":symbol})
                logger.fatal(`全部平仓`);
                await this.exchange.fapiPrivateDeleteAllOpenOrders({"symbol":symbol})
                logger.fatal(`全部撤单`);
            },cancelTime * 1000)
        } catch (error) {
            logger.fatal(`${error}`)
        }
    }
    async getSymbols() {
        var info = await this.exchange.fapiPublicGetExchangeInfo()
        return info.symbols
    }
    async endContract(){
        try {
            // await this.exchange.fapiPrivatePostOrder({side:"SELL",stopPrice:sellPrice,type:'TAKE_PROFIT_MARKET',closePosition:true,...params})
            // logger.fatal(`全部平仓`);
            // await this.exchange.fapiPrivateDeleteAllOpenOrders({...params})
            // logger.fatal(`全部撤销`);
        } catch (error) {
            logger.fatal(`${error}`)
        }
    }
}
module.exports = Account;
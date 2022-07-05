// contract arbitrage strategy
const  ccxt = require ('ccxt')
const config = require('../config/default.json')
const  HttpsProxyAgent = require ('https-proxy-agent')
const { v4: uuidv4 } = require('uuid');
const proxy = config.proxy
const agent = proxy ? new HttpsProxyAgent (proxy) : '';
const User = require("../db/user"); 
const exchangeId = 'bybit'
        , exchangeClass = ccxt[exchangeId]
        , exchange = new exchangeClass ({
            'apiKey': process.env.EXCHANGE_APIKEY,
            'secret': process.env.EXCHANGE_APISECRET,
            'timeout': 50000,
            'enableRateLimit': true,
        agent
})

exchange.setSandboxMode (true)
const main =  async () => {
    var pre = await exchange.privateLinearGetFundingPredictedFunding({symbol:"BTCUSDT"})
    var prev = await exchange.publicGetPublicLinearFundingPrevFundingRate({symbol:"BTCUSDT"})
    console.log(pre)
    console.log(prev)
}
async function checkPro () {
    var symbols = ["SANDUSDT","BTCUSDT","ETHUSDT","BCHUSDT","SOLUSDT","XRPUSDT","DOTUSDT","ADAUSDT","DOGEUSDT"]
    try {
        for(let i = 0 ; i < symbols.length ; i ++) {
            var symbol = symbols[i]
            var prev = await exchange.publicGetPublicLinearFundingPrevFundingRate({symbol})
            console.log(prev.result.symbol + prev.result.funding_rate)
        }
    } catch (error) {
        console.log(error)
    }
}
async function balence() {
    var spotBalence= await exchange.privateGetSpotV1Account()
    var futureBalence  = await exchange.privateGetV2PrivateWalletBalance()
    var spotUSDT = spotBalence.result.balances.find((v)=> {
        return v.coin == 'USDT'
    }).total - 0
    var futureUSDT = futureBalence.result.USDT.available_balance - 0;
    console.log(spotUSDT,futureUSDT)
    var reduce = spotUSDT - (spotUSDT + futureUSDT) / 2 ;
    if (Math.abs(reduce) <= 0.1) {
        await trade('BTCUSDT',1000)
        return 
    } 
    await exchange.privatePostAssetV1PrivateTransfer({ 
    from_account_type: reduce > 0 ? "SPOT" : "CONTRACT",
    to_account_type:reduce> 0? "CONTRACT" : "SPOT",
    amount:Math.abs(reduce).toFixed(3) + "",coin:"USDT",transfer_id:uuidv4()})
    console.log("account balenced !")
    await trade('BTCUSDT',1000)
}
async function trade(symbol = "BTCUSDT",amount) {
    const   {result} = await exchange.publicGetPublicLinearRecentTradingRecords({symbol,limit:"10"})
    const curPrice = result[0].price;
    const orderQty = amount / curPrice;
    console.log(orderQty)
    let LinearStatus = await exchange.privateLinearPostOrderCreate(
    {
        side:'Sell',
        symbol,
        order_type:'Market',
        qty:orderQty.toFixed(4),
        time_in_force:'PostOnly',
        close_on_trigger:false,
        reduce_only:false,
    })
    console.log(LinearStatus.result)
    const {price,qty} = LinearStatus.result;
    // // 这里的  qty 是  usdt 数目
    console.log(price * qty)
    let spotStatus = await exchange.privatePostSpotV1Order({symbol,qty:(price * qty).toFixed(1),side:'Buy',type:'Market'})
    console.log(spotStatus.result)
    const {origQty} = spotStatus.result;
    //await User.findOneAndUpdate({key:'nJwMZ07LjV03b13uUS'},{symbol,linearQty:qty,spotQty:origQty})
    
}

async function checkAndSell(symbol = "BTCUSDT",) {
    let LinearStatus = await exchange.privateLinearPostOrderCreate(
        {
            side:'Buy',
            symbol,
            order_type:'Market',
            qty:0.03,
            time_in_force:'PostOnly',
            close_on_trigger:false,
            reduce_only:true,
        })
    let spotStatus = await exchange.privatePostSpotV1Order({symbol,qty:(price * qty).toFixed(1),side:'Buy',type:'Market'})
    console.log(spotStatus.result)
    console.log(LinearStatus.result)
}


balence().catch(e => {
    console.log(e)
})
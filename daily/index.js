const User = require("../db/user"); 
const Account = require('../account');
const BinanceSymbol = require("../db/binanceSymbol"); 
// 一小时更新一次用户的持仓,开仓倍率，调整持仓方向
// update position hourly and update position multiple
async function updatePosition() {
    var users = await User.find({})
    for(let index = 0 ; index < users.length; index ++) {
        try {
            let {name,key,secret,exchangeId} = users[index]
            let account = new Account(name,exchangeId,key,secret)
            let balence = await account.getUSDT()
            let level = await account.getleverage()
            console.log(`${name}'s balence ${balence}`)
            console.log(`${level}'s balence ${level}`)
            await User.findOneAndUpdate({key},{balence,leverage:level})
            let dual = await account.getDual()
            if (dual === true) {
                await account.changeDual(false)
            }
            
        } catch (error) {
            console.log(error)
        }
    }
}
// 更新交易所最新的交易对
// update binance symbol
async function updateSymbol () {
    var users = await User.find({})
    var user = users[0]
    try {
        let {name,key,secret,exchangeId} = user
        let account = new Account(name,exchangeId,key,secret)
        let symbols = await account.getSymbols()
        for(let i = 0 ; i < symbols.length ; i ++) {
            var {symbol,contractType,status} = symbols[i]
            let data = await BinanceSymbol.find({symbol})
            if (data && data.length) {
                await BinanceSymbol.findOneAndUpdate({symbol},{contractType,status})
            } else {
                let Symbol = new BinanceSymbol({symbol,contractType,status})
                Symbol.save()
            }
        }
        
    } catch (error) {
        console.log(error)
    }
}
updateSymbol()
setInterval(() => {
    updatePosition()
    updateSymbol()
}, 10 * 60 * 1000);
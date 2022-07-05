const { debug } = require("request");
const Twit = require("../twit/lib/twitter");
const moment = require("moment");
const Account = require('./account');
const User = require("../db/user"); 
const Twitters = require("../db/twitter");
const BinanceSymbol = require("../db/binanceSymbol"); 
const log4js = require("log4js");
log4js.configure({
    appenders: { contact: { type: "file", filename: "coinbase.log" } },
    categories: { default: { appenders: ["contact"], level: "error" } }
});
const logger = log4js.getLogger("coinbase");
var T = new Twit({
    consumer_key:         process.env.TWITTER_CONSUMER_KEY,
    consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
    access_token:         process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret:  process.env.TWITTER_ACCESS_SECRET,
    timeout_ms:           2*1000,  // optional HTTP request timeout to apply to all requests.
    strictSSL:            true,     // optional - requires SSL certificates to be valid.
})
async function  start() {
try {
    T.get(
        "statuses/user_timeline",
        { screen_name: "CoinbasePro", count: 1 },
        async function (err, data, response) {
        for (let index = 0; index < data.length; index++) {
            let v = data[index];
            v.user = v.user.name;
            const {id,created_at} = v;
            let seconds = moment().diff(moment(new Date(created_at)),'seconds')
            let twitter = await Twitters.findOne({id})
            if (!twitter) {
                let new_twitter = new Twitters({...v})
                new_twitter.save()
            } else {
                continue 
            }
            var keyWord = 'WHERE TRADING IS SUPPORTED'
            keyWord = keyWord.replace(/^s*|s*$/g,"").toUpperCase()
            var text = v.text.replace(/^s*|s*$/g,"").toUpperCase()
            var condition = text.indexOf(keyWord) > -1
            if(condition) {
                var reg = /(?<=FOR)(.*)(?=ARE)/g
                var reg1 =  /,/
                var regRes = reg.exec(text)[0]
                if (!regRes) return 
                var res = regRes.replace('&AMP;',',').trim().split(reg1)
                if (!res || res.length === 0) return
                res = res.map(v=> v.trim())
                console.log(res)
                for(let i = 0 ; i < res.length ; i ++) {
                    let symbol = res[i]
                    let data = await BinanceSymbol.findOne({symbol:`${symbol}USDT`})
                    if (data) {
                        console.log(`${data.symbol} 可以开单`)
                    }
                    // 保证10分钟内开单
                    // ensure 10 minutes
                    if(data && seconds < (15 * 60) ) {
                        var user = await User.findOne({name:'siqi.liu'})
                        logger.fatal(`${user.name}准备开单`);
                        console.log(`${user.name}准备开单`)
                        let {name,key,secret,exchangeId,balence,disabled,leverage} = user
                        let account = new Account(name,exchangeId,key,secret,balence,disabled,leverage)
                        await account.contract({symbol:data.symbol,profit:0.1,withdraw:0.02,cancelTime:30 * 60,ratio:1})
                        break
                    }
                }
            }
        }
    }
    );
} catch (error) {
    console.log(error);
}
}
setInterval(start,5000)
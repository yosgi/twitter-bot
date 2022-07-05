const  ccxt = require ('ccxt')
const  HttpsProxyAgent = require ('https-proxy-agent')
const config = require('config')
const check = require('../check')
const proxy = config.proxy
const agent = proxy ? new HttpsProxyAgent (proxy) :''
const exchangeId = 'binance'
        , exchangeClass = ccxt[exchangeId]
        , exchange = new exchangeClass ({
            'apiKey': process.env.EXCHANGE_APIKEY,
            'secret': process.env.EXCHANGE_APISECRET,
            'timeout': 10000,
            'enableRateLimit': true, 
            agent
})
var Twit = require('../twit/lib/twitter')
var T = new Twit({
    consumer_key:         process.env.TWITTER_CONSUMER_KEY,
    consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
    access_token:         process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret:  process.env.TWITTER_ACCESS_SECRET,
    timeout_ms:           2*1000,  // optional HTTP request timeout to apply to all requests.
    strictSSL:            true,     // optional - requires SSL certificates to be valid.
})
function test() {
    console.time('total')
    console.time('twitter')
    T.get('statuses/show.json?id=1400663054367571968',{}, async function (err, data, response) {
        console.timeEnd('twitter')
        console.log(data)
        // await check.start(data,true)
        console.timeEnd('total')
    })
}

const ping = async () => {
    var time = await exchange.publicGetTime()
    var rate = await exchange.sapiGetAccountSnapshot({type:'SPOT'})
    console.log(time)
    
    console.log(JSON.stringify(rate))
}

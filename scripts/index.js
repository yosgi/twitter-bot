const { debug } = require('request')
const check = require('./check')
const User = require("../db/user"); 
const Account = require('./account');
const Twit = require('../twit/lib/twitter')
const moment = require('moment')
const log4js = require("log4js");
log4js.configure({
    appenders: { contact: { type: "file", filename: "contact.log" } },
    categories: { default: { appenders: ["contact"], level: "error" } }
});
const logger = log4js.getLogger("contact");
var T = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_CONSUMER_SECRET,
  timeout_ms:           2*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})
// main trade function 
async function beginTrade(relevance) {
  var users = await User.find({})
  for(let index = 0 ; index < users.length; index ++) {
      let {name,key,secret,exchangeId,_id,balence,disabled,leverage} = users[index]
      let account = new Account(name,exchangeId,key,secret,balence,disabled,leverage)
      await account.contract({symbol:'DOGEUSDT',profit:0.01,withdraw:0.002,cancelTime:60,ratio: relevance / 10 })
  }
}
function  start() {
  try {
    T.get('statuses/user_timeline', { screen_name: 'elonmusk',count:1}, async function (err, data, response) {
      if(data.errors) {
        logger.fatal(data.errors);
      }
      for(let index = 0 ; index < data.length ; index ++) {
        let v = data[index]
        v.user = v.user.name
        let relevance = await check.start(v)
        let {created_at} = v
        let seconds = moment().diff(moment(new Date(created_at)),'seconds')
        // 无关联则查询回复的推特
        if (relevance <= 0 && v.in_reply_to_status_id_str) {
          let reply =  await T.get(`statuses/show.json?id=${v.in_reply_to_status_id_str}`)
          reply.data.user = reply.data.user.name
          if (reply.data.text) {
            relevance = await check.start(reply.data)
          }
        }
        // 关联性 > 0 且是30秒内的消息，开启合约
        if (relevance > 0  && seconds < 30) {
          await beginTrade(relevance)
        }
      }
    })
  } catch (error) {
    console.log(error)
  }
}
setInterval(start,3000)
const request = require("axios");
const orc = require("./orc.js");
const config = require("config");
const log4js = require("log4js");
const Twitters = require("../db/twitter");

request.defaults.proxy = config.proxy;

log4js.configure({
    appenders: { contact: { type: "file", filename: "contact.log" } },
    categories: { default: { appenders: ["contact"], level: "error" } }
});
const download = async (url) => {
  var response = await request({ url, responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary").toString("base64");
};
// check if the text is relevant
const calc = (text) => {
    let relevance = 0
    if (!text) return relevance
    text = text.toLocaleUpperCase()
    // DOG 字段包含关联性 为 1
    if (text.indexOf("DOG") > -1) {
      relevance = 1
    }
    // DOGCOIN 字段包含关联性 为 2
    if (text.indexOf("DOGCOIN") > -1) {
      relevance = 2
    }
    // TESLA 包含关联性 * 10
    if (text.indexOf("TESLA") > -1) {
      relevance *= 10
    }
    // SPACEX 包含关联性 * 10
    if (text.indexOf("SPACEX") > -1) {
      relevance *= 10
    }
    // MOON * 5
    if (text.indexOf("MOON") > -1) {
      relevance *= 5
    }
    // DEV  * 5
    if (text.indexOf("DEV") > -1) {
      relevance *= 5
    }

    // SHIB * 3
    if (text.indexOf("SHIB") > -1) {
      relevance *= 3
    }
    // ELON* 2
    if (text.indexOf("ELON") > -1) {
      relevance *= 2
    }
    // MEME 包含关联性 * 2
    if (text.indexOf("MEME") > -1) {
      relevance *= 2
    }
    return Math.min(10,relevance)
}
const detectMedia = async(url) => {
  let relevance = 0
    console.time('download')
    var image = await download(url);
    console.timeEnd('download')
    console.time('orc')
    var detectRes = await orc.start(image);
    console.timeEnd('orc')
    if (detectRes.TextDetections && detectRes.TextDetections.length) {
      for (let i = 0; i < detectRes.TextDetections.length; i++) {
        var { DetectedText } = detectRes.TextDetections[i];
        relevance = Math.max(relevance,calc(DetectedText))
      }
    } 
    return relevance
}


// 返回关联性 -1 为 无关联
var check = async (v,isTest = false) => {
  const { text, id, user} = v;
  let relevance = -1
  let data = await Twitters.find({id})
  if (data && data.length && !isTest) {
    // 之前存在，返回-1
    return -1
  }
  relevance = calc(text)
  if (v.entities != undefined && v.entities.media != undefined) {
    const url = v.entities.media[0].media_url;
    let media_relevance = await detectMedia(url)
    relevance = Math.max(relevance,media_relevance);
  }
  let twitter = new Twitters({...v,relevance})
  twitter.save()
  return relevance;
};

exports.start = check;

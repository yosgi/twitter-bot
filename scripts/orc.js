const { reject } = require("bluebird");
const tencentcloud = require("tencentcloud-sdk-nodejs");
const log4js = require("log4js");
log4js.configure({
    appenders: { contact: { type: "file", filename: "contact.log" } },
    categories: { default: { appenders: ["contact"], level: "error" } }
});
const logger = log4js.getLogger("contact");
const OcrClient = tencentcloud.ocr.v20181119.Client;

const clientConfig = {
    credential: {
        secretId: process.env.ORCSECRECTID,
        secretKey: process.env.ORCSECRETKEY,
    },
    region: "ap-hongkong",
    profile: {
        httpProfile: {
            endpoint: "ocr.tencentcloudapi.com",
        },
    },
};

const client = new OcrClient(clientConfig);
async function run(url) {
    const params = {
        "ImageBase64": url
    };
    var res = await new Promise((resolve,reject) => {
        client.EnglishOCR(params).then(
            (data) => {
                resolve(data)
            },
            (err) => {
                reject(err)
            }
        );
    })
    return res
}

exports.start = run
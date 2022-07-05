var mongoose = require('./connect.js'), 
Schema = mongoose.Schema; 
var UserSchema = new Schema({ 
    name : { type: String }, //用户账号 
    key: {type: String}, //key
    secret: {type: String}, //secret 
    exchangeId:{type: String},
    balence:{type: Number},
    disabled:{type: Boolean},
    leverage:{type: Number},
    symbol:{type: String},
    amount:{type: Number}
});
module.exports = mongoose.model('users',UserSchema);
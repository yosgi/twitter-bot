var mongoose = require('./connect.js'), 
Schema = mongoose.Schema; 
var SymbolsSchema = new Schema({ 
    symbol : { type: String }, //用户账号 
    status: {type: String}, //key
    contractType:{type: String}
});
module.exports = mongoose.model('symbols',SymbolsSchema);
var mongoose = require('./connect.js'), 
Schema = mongoose.Schema; 
var UserSchema = new Schema({ 
    id : { type: Number }, 
    text: {type: String}, 
    created_at:{type: String},
    in_reply_to_status_id:{ type: Number }, 
    user:{type:String},
    relevance:{ type: Number },
});
module.exports = mongoose.model('twitters',UserSchema);
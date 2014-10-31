
exports.SchemaModel = function(){
    this.userShopItemModelName = "UserShopItemModel";
    this.userBidItemModelName = "UserBidItemModel";
    this.userModelName = "UserModel";
    this.userDetailsModelName = "UserDetailsModel";
};
exports.SchemaModel.prototype = {
    getShopItemSchema: function(mongoose){
        return mongoose.Schema({
            itemId: { type: Number, index: true, unique: true },
            itemClass: String,
            itemName: String,
            itemDesc: String,
            itemImage: String,            
            itemPrice: Number,
            itemSize: [String],
            itemActive: Boolean,
            itemCountRemaining: Number,
            itemCountPurchased: Number,
            dummyField: String
        });
    },
    getBidItemSchema: function(mongoose){
        return mongoose.Schema({
            itemId: { type: Number, index: true, unique: true },
            itemName: String,
            itemDesc: String,
            itemImage: String,
            itemPrice: Number,
            itemActive: Boolean,
            itemDueDate: Date
        });
    },
    getUserSchema: function(mongoose){
        return mongoose.Schema({
            userId: { type: String, index: true, unique: true },
            userFname: String,
            userLname: String,
            userItemsBought: [Number],
            userItemsBid: [Number],
            userItemsBoughtDetail: { type : Array , "default" : [] }
        });
    },
    getUserDetailsSchema: function(mongoose){
        return mongoose.Schema({
            userid: { type: String, index: true, unique: true },
            userfname: String,
            userlname: String,
            useremail: { type: String, index: true, unique: true },
            userpassword: String,
            usersalt: String,
            usertoken: String,
            useractivationtoken: String,
            userisactive: Boolean
        });
    },
    getShopItemModel: function(mongoose){
        var schema = this.getShopItemSchema(mongoose);
        return mongoose.model(this.userShopItemModelName, schema);
    },
    getBidItemModel: function(mongoose){
        var schema = this.getBidItemSchema(mongoose);
        return mongoose.model(this.userBidItemModelName, schema);
    },
    getUserModel: function(mongoose){
        var schema = this.getUserSchema(mongoose);
        return mongoose.model(this.userModelName, schema);
    },
    getUserDetailsModel: function(mongoose){
        var schema = this.getUserDetailsSchema(mongoose);
        return mongoose.model(this.userDetailsModelName, schema);
    }
}
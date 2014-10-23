
exports.SchemaModel = function(){
    this.userShopItemModelName = "UserShopItemModel";
    this.userBidItemModelName = "UserBidItemModel";
    this.userModelName = "UserModel";
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
            itemActive: Boolean,
            itemCountRemaining: Number
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
            userItemsBid: [Number]
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
    }
}
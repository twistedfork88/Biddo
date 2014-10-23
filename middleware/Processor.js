/**
 * Performs general purpose operations
 */

exports.Processor = function(){};
exports.Processor.prototype = {
    getItemDetailsForItemIds: function(dbHandle, Model, itemids, options, callback){
        dbHandle.retrieveFromDatabase(
            Model,
            { itemId:{
                    $in:itemids 
                }
            },
            "",
            "",
            function(response){
                callback(response);      
            }
        );
    },
    checkShopItemCount: function(dbHandle, Model, itemId, Callback){
        dbHandle.retrieveFromDatabase(Model, {itemId: itemId }, "itemCountRemaining", "unique", function(response){
            if(response.statusCode === 200){
                var count = parseInt(response.message.itemCountRemaining);
                console.log("count remaining is "+count);
                Callback({
                        statusCode: 200,
                        message: count
                });
            }
            else Callback({
                statusCode: 400,
                message: -1
            });
        });
    },
    checkIfItemsPresentInUserShopList: function(dbHandle, UserModel, userId, itemIds, callback){
        if(!Array.isArray(itemIds)){
            callback({
                statusCode: 400,
                message: 'malformed request. itemids should be an array.'
            });
            return;
        }
        dbHandle.retrieveFromDatabase(
            UserModel, 
            {
                userId: userId,
                userItemsBought: {
                    $in: itemIds
                }
            }, 
            "userItemsBought", 
            "unique", 
            function(response){
                console.log(">> checkifitemspresentinusershoplist response");
                console.log(response);
                if(response.statusCode === 200){
                    if(response.message){
                        callback({
                            statusCode: 400,
                            message: 'item present in users shop list'
                        });
                    }
                    else{
                        callback({
                            statusCode: 200,
                            message: null
                        });
                    }
                }
                else callback({
                        statusCode: 400,
                        message: response.message
                    });
            }
        );
    },
    checkIfItemCanBePurchasedByUser: function(dbHandle, UserModel, userId, ShopItemModel, itemid, callback){
       var message= "";
       var self = this;
       this.checkIfItemsPresentInUserShopList(dbHandle, UserModel, userId, [itemid], function(resp){
            if(resp.statusCode === 200){
                var doc = resp.message;
                if(!doc){
                    console.log(">> item not present in users shop list");
                    self.checkShopItemCount(dbHandle, ShopItemModel, itemid, function(resp2){
                        var out = {}
                        if(resp2.statusCode === 200 && parseInt(resp2.message) > 0){
                            out.statusCode = 200;
                            out.message = "Item available for purchase.";
                            console.log(">> Item available for purchase.");
                        }
                        else if(parseInt(resp2.message) <= 0){
                            out.statusCode = 400;
                            out.message = "No stock available";
                            console.log(">> No stock available")
                        }
                        else{
                            out.statusCode = 500;
                            out.message = "Something went wrong while checking available inventory";
                        }
                        callback(out);
                    });
                }
                else{
                    callback({
                        statusCode: 400,
                        message: "Item already purchased by user"
                    });
                }
            }
            else{
                callback({
                    statusCode: resp.statusCode,
                    message: resp.message
                });
            }
        });
    },
    reduceShopItemQuantity: function(dbHandle, Model, itemId, quantity, options, Callback){
        dbHandle.updateInDatabase(
            Model, 
            { itemId: itemId }, 
            { $inc: { itemCountRemaining: -1*quantity } }, 
            options, 
            function(response){
                 if(response.statusCode === 200){
                    Callback({
                        statusCode: 200,
                        message: "item quantity reduced"
                    });
                }
                else Callback({
                    statusCode: 500,
                    message: "item quantity couldn't be reduced"
                });
            }
        );
    },
    addItemToUsersShoppingList: function(dbHandle, UserModel, ShopItemModel, userId, userData, itemId, Callback){
        
        //check if the user record exists in the database
        dbHandle.retrieveFromDatabase(
            UserModel, 
            { userId: userId }, 
            "userId", 
            "unique", 
            function(response){
                if(response.message!==null){
                    //user record exists => append the itemid to the shopping list
                    dbHandle.updateInDatabase(
                        UserModel,
                        { userId: userId },
                        { $push:{
                            "userItemsBought": itemId    
                          } 
                        },
                        {},
                        function(response2){
                            if(response2.statusCode === 200)Callback({ statusCode: 200, message: "item added successfully" });
                            else{
                                Callback({ statusCode: 500, message:"item couldn't be added to shopping list"});
                            }
                        }
                    );
                }else{
                    //no user record exists => insert new document
                    var newuser = new UsersModel({
                        userId: user,
                        userFname: "Abinash",
                        userLname: "Mohapatra",
                        userItemsBought: [itemId],
                        userItemsBid: []
                    });
                    dbHandle.insertIntoDatabase(
                        UserModel,
                        newuser,
                        function(response3){
                            if(response3.statusCode === 200){
                                Callback({ statusCode: 200, message: "item added successfully"});
                            }   
                            else Callback({ statusCode: 500, message: "item couldn't be added to the shopping list"});
                        }
                    );
                }
            }
        );
    },
    removeItemFromUsersShoppingList: function(dbHandle, UserModel, userId, ShopItemModel, itemId, Callback){
        var self = this;
        dbHandle.retrieveFromDatabase(
            UserModel, 
            { userId: userId}, 
            "userItemsBought", 
            "unique", 
            function(response){
                if(response.statusCode === 200){
                    console.log(">> removeItemFromUsersShoppingList: item queried successfully");
                    var doc = response.message;
                    console.log(doc);
                    var index = doc.userItemsBought.indexOf(itemId);
                    if(index > -1){
                        doc.userItemsBought.splice(index, 1);
                        console.log(doc.userItemsBought);

                        dbHandle.updateInDatabase(
                            UserModel,
                            { userId: userId }, 
                            { $set: { "userItemsBought": doc.userItemsBought }}, 
                            {},
                            function(resp){
                                if(resp.statusCode === 200){
                                    console.log(">> removeItemFromUsersShoppingList: item removed from shopping list");
                                    self.reduceShopItemQuantity(
                                        dbHandle, 
                                        ShopItemModel, 
                                        itemId, 
                                        -1, 
                                        {}, 
                                        function(resp2){
                                            if(resp2.statusCode === 200){
                                                console.log(">> removeItemFromUsersShoppingList: item count increased successfully.")
                                                Callback({
                                                    statusCode: 200,
                                                    message: "item removed from shopping list"
                                                });
                                            }
                                            else{
                                                Callback({
                                                    statusCode: resp.statusCode,
                                                    message: resp.message
                                                });
                                            }
                                        });
                                    
                                } 
                                else Callback({
                                        statusCode: resp.statusCode,
                                        message: resp.message
                                    });
                            }
                        );
                    }
                    else Callback({
                            statusCode: 400,
                            message: "item not found in user's shopping list"
                        });
                }
            })
    }
};
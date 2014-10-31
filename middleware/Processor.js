/**
 * Performs general purpose operations
 */

exports.Processor = function(){};
exports.Processor.prototype = {
    generateExcel: function(xlsx, items, useritemlist, path, callback){
        
        var finalJSON = {};
        
        var row = [];
        var rowCount = 0;
        
        row.push('User-Id');
        for(var i=0;i<items.length;i++)
            row.push("Item:: "+items[i].name);
        row.push('Total');
        finalJSON[rowCount++] = row;
    
        for(var i=0;i<useritemlist.length;i++){
            row = [useritemlist[i].name];
            var useritems = useritemlist[i].items;
            
            for(var j=0;j<items.length;j++)row.push('00000000000');
            var totalUserAmt = 0;
            for(var j=0;j<items.length;j++){
                if(useritems.indexOf(items[j].name) > -1){
                    var l = items[j].price.toString().length;
                    var tVal = "";
                    for(var g=0;g<11-l;g++)tVal+=" ";
                    row[j+1] = tVal+items[j].price.toString();
                    
                    totalUserAmt+=parseInt(items[j].price);
                }
            }
            var l = totalUserAmt.toString().length;
            if(l < 5){
                var tVal = "";
                for(var g=0;g<5-l;g++)tVal+=" ";
                totalUserAmt = tVal+totalUserAmt;
            }
            row.push(totalUserAmt);
            finalJSON[rowCount++] = row;
        } 
        
        var data = [];
        for(var i in finalJSON)data.push(finalJSON[i]);
        
        return finalJSON;
    },
    prepareAllItemsAndPriceObject: function(RedisHandle, redisClient, ShopItemsList, callback){
        RedisHandle.queryFromClient(redisClient, ShopItemsList, true, function(err, list){
            var outlist = [];
            if(err){
                console.log(">> error retrieving items from redis...");
            }
            else{
                console.log(">> retrieving shopping items from redis list...");
                outlist = list.map(function(item){
                    var o = {};
                    item = JSON.parse(item);
                    o.name = item.itemId;
                    o.price = item.itemPrice;
                    return o;
                });
               
            }
            callback(outlist);
        });
    },
    getAllUsersItemList: function(dbHandle, UsersModel, itemlist, callback){
        var projection = "userId "+itemlist;
        console.log(projection)
        dbHandle.retrieveFromDatabase(
            UsersModel, 
            {}, 
            projection, 
            "", 
            function(response){
                var outlist = [];
                if(response.statusCode === 200){
                    var data = response.message;
                    console.log(data);
                    for(var i=0;i<data.length;i++){
                        var o = {};
                        o.name = data[i].userId;
                        o.items = data[i][itemlist];
                        outlist.push(o);
                    }
                }
                callback(outlist);
            }
        );
    },
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
        dbHandle.retrieveFromDatabase(Model, {itemId: itemId }, "itemCountRemaining itemName itemImage", "unique", function(response){
            if(response.statusCode === 200){
                var count = parseInt(response.message.itemCountRemaining);
                console.log("count remaining is "+count);
                Callback({
                        statusCode: 200,
                        itemname: response.message.itemName,
                        itemimg: response.message.itemImage,
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
                    var out = {}
                    out.statusCode = 200;
                    out.message = "Item available for purchase.";
                    console.log(">> Item available for purchase.");
         
                    callback(out);
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
    updateShopItemQuantity: function(dbHandle, Model, itemId, quantity, options, Callback){
        console.log(">> updating itemCountPurchased by "+quantity);
        dbHandle.updateInDatabase(
            Model, 
            { itemId: itemId }, 
            { $inc: { 
                itemCountPurchased: quantity 
              } 
            }, 
            options, 
            function(response){
                 if(response.statusCode === 200){
                    Callback({
                        statusCode: 200,
                        message: "item quantity updated"
                    });
                }
                else Callback({
                    statusCode: 500,
                    message: "item quantity couldn't be reduced"
                });
            }
        );
    },
    addItemToUsersShoppingList: function(dbHandle, UserModel, ShopItemModel, userId, userData, itemId, itemSize, Callback){
        
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
                            "userItemsBought": itemId,
                            userItemsBoughtDetail: {
                                itemId: itemId,
                                itemSize: itemSize
                            }
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
                    console.log(">> no purchase record exists.");
                    console.log(userData);
                    dbHandle.insertIntoDatabase(
                        UserModel,
                        userData,
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
            "userItemsBought userItemsBoughtDetail", 
            "unique", 
            function(response){
                if(response.statusCode === 200){
                    console.log(">> removeItemFromUsersShoppingList: item queried successfully");
                    var doc = response.message;
                    console.log(doc);
                    var index = doc.userItemsBought.indexOf(itemId);
                    if(index > -1){
                        //update the shopping list
                        doc.userItemsBought.splice(index, 1);
                        
                        //update the shopping list detail
                        doc.userItemsBoughtDetail = doc.userItemsBoughtDetail.filter(function(item){
                            return item.itemId !== itemId;
                        });
                        
                        console.log(doc.userItemsBoughtDetail);

                        dbHandle.updateInDatabase(
                            UserModel,
                            { userId: userId }, 
                            { $set: { 
                                userItemsBought: doc.userItemsBought,
                                userItemsBoughtDetail: doc.userItemsBoughtDetail
                              }
                            }, 
                            {},
                            function(resp){
                                if(resp.statusCode === 200){
                                    console.log(">> removeItemFromUsersShoppingList: item removed from shopping list");
                                    Callback({
                                        statusCode: 200,
                                        message: 'Item purchase has been successfully undone'
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
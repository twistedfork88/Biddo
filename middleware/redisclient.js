/**
 * Redis Client class addressing connecting/disconnecting
 * supporting CRUD operations. This is mostly intended for
 * caching purposes.
 */

exports.Redis = function(){}
exports.Redis.prototype = {
    createClient: function(redis){
        return redis.createClient(); 
    },
    connectToClient: function(redisClient, callback){
         redisClient.on('connect', function(){
            callback();
         });
    },
    disconnectFromClient: function(redis){
    
    },
    setKey: function(redisClient, key, value){
        redisClient.set(key, value, function(err, resp){
            
        });    
    },
    insertIntoClient: function(redisClient, key, data, isMulti, callback){
        if(isMulti){
            var clientMulti = redisClient.multi();
            
            //check if the data is an Array
            if(Array.isArray(data)){
                for(var i=0;i<data.length;i++){
                    clientMulti.rpush(key, JSON.stringify(data[i]));
                }
                clientMulti.exec(function(err, res){
                    callback(err, res);
                });
            }
        }
    },
    queryFromClient: function(redisClient, key, isMulti, callback){
         if(isMulti){
            redisClient.lrange(key, 0, -1, function(err, items){
                callback(err, items);    
            })
         }
         else{
            redisClient.get(key, function(err, res){
                callback(err, res);
            });
         }
    },
    updateList: function(redisClient, key, values, Callback){
        var that = this;
        this.queryFromClient(redisClient, key, true, function(err, list){
            if(err){
                Callback(err, list);
            }else{
                list = list.map(function(item){ return JSON.parse(item); });
                for(var i=0;i<values.length;i++){
                    for(var j=0;j<list.length;j++){
                        console.log(values[i].itemId+" = "+list[j].itemId);
                        if(parseInt(values[i].itemId) === parseInt(list[j].itemId)){
                            for(var objKey in values[i]){
                                if(objKey!=="itemId"){
                                    list[j][objKey] = values[i][objKey];
                                }
                            }
                            break;
                        }
                    }
                }
                
                that.deleteFromClient(redisClient, key);
                that.insertIntoClient(redisClient, key, list, true, function(err2, res){
                    Callback(err2, res);  
                });
            }
        })
    },
    updateIntoClient: function(redis, key, value){
        
    },
    deleteFromClient: function(redisClient, key){
        redisClient.del(key);
    },
    refreshContent: function(redisClient, list, dbHandle, model, callback){
        var self = this;
        dbHandle.retrieveFromDatabase(model, {}, {}, "", function(res){
            if(res.statusCode === 200){
                console.log(">> Filling items into Redis Cache...");

                var items = res.message;
                if(Array.isArray(items)){
                    self.deleteFromClient(redisClient, list);
                    self.insertIntoClient(redisClient, list, items, true, function(err, res2){
                           callback(err, res2);
                    });
                }
            }
        });
    }
}
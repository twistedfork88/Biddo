
/**
 * Module dependencies.
 */

//modules import
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , redis = require('redis')
  , fs = require('fs')
  , databaseModule = require('./middleware/database.js')
  , redisClientModule = require('./middleware/redisclient.js')
  , SchemaModelModule = require('./middleware/SchemaModel.js')
  , ProcessorModule = require('./middleware/Processor.js');

//application variables
var isConnectedToDb = false
  , SchemaModelHandle = null
  , RedisHandle = null
  , ProcessorHandle = null
  , UniqueSelection = "unique"
  , AllSelection = "all";

//application models
var UsersModel = null
  , ShopItemModel = null
  , BidItemModel = null;

//items lists
var ShopItemsList = "shopItemsList"
  , BidItemsList = "bidItemsList";

var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.compress());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
      
  app.use(function(req, res, next){
      var path = req.path;
      var match = path.match(/\/profile|\/shop|\/index|\/bid/);
      if(match && match.length){
            console.log(">> received request...");
 
            var userAgent = req.headers['user-agent'];
            console.log(userAgent);
          
            if(userAgent.indexOf("Chrome") > -1 || userAgent.indexOf("Firefox") > -1 || userAgent.indexOf("MSIE 10") > -1)
                next();
            else{
                //redirect to not supported page
                res.redirect('/unsupported');
            }
      }
      else next();
  });
  
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});



app.get('/index', function(req, res){
    fs.readFile(__dirname+'/public/files/index.html', function(err, data){
        res.end(data);
    });
});

app.get('/shop', function(req, res){
    fs.readFile(__dirname+'/public/files/shop.html', function(err, data){
        res.end(data);
    });
});

app.get('/profile', function(req, res){
    fs.readFile(__dirname+'/public/files/profile.html', function(err, data){
        res.end(data);
    });
});

app.get('/unsupported', function(req, res){
    fs.readFile(__dirname+'/public/files/notsupported.html', function(err, data){
        res.end(data);
    });
});

app.get('/getshoppingitems', function(req, res){
    if(isConnectedToDb){
        RedisHandle.queryFromClient(redisClient, ShopItemsList, true, function(err, list){
            if(err){
                console.log(">> error retrieving items from redis...");
                res.end(JSON.stringify({
                    statusCode: 500,
                    data: err.message
                }));    
            }
            else{
                console.log(">> retrieving shopping items from redis list...");
                list = list.map(function(item){
                    return JSON.parse(item);
                });
                res.end(JSON.stringify({
                    statusCode: 200,
                    data: list
                }));
            }
        
        });
    }
});

app.get('/getshopitemsforuser/:user', function(req, res){
    var user = req.params.user;
    console.log(user)
    if(user){
        dbHandle.retrieveFromDatabase(UsersModel, {
            userId: user
        }, "userItemsBought", UniqueSelection, function(response){
            if(response.statusCode === 200){
                res.end(JSON.stringify({
                    statusCode: 200,
                    message: response.message
                }));
            }else{
                res.end(JSON.stringify({
                    statusCode: 200,
                    message: []
                }));
            }        
        });
    }
});

app.get('/getitemdetails', function(req, res){
    var itemids = req.query.item;
    console.log(itemids);
    if(itemids && itemids.length){
        ProcessorHandle.getItemDetailsForItemIds(dbHandle, ShopItemModel, itemids, "", function(response){
            if(response.statusCode === 200){
                res.end(JSON.stringify({ statusCode: 200, message: response.message }))
            }
            else{
                res.end(JSON.stringify({ statusCode: response.statusCode, message: response.message }))
            }
        });   
    }
    else res.end(JSON.stringify({ statusCode: 400, message: "malformed request" }))
})

app.post('/purchase', function(req, res){
    var user = req.body.userId;
    var itemid = req.body.itemId;
    var quantity = 1;
    
    console.log(user+" "+itemid);
 
    var out = {
        statusCode: 400,
        message: 'malformed request'
    };
    if(user && itemid){
        
        /** check if the item can be purchased or not */
        ProcessorHandle.checkIfItemCanBePurchasedByUser(
            dbHandle, 
            UsersModel,
            user,
            ShopItemModel, 
            itemid, 
            function(response){   
                console.log(">> final response");
                console.log(response);
                if(response.statusCode === 200){
                    var countRemaining = response.message;
                    
                    /** reduce the quantity of the item */
                    ProcessorHandle.reduceShopItemQuantity(
                        dbHandle, 
                        ShopItemModel, 
                        itemid, 
                        quantity, 
                        {}, 
                        function(response2){
                            if(response2.statusCode === 200){
                                
                                --countRemaining;
                                
                                /** add item to user's shopping list */
                                var newuser = new UsersModel({
                                    userId: user,
                                    userFname: "Abinash",
                                    userLname: "Mohapatra",
                                    userItemsBought: [itemid],
                                    userItemsBid: []
                                });
                                ProcessorHandle.addItemToUsersShoppingList(
                                    dbHandle, 
                                    UsersModel, 
                                    ShopItemModel, 
                                    user, 
                                    newuser, 
                                    itemid, 
                                    function(response3){
                                        if(response3.statusCode === 200){
                                            //all done => update items list in the redis list
                                            var update = [{ itemId: itemid, itemCountRemaining: countRemaining }];
                                            RedisHandle.updateList(redisClient, ShopItemsList, update, function(err, resp){
                                                if(err){
                                                    res.end(JSON.stringify({
                                                            statusCode:500, 
                                                            message:err.message
                                                            }
                                                        )
                                                    );    
                                                }
                                                else{
                                                    res.end(JSON.stringify({
                                                        statusCode:200, 
                                                        message:"item added successfully"
                                                        }
                                                    ));
                                                }
                                            });
                                        }
                                        else{
                                            res.end(
                                                JSON.stringify({
                                                    statusCode:response3.statusCode, 
                                                    message:response3.message
                                                })
                                            );
                                        }
                                    }
                                );
                            }
                            else{
                                res.end(
                                    JSON.stringify({
                                        statusCode:response2.statusCode, 
                                        message:response2.message
                                    })
                                );
                            }
                        }
                    );
                }
                else{
                    out.message = response.message;
                    out.statusCode = response.statusCode;
                    res.end(JSON.stringify(out));
                }
            }
        );
    }
    else res.end(JSON.stringify(out));
});

app.post('/unpurchase', function(req, res){
    var user = req.body.userId;
    var itemid = req.body.itemId;
    if(user && itemid){
        ProcessorHandle.removeItemFromUsersShoppingList(dbHandle, UsersModel, user, ShopItemModel, itemid, function(response){
            if(response.statusCode === 200){
                
                /** fill in all shop items into the cache */
                dbHandle.retrieveFromDatabase(ShopItemModel, {}, {}, "", function(resp){
                    if(resp.statusCode === 200){
                        console.log(">> Filling Shop items into Redis Cache...");

                        var items = resp.message;
                        console.log(">>retrieved items");
                        if(Array.isArray(items)){
                            RedisHandle.deleteFromClient(redisClient, ShopItemsList);
                            RedisHandle.insertIntoClient(redisClient, ShopItemsList, items, true, function(err, res2){
                                var out = {};
                                if(err){
                                    console.log(">> Error while inserting shop items into cache...");
                                    out.statusCode = 500;
                                    out.message = "Shop items couldn't be read into the cache.";
                                }
                                else{
                                    console.log(">> Shop items inserted into Redis successfully.");
                                    out.statusCode = 200;
                                    out.message = response.message;
                                }
                                res.end(JSON.stringify(out));
                            });
                        }
                    }
                })
            }
            else res.end(JSON.stringify(response));
        });
    }
    else res.end(JSON.stringify({
        statusCode:400,
        message: 'malformed request. UserId or itemId are empty'
    }));
})

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

/** database connection */
var dbHandle = new databaseModule.database();
dbHandle.connectToDatabase(mongoose, function(response){
    console.log(">> "+response.message);
    if(response.statusCode === 200){
        isConnectedToDb = true;
        
        /** instantiate all Model classes */
        SchemaModelHandle = new SchemaModelModule.SchemaModel();
        UsersModel = SchemaModelHandle.getUserModel(mongoose);
        ShopItemModel = SchemaModelHandle.getShopItemModel(mongoose);
        BidItemModel = SchemaModelHandle.getBidItemModel(mongoose);
        
        /** instantiate the general purpose operations class */
        ProcessorHandle = new ProcessorModule.Processor();
        
        /** set up the Redis connection */
        RedisHandle = new redisClientModule.Redis();
        redisClient = RedisHandle.createClient(redis);
        RedisHandle.connectToClient(redisClient, function(){
            console.log(">> Connected to Redis successfully.");
        
            /** fill in all shop items into the cache */
            RedisHandle.deleteFromClient(redisClient, ShopItemsList);
            dbHandle.retrieveFromDatabase(ShopItemModel, {}, {}, "", function(res){
                if(res.statusCode === 200){
                    console.log(">> Filling Shop items into Redis Cache...");
                    
                    var items = res.message;
                    if(Array.isArray(items)){
                        RedisHandle.insertIntoClient(redisClient, ShopItemsList, items, true, function(err, res2){
                            if(err)console.log(">> Error while inserting shop items into cache...");
                            else{
                                console.log(">> Shop items inserted into Redis successfully.");
                            }
                        });
                    }
                }
            });
        
        });
     }
});


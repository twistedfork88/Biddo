
/**
 * Module dependencies.
 */

//modules import
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , https = require('https')
  , clientCertificateAuth = require('client-certificate-auth')
  , path = require('path')
  , mongoose = require('mongoose')
  , redis = require('redis')
  , fs = require('fs')
  , uid = require('uid2')
  , bcrypt = require('bcrypt-nodejs')
  , crypto = require('crypto')
  , session = require('express-session')
  , RedisStore = require('connect-redis')(session)
  , querystring = require('querystring')
  , excelbuilder = require('msexcel-builder')
  , winston = require('winston')
  , databaseModule = require('./middleware/database.js')
  , redisClientModule = require('./middleware/redisclient.js')
  , SchemaModelModule = require('./middleware/SchemaModel.js')
  , ProcessorModule = require('./middleware/Processor.js')
  , UserDetailsModule = require('./middleware/User.js')

//application variables
var isConnectedToDb = false
  , SchemaModelHandle = null
  , RedisHandle = null
  , ProcessorHandle = null
  , UserDetailsHandle = null
  , UniqueSelection = "unique"
  , AllSelection = "all";

//application models
var UsersModel = null
  , ShopItemModel = null
  , BidItemModel = null
  , UserDetailsModel = null;

//items lists
var ShopItemsList = "shopItemsList"
  , BidItemsList = "bidItemsList";

//bcrypt hashing work factor
var WORK_FACTOR = 12;

//instantiate winston logger
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({ filename: 'applog.log' })
    ]
});

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
  app.use(express.cookieParser('somesecret'));
  app.use(express.cookieSession());
    
  app.use(session({ 
    store: new RedisStore, 
    secret: "consideringthedeviceisattachedtomyapartmentsWiFinetwork"
  }));     
  //app.use(express.csrf());

  /*read client certificate
  app.use(clientCertificateAuth(function(cert){
      
    console.log(cert.subject);       
          
  }));*/
    
  app.use(function(req, res, next){
      
      //remove the X-Powered-By header
      res.removeHeader('X-Powered-By');      
      
      var userAgent = req.headers['user-agent'];  
      console.log(userAgent);
      
      if(req.url.indexOf("/activateuser") > -1){
        if(
                userAgent.indexOf("Chrome") < 0 && 
                userAgent.indexOf("Firefox") < 0
        ){
            //redirect to not-supported page
            res.redirect('/unsupported');
            return;
        } 
      }
      
      var path = req.path;
      var match = path.match(/\/login|\/profile|\/shop|\/index|\/bid/);
      
      if(match && match.length){
            console.log(">> received request for "+req.url);
        
            //set required response headers
            var responseHeaders = {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-CSS-Protection': 1,
                'X-Content-Type-Options': 'nosniff'
            }
            res = ProcessorHandle.setResponseHeaders(res, responseHeaders);
       
            //bad way => check browser based on user-agent header
            if(
                userAgent.indexOf("Chrome") < 0 && 
                userAgent.indexOf("Firefox") < 0
            ){
                //redirect to not-supported page
                res.redirect('/unsupported');
                return;
            }
          
            console.log(req.session);
            
            /** set user information in the request session */
            if(
                !req.session || 
                (
                    req.session && 
                    (
                        !req.session.user || 
                        !req.session.username || 
                        !req.session.usermail || 
                        !req.session.token
                    )
                )
            ){
                console.log(">> session does not exist...");
                
                /*var cert = req.connection.getPeerCertificate();
                var certAuth = ProcessorHandle.checkCertificateAuthority(cert);
                if(certAuth){
                      console.log(">> Certificate authority verified.");
                      var certinfo = ProcessorHandle.processClientCertificate(cert);
                      console.log(certinfo);
                      req.session = {};
                      req.session.user = certinfo.userid;
                      req.session.username = certinfo.username;
                      req.session.usermail = certinfo.usermail;
                      req.session._csrf = uid(24);
                      
                      //set the necessary cookies
                      res.cookie('X-request-user', req.session.user);
                      res.cookie('X-request-username', req.session.username);
                      res.cookie('X-CSRF-Token', req.session._csrf);
                    
                      if(req.url !== "/login") return next();
                      else return res.redirect("/index");
                }*/
                
                if(req.cookies && req.cookies.hieallmnrstta && req.cookies['X-request-user']){
                    console.log(">> cookies are set though...");
                    //query and verify if the tokens match
                    UserDetailsHandle.queryUser(
                        dbHandle, 
                        UserDetailsModel,{
                            userid: req.cookies['X-request-user']
                        },
                        "usertoken useremail", 
                        "unique", 
                        function(response){
                            if(response.statusCode === 200){
                                var doc = response.message;
                                if(doc){
                                    if(doc.usertoken === req.cookies.hieallmnrstta){
                                        //yes the tokens match. create new token and let the user login.
                                        var shasum = UserDetailsHandle.initializeSHA1SUM(crypto);
                                        var token = UserDetailsHandle.createSHA1Digest(shasum, Date.now().toString());
                                        
                                        //update the new token value in the database
                                        UserDetailsHandle.updateUser(
                                            dbHandle, 
                                            UserDetailsModel, 
                                            req.cookies['X-request-user'], {
                                                $set:{
                                                    usertoken: token
                                                }
                                            }, 
                                            function(resp2){
                                                if(resp2.statusCode === 200){
                                                    var names = doc.useremail.split('.');
                                                    
                                                    //initialize the session
                                                    req.session = {};
                                                    req.session.user = req.cookies['X-request-user'];
                                                    req.session.username = names[0]+" "+names[1].split('@')[0];
                                                    req.session.token = token;
                                                    req.session.usermail = doc.useremail;
                                                    
                                                    //set the cookie
                                                    res.cookie('hieallmnrstta', token);
                                                    
                                                    //send the CSRF token to the client
                                                    req.session._csrf = uid(24);
                                                    res.cookie('X-CSRF-Token', req.session._csrf);
      
                                                    next();
                                                }
                                                else{
                                                    UserDetailsHandle.clearUserCookies();
                                                    res.redirect('/login');
                                                    return;
                                                }
                                            }
                                        );
                                    }
                                    else{
                                        console.log(">> User cookies do not match. Redirecting to /login");
                                        res = UserDetailsHandle.clearUserCookies(res);
                                        res.redirect('/login');
                                        return;
                                    }
                                }
                            }
                            else{
                                UserDetailsHandle.clearUserCookies(res);
                                res.redirect('/login');
                                return;
                            }
                        }
                    );
                }
                else{
                    console.log(">> cookies are not set as well. redirecting to /login");
                    UserDetailsHandle.clearUserCookies(res);
                    if(req.url!=='/login')
                        res.redirect('/login');
                    else next();
                    return;
                }
            }
            else{
                if(req.url!=="/login")   
                    next();
                else{
                    res.redirect('/index');
                    return;
                }
            }
      }
      else next();
  });
  
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  
  /** 404 route handling */
  app.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(__dirname+"/public/files/error.html", function(err, data){
        res.end(data);
    });
  });
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/login', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(__dirname+"/public/files/login.html", function(err, data){
        res.end(data);
    });
});

app.get('/adminlogin', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(__dirname+'/public/files/admin.html', function(err, data){
        res.end(data);
    });
});

app.get('/index', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(__dirname+'/public/files/index.html', function(err, data){
        res.end(data);
    });
});

app.get('/shop', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    console.log(">> in /shop");
    console.log(req.session);
    fs.readFile(__dirname+'/public/files/shop.html', function(err, data){
        res.end(data);
    });
});

app.get('/profile', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(__dirname+'/public/files/profile.html', function(err, data){
        res.end(data);
    });
});

app.get('/contact', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(__dirname+'/public/files/contact.html', function(err, data){
        res.end(data);
    });
});

app.get('/unsupported', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    fs.readFile(__dirname+'/public/files/notsupported.html', function(err, data){
        res.end(data);
    });
});


/** User login routes */
app.post('/createuser', function(req, res){
     
    var userid = req.query.user;
    var useremail = req.query.email;
    var userpass = req.query.pass;
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    var usersalt = UserDetailsHandle.generateSaltSync(bcrypt, WORK_FACTOR);
    var hash = UserDetailsHandle.generateBcryptHash(bcrypt, userpass, usersalt);
    var shasum = UserDetailsHandle.initializeSHA1SUM(crypto);
    var activatetoken = UserDetailsHandle.createSHA1Digest(shasum, userid+userpass);
    
    var data = {
        userid: userid,
        useremail: useremail,
        userpassword: userpass,
        userpassword: hash,
        usersalt: usersalt,
        usertoken: null,
        useractivationtoken: activatetoken,
        userisactive: false
    };
    
    //create the new user and send mail as well
    UserDetailsHandle.createUser(dbHandle, UserDetailsModel, data, function(resp){
        if(resp.statusCode === 200){
            //user successfully created. now send mail.
            UserDetailsHandle.sendMailtoUser(null, http, querystring, userid, userpass+"__ABINASH__"+activatetoken, useremail, function(response){
                console.log(response);                
            });
            res.end(JSON.stringify(resp));
        }
        else res.end(JSON.stringify(resp));
    });    
});

app.get('/activateuser', function(req, res){
    var user = req.query.user;
    var activationcode = req.query.activation;
    
    console.log("user="+user+" & activation="+activationcode);
    
    UserDetailsHandle.queryUser(
        dbHandle, 
        UserDetailsModel,{
            userid: user,
            useractivationtoken: activationcode,
            userisactive: false
        }, 
        "userid useremail",
        "unique",
        function(resp){
            console.log(resp);
            if(resp.statusCode === 200){
                var doc = resp.message;
                if(doc && doc.userid === user){
                    console.log(">> all good to go...")
                    //all good to go
                    var shasum = UserDetailsHandle.initializeSHA1SUM(crypto);
                    var token = UserDetailsHandle.createSHA1Digest(shasum, Date.now().toString());
                    
                    UserDetailsHandle.updateUser(
                        dbHandle, 
                        UserDetailsModel,
                        user   
                        ,{ 
                            $set:{
                                userisactive: true,
                                usertoken: token
                            }
                        }, function(resp2){
                            if(resp2.statusCode === 200){
                                //set the necessary cookies
                                var names = doc.useremail.split('.');
                                res.cookie('X-request-user', user);
                                res.cookie('X-request-username', names[0]+" "+names[1].split('@')[0]);
                                res.cookie('hieallmnrstta', token);
                                
                                //send the CSRF token to the client
                                req.session._csrf = uid(24);
                                res.cookie('X-CSRF-Token', req.session._csrf);
                                
                                //set the session
                                req.session.user = user;
                                req.session.username = names[0]+" "+names[1].split('@')[0];
                                req.session.token = token;
                                req.session.usermail = doc.useremail;
                                
                                res.redirect('/index');
                            }
                            else res.end("<h1>Sorry ! It seems our servers are down. Please try again later.</h1>");
                        });                    
                }else{
                    // malicious attack scene
                    console.log(">> malicious attack scene")
                    res.end("<h1>Sorry ! There seems to be some malicious activity here hence dropping all operations.</h1>")
                }
            }
        }
    );    
});

app.post('/check', function(req, res){
    var user = req.body.user;
    var pass = req.body.pass;
    
    res.setHeader("Access-Control-Allow-Origin", "*");    
    if(user && pass){
        UserDetailsHandle.queryUser(
            dbHandle, 
            UserDetailsModel,{
                userid: user
            },
            "", 
            "unique", 
            function(response){
                if(response.statusCode === 200){
                    var userdoc = response.message;
                    if(userdoc){
                        var userpass = userdoc.userpassword;
                        var match = UserDetailsHandle.compareBcryptHashSync(bcrypt, pass, userpass);
                        if(match){
                            
                            var shasum = UserDetailsHandle.initializeSHA1SUM(crypto);
                            var token = UserDetailsHandle.createSHA1Digest(shasum, Date.now().toString());
                            
                            UserDetailsHandle.updateUser(
                                dbHandle, 
                                UserDetailsModel, 
                                user, {
                                    $set: {
                                        usertoken: token
                                    }
                                },
                                function(response){
                                    if(response.statusCode === 200){
                                        //all set
                                        var names = userdoc.useremail.split('.');
                                        var cookies = {
                                            'X-request-user': user,
                                            'X-request-username': names[0]+" "+names[1].split('@')[0],
                                            'hieallmnrstta': token
                                        };
                                        res = UserDetailsHandle.setUserCookies(res, cookies);
                                        res.end(JSON.stringify({
                                            statusCode: 200,
                                            message: 'User successfully authenticated.'
                                        }));
                                    }
                                    else{
                                        res = UserDetailsHandle.clearUserCookies(res);
                                        res.end(JSON.stringify({
                                            statusCode: 500,
                                            message: 'Something went wrong. Please try again later.'
                                        }));
                                    }
                                }
                            );
                        }
                        else res.end(JSON.stringify({
                            statusCode: 400,
                            message: 'Invalid Credentials. Either the username or password is incorrect.'
                        }));
                    }
                    else{
                        res.end(JSON.stringify({
                            statusCode: 400,
                            message: 'Invalid Credentials. Either the username or password is incorrect.'
                        }));
                    }
                }
            });
    }
    else res.end(JSON.stringify({
                statusCode: 400,
                message: 'Invalid Credentials. Either the username or password is incorrect.'
            }));
});

app.post('/logout', function(req, res){
    //check CSRF token to proceed
    UserDetailsHandle.processUserPOSTRequest(req, res);
    
    UserDetailsHandle.updateUser(
        dbHandle, 
        UserDetailsModel, 
        req.session.user, {
            $set: {
                usertoken: null
            }
        },
        function(response){
            res.setHeader("Access-Control-Allow-Origin", "*");    
            if(response.statusCode === 200){
                //all set
               res = UserDetailsHandle.clearUserCookies(res);
               req.session = null;
             
               res.end(JSON.stringify({
                    statusCode: 200,
                    message: 'User successfully logged out.'
                }));
            }
            else{
                res.end(JSON.stringify({
                    statusCode: 500,
                    message: 'Something went wrong. Please try again later.'
                }));
            }
        }
    );    
});

app.post('/setuserdetails', function(req, res){
    var user = req.body.user;
    req.session.user = user;
    
    console.log(req.session);
    
    res.cookie('X-request-user', req.session.user);
    res.cookie('X-request-username', req.session.username);
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    res.end(JSON.stringify({
        statusCode: 200,
        message: 'data received'
    }));
});

app.get('/getshoppingitems', function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
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
    //res.setHeader("Access-Control-Allow-Origin", "*");
    var sessionUser = req.session.user;
    var user = req.params.user;
    console.log(sessionUser);
    if(sessionUser){
        dbHandle.retrieveFromDatabase(UsersModel, {
            userId: sessionUser
        }, "userItemsBought", UniqueSelection, function(response){
            if(response.statusCode === 200){
                var out = [];
                if(response.message) out = response.message.userItemsBought;
                res.end(JSON.stringify({
                    statusCode: 200,
                    message: {
                        userItemsBought: out
                    }
                }));
            }else{
                res.end(JSON.stringify({
                    statusCode: 200,
                    message: []
                }));
            }        
        });
    }
    else res.end(JSON.stringify({ statusCode: 400, message: "malformed request. Userid is missing." }))
});

app.get('/getitemdetails', function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
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
    
    //check CSRF token to proceed
    UserDetailsHandle.processUserPOSTRequest(req, res);
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    var sessionUser = req.session.user;
    var user = req.body.userId;
    var itemid = req.body.itemId;
    var itemname = req.body.itemName;
    var itemSize = req.body.itemSize;
    var quantity = 1;
    
    console.log(sessionUser+" "+itemid);
 
    var out = {
        statusCode: 400,
        message: 'malformed request'
    };
    if(sessionUser && itemid){
        
        /** check if the item can be purchased or not */
        ProcessorHandle.checkIfItemCanBePurchasedByUser(
            dbHandle, 
            UsersModel,
            sessionUser,
            ShopItemModel, 
            itemid, 
            function(response){   
                console.log(">> final response");
                console.log(response);
                if(response.statusCode === 200){
                    console.log(">> "+response.message);
                    //increment the quantity purchased for the item
                    ProcessorHandle.updateShopItemQuantity(
                        dbHandle, 
                        ShopItemModel, 
                        itemid, 
                        quantity, 
                        {}, 
                        function(response2){
                            console.log(">> "+response2.message);
                            /** add item to user's shopping list */
                            var name = req.session.username.split(' ');
                            var newuser = new UsersModel({
                                userId: sessionUser,
                                userFname: name[0],
                                userLname: name[1],
                                userItemsBought: [itemid],
                                userItemsBid: [],
                                userItemsBoughtDetail: [{
                                    itemId: itemid,
                                    itemSize: itemSize
                                }]
                            });
                            ProcessorHandle.addItemToUsersShoppingList(
                                dbHandle, 
                                UsersModel, 
                                ShopItemModel, 
                                sessionUser, 
                                newuser, 
                                itemid, 
                                itemSize,
                                function(response3){
                                    if(response3.statusCode === 200){
                                        //item successfully purchased. send mail now.
                                        UserDetailsHandle.sendMailtoUser(
                                            "purchased",
                                            http, 
                                            querystring, 
                                            req.session.user, 
                                            itemname, 
                                            req.session.usermail, 
                                            function(response4){
                                                 console.log(response4.message);            
                                            }
                                        );
                                        res.end(JSON.stringify({
                                            statusCode:200, 
                                            message:"item added successfully"
                                            }
                                        ));
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
    
    //check CSRF token to proceed
    UserDetailsHandle.processUserPOSTRequest(req, res);
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    var sessionUser = req.session.user;
    var user = req.body.userId;
    var itemid = req.body.itemId;
    var itemname = req.body.itemName;
    var quantity = -1;
    
    if(sessionUser && itemid){
        ProcessorHandle.updateShopItemQuantity(
            dbHandle, 
            ShopItemModel, 
            itemid, 
            quantity, 
            {}, 
            function(response){
                if(response.statusCode === 200){
                    console.log(">> "+response.message);
                    ProcessorHandle.removeItemFromUsersShoppingList(
                        dbHandle, 
                        UsersModel, 
                        sessionUser, 
                        ShopItemModel, 
                        itemid, 
                        function(response2){
                            //all done. send mail now.
                            UserDetailsHandle.sendMailtoUser(
                                "undone purchase of",
                                http, 
                                querystring, 
                                req.session.user, 
                                itemname, 
                                req.session.usermail, 
                                function(response3){
                                     console.log(response3.message);            
                                }
                            );
                            res.end(JSON.stringify(response2));
                        }
                    );    
                }
                else res.end(JSON.stringify(response));
            }
        );
        
    }
    else res.end(JSON.stringify({
        statusCode:400,
        message: 'malformed request. UserId or itemId are empty'
    }));
});

app.post('/generatefinalexcel', function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    var itemlistname = req.body.reporttype;
    console.log(">>reporttype is "+itemlistname);
    if(itemlistname && (itemlistname === "userItemsBought" || itemlistname === "userItemsBid")){
        
        var itemlist = (itemlistname === "userItemsBought")?ShopItemsList:BidItemsList;
        ProcessorHandle.prepareAllItemsAndPriceObject(RedisHandle, redisClient, itemlist, function(response){
            var allItems = response;
            //prepare users itemlist
            ProcessorHandle.getAllUsersItemList(dbHandle, UsersModel, itemlistname, function(resp2){
                var usersdata = resp2;
                var data = ProcessorHandle.generateExcel(null, allItems, usersdata);
                var path = "./docs/file.xls";
                var finaldata = "";

                var writeStream = fs.createWriteStream(path);
                var contentTypeXLS = 'application/vnd.ms-excel';
                var contentTypeXLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

                //create the file and store on the server
                for(var i in data){
                    var row = data[i];
                    writeStream.write(row.join("\t")+"\n");
                    finaldata+=row.join("\t")+"\n";
                }

                writeStream.end();
                res.setHeader('Content-Type', contentTypeXLS);
                res.setHeader('Content-Disposition', 'attachment; filename="userdata.xls');            

                res.end(finaldata);
            });
        });
    }
    else{
        //if an AJAX request
        if(req.headers['X-Requested-With'] && req.headers['X-Requested-With'] === "XMLHttpRequest"){
            res.setHeader('Content-Type', 'text/json');
            res.end(JSON.stringify({
                statusCode: 400,
                message: 'Malformed request. Invalid request parameters.'
            }));
        }
        else{
            res.setHeader('Content-Type', 'text/html');
            res.end("<h1>Malformed Request with invalid request parameters.</h1>");
        }
    }
});

app.post('/refreshcache/:list', function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    var list = req.params.list;
    if(list && (list === "bidding" || list === "shopping")){
        var itemslist = null;
        var itemmodel = null;
        if(list === "bidding"){
            itemslist = BidItemsList;
            itemmodel = BidItemModel;
        }
        else{
            itemslist = ShopItemsList;
            itemmodel = ShopItemModel;
        }
        
        console.log(itemslist);
        
        RedisHandle.refreshContent(redisClient, itemslist, dbHandle, itemmodel, function(err, resp){
            if(err) 
                res.end(JSON.stringify({
                    statusCode: 500,
                    message: err.message
                }));
            else 
                res.end(JSON.stringify({
                    statusCode: 200,
                    message: "Items refreshed"
                }));
        });
    }
    else res.end(JSON.stringify({
                    statusCode: 400,
                    message: "Malformed request."
                }));
});

/** instantiate the general purpose operations class */
ProcessorHandle = new ProcessorModule.Processor();


/*var SSLOpt = ProcessorHandle.generateSSLOptions(fs, __dirname);
var server = https.createServer(SSLOpt, app);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});*/

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

/** database connection */
var dbHandle = new databaseModule.database();
dbHandle.connectToDatabase(mongoose, function(response){
    console.log(">> "+response.message);
    logger.info(">> "+response.message)
    if(response.statusCode === 200){
        isConnectedToDb = true;
        
        /** instantiate all Model classes */
        SchemaModelHandle = new SchemaModelModule.SchemaModel();
        UsersModel = SchemaModelHandle.getUserModel(mongoose);
        ShopItemModel = SchemaModelHandle.getShopItemModel(mongoose);
        BidItemModel = SchemaModelHandle.getBidItemModel(mongoose);
        UserDetailsModel = SchemaModelHandle.getUserDetailsModel(mongoose);
        
        UserDetailsHandle = new UserDetailsModule.UserOps();
        
        /** set up the Redis connection */
        RedisHandle = new redisClientModule.Redis();
        redisClient = RedisHandle.createClient(redis);
        RedisHandle.connectToClient(redisClient, function(){
            console.log(">> Connected to Redis successfully.");
            logger.info(">> Connected to Redis successfully.");
        
            /** fill in all shop items into the cache */
            RedisHandle.refreshContent(redisClient, ShopItemsList, dbHandle, ShopItemModel, function(err, res){
               if(err)console.log(">> Error while inserting shopping items into cache...");
                else{
                    console.log(">> shopping items inserted into Redis successfully.");
                    logger.info(">> shopping items inserted into Redis successfully.");
                }              
            });
        });
     }
});

/*UserDetailsHandle.sendMailtoUser(http, querystring, "12345", "123456", "abinash.m432@gmail.com", function(response){
     console.log(response.message);            
});*/
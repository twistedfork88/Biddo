exports.UserOps = function(){}
exports.UserOps.prototype = {
    createUser: function(dbHandle, model, data, callback){
        var self = this;
        dbHandle.retrieveFromDatabase(
            model, { 
                $or: [{
                        userid: data.userid
                    },{
                        useremail: data.useremail
                    }
                ]
            },
            "userid",
            "unique",
            function(resp){
                if(resp.statusCode === 200){
                    var doc = resp.message;
                    if(doc && doc.userid){
                        callback({
                            statusCode: 400,
                            message: 'User and/or Email already registered.'
                        });
                    }
                    else{
                        dbHandle.insertIntoDatabase(model, data, function(resp2){
                            if(resp2.statusCode === 200){
                                callback({
                                    statusCode: 200,
                                    message: 'User created successfully'
                                });
                            }
                            else callback(resp2);
                        });
                    }
                }
            }
        );
    },
    queryUser: function(dbHandle, model, conditions, projections, options, callback){
        dbHandle.retrieveFromDatabase(
            model,
            conditions,
            projections,
            options,
            function(resp){
                if(resp.statusCode === 200){
                    var doc = resp.message;
                    if(doc){
                        callback({
                            statusCode: 200,
                            message: doc
                        });
                    }
                    else callback(resp);
                }
                else callback(resp);
            }
        );
    },
    updateUser: function(dbHandle, model, user, update, callback){
        dbHandle.updateInDatabase(
            model, 
            { userid: user}, 
            update, 
            {}, 
            function(resp){
                if(resp.statusCode === 200)
                    callback({
                        statusCode: 200,
                        message: 'User data updated successfully'
                    });
                else callback(resp);                    
            }
        );
    },
    /** generates a salt */
    generateSaltSync: function(bcrypt, rounds){
        return bcrypt.genSaltSync(rounds);
    },
    /** bcrypt password hash */
    generateBcryptHash: function(bcrypt, data, salt){
        return bcrypt.hashSync(data, salt);
    },
    /** synchronously compare original and hash */
    compareBcryptHashSync: function(bcrypt, original, hash){
        return bcrypt.compareSync(original, hash);
    },
    /** initialize the SHASHUM */
    initializeSHA1SUM: function(crypto){
         var shasum = crypto.createHash('sha1');
         return shasum;
    },
    /** creates the SHA1 digest for a string */
    createSHA1Digest: function(shasum, input){
         var sum = shasum.update(input);
         return sum.digest('hex');
    },
    generateMailContent: function(user, activationcode){
        var body = "<p>Hi "+user+",</p>";
        body+="You have successfully registered for SAP BIDDO. Kindly follow the link below to activate and complete your registration. Kindly do use Chrome browser for the activation.<br/><br/>";
        body+="<a href='10.52.99.54:3000/activateuser?user="+user+"&activation="+activationcode+"'>activate</a>";
        body+="<br/>Regards,<br/>BIDDO team.";
        
        var out = {
            heading: "SAP BIDDO registration",
            body: body
        }
        
        return out;
    },
    sendMailtoUser: function(type, http, querystring, user, activation, email, callback){
        var mailcontent = this.generateMailContent(user, activation);
        
        var dataToSend = {
            type: 'sendmail',
            user: user,
            to: email,
            content: activation,
            eventtype: type
        };
        console.log(dataToSend)
        
        var dataString = querystring.stringify(dataToSend);        
        var httpOptions = {
            host: '10.52.67.63',
            port: 8080,
            path: '/BIDDO/Servlet',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': dataString.length
            }
        };
        
        var postReq = http.request(httpOptions, function(res){
            res.setEncoding('utf-8');

            var responseString = '';
            res.on('data', function(data) {                
                responseString += data;
                console.log(">> response is "+responseString);
            });

            res.on('end', function() {
               console.log(">> response receipt complete...");
               var responseObj = JSON.parse(responseString);
               callback(responseObj);
            });
        });
        
        //catch connection exceptions
        postReq.on('error', function(err){
            console.log(">> error during communication with MAIL server.\n"+err);     
        });
        
        postReq.write(dataString);
        postReq.end();
    },
    setUserCookies: function(response, cookies){
        for(var cookie in cookies){
            response.cookie(cookie, cookies[cookie]);
        }
        return response;
    },
    clearUserCookies: function(response){
        var cookies = ['X-request-user', 'X-request-username', 'hieallmnrstta', 'X-CSRF-Token'];
        for(var i=0;i<cookies.length;i++)response.clearCookie(cookies[i]);
        return response;
    },
    getCSRFTokenFromRequest: function(request){
        var _csrf = request.headers['x-csrf-token-header'];
        return _csrf;
    },
    processUserPOSTRequest: function(req, res){
        //check CSRF token to proceed
        var _csrf = this.getCSRFTokenFromRequest(req);
        if(_csrf !== req.session._csrf.toString()){
            console.log(">> CSRF tokens do not match!")
            res.end(
                JSON.stringify({
                    statusCode: 403,
                    message: 'You are not authorized to perform this action.'
                })
            );
            return;
        }
    }
}
/**
 * Database class addressing connecting/disconnecting
 * supporting CRUD operations. Index creations are also
 * supported.
 */

exports.database = function(){
    this.databaseLink = "mongodb://localhost/biddo";
}
exports.database.prototype = {
    connectToDatabase: function(mongoose, callback){
        mongoose.connect(this.databaseLink);
        callback({
            statusCode: 200,
            message: 'Connected to MondoDb successfully'
        });
    },
    disconnectDatabase: function(mongoose){
    
    },
    insertIntoDatabase: function(Model, Data, Callback){
        var that = this;
        Model.create(Data, function(err, doc){
            that.processOutput(err, doc, Callback);
        });
    },
    retrieveFromDatabase: function(Model, Conditions, Projections, Options, Callback){
        var that = this;
        if(Options === 'unique'){
            
            Model.findOne(Conditions, Projections, function(err, doc){
                if(doc){
                    that.processOutput(err, doc, Callback);
                }
                else that.processOutput(err, null, Callback);
            });
        }
        else{
            Model.find(Conditions, Projections, function(err, docs){
                if(docs && docs.length){
                    that.processOutput(err, docs, Callback);
                }
                else that.processOutput(err, [], Callback);
            });
        }
    },
    updateInDatabase: function(Model, Conditions, Update, Options, Callback){
        var that = this;
        Model.update(Conditions, Update, Options, function(err, numAffected){            
            if(err)that.processOutput(err, "", Callback);
            else that.processOutput(err, "Document updated successfully.", Callback);
        });
    },
    deleteFromDatabase: function(mongoose, model, conditions){
    
    },
    processOutput: function(err, response, Callback){
        if(err){
            Callback({
                statusCode: 500,
                message: err.message
            });
        }
        else Callback({
            statusCode: 200,
            message: response
        });
    }
}
/**
 * SAP LDAP communication class.
 * Will be used to determine the logged in
 * user details like username and userid
 */

exports.LDAP = function(){}
exports.LDAP.prototype = {
    createClient: function(ldap, url, credentials){
        return ldap.createClient({
            url: url,
            bindCredentials: credentials
        });
    },
    search: function(client, dn, filter, callback){
        var opts = {
            filter: filter  //(user=userid)
        };
        
        client.search(dn, opts, function(err, res){
            res.on('searchEntry', function(entry){
                console.log(entry);
            });
            res.on('error', function(err){
                console.log(err); 
            });
            res.on('end', function(result){
                console.log(result);
            });        
        });
    }
}
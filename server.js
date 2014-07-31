/**
 * Module dependencies.
 */
 
var tinyurl_version = "0.0.11"; //DO NOT EDIT
var https = require('https');
var options = {
    host: 'raw.githubusercontent.com',
    path: '/Dasoren/tinyurl/master/version'
}
var request = https.request(options, function (res) {
    var data = '';
    res.on('data', function (chunk) {
        data += chunk;
    });
    res.on('end', function () {
        var tinyurl_version_new = data;
        if(tinyurl_version_new == tinyurl_version){
            console.log("This version ("+tinyurl_version+") is up to date.");
        }else{
            console.log("-- This version ("+tinyurl_version+") is OUT of date.\n-- The new version is ("+tinyurl_version_new+")\n-- Please update by running git clone git://github.com/dasoren/tinyurl.git from the tinyurl folder.\n-- This will not edit your configuration files.");
        }
    });
});
request.on('error', function (e) {
    console.log(e.message);
});
request.end();
 

var express = require('express')
var redis = require("redis"),
    client = redis.createClient();
var fs = require('fs');
client.select('10');

var app = module.exports = express.createServer();

// TTL times for random and customs
var ttl = 2592000;  // Random link time out
var cttl = 7776000;  // Custom link time out
var log_ttl = 605800; // Log time out
// Your Tiny URL
var host_url = 'http://127.0.0.1:8092/';
// Your Default URL
var default_link = 'http://127.0.0.1';
// Redis var naming
var redis_custom = 'tiny:custom:';
var redis_random = 'tiny:random:';
var redis_v1 = 'tiny:v1:';
var redis_v1_log = 'tiny:v1:log:';
// Master delete passowrd
var master_pass = '';
if(master_pass == ''){
    master_pass = randomString(20);
    console.log('-- Master Pass is '+master_pass+' ');
}


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

//Return a random String
function randomString(stringLength) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 5;
    if(typeof stringLength == 'number'){
        string_length = stringLength;
    }
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

//API Version 1.0

app.del('/v1/:id', function(req, res){
    var query = require('url').parse(req.url,true).query;
    var id = req.params.id;
    if(query.pass == null){
        var pass = '';
    }else{
        var pass = query.pass;
    }
    client.hgetall(redis_custom+id, function(err, hash) {
        if(hash != null){
            if(pass == master_pass){
                client.del(redis_custom+id);
                res.writeHead(202, {  'message': id+' being deleted'});
                res.end('{error: 202, message: '+id+' being deleted}');
                client.hmset(redis_v1_log+id, 'type', 'delete', 'ip', req.connection.remoteAddress, 'timedate', Math.round(Date.now() / 1000), 'note', 'deleted with master password');
                client.ttl(redis_v1_log+id, log.ttl);
            }else if(hash.remove != null){
                if(hash.remove == pass){
                    client.del(redis_custom+id);
                    res.writeHead(202, {  'message': id+' being deleted'});
                    res.end('{error: 202, message: '+id+' being deleted}');
                    client.hmset(redis_v1_log+id, 'type', 'delete', 'ip', req.connection.remoteAddress, 'timedate', Math.round(Date.now() / 1000), 'note', 'deleted with password');
                    client.ttl(redis_v1_log+id, log_ttl);
                }else{
                    res.writeHead(401, {  'message': 'Password is incorect'});
                    res.end('{error: 401, Password is incorect}');
                }
            }else{
                res.writeHead(401, {  'message': id+' No password found, can not be deleted.'});
                res.end('{error: 201, message: '+id+' No password found, can not be deleted.}');
            }
        }else{
            res.writeHead(404, {  'message': id+' not found'});
            res.end('{error: 404, message: '+id+' not found}');
        }
    });
}); 

app.post('/v1/new', function(req, res){
    url = require('url');
    var query = require('url').parse(req.url,true).query;
    var urlc = query.url;
    urlc = url.parse(urlc);
    if(urlc.protocol == null){
        var protocol = 'http:';
    }else{
        var protocol = urlc.protocol;
    }
    if(urlc.path == null){
        var path = '';
    }else{
        var path = urlc.path;
    }
    if(query.pass == null){
        var pass = randomString(4);
    }else{
        var pass = query.pass;
    }
    if(query.name == undefined){
        var name = randomString(5);
    }else if(query.name != undefined){
        var name = query.name;
        console.log('part 2');
    }
    if(query.url == undefined){
        res.send({error: 'No URL was entered.'});
  	}else{
        client.hgetall(redis_v1+name, function(err, hash){
            if(hash == null){
                client.hmset(redis_v1+name, 'url', urlc.host, 'protocol', protocol, 'path', path, 'remove', pass, 'ip', req.connection.remoteAddress, 'timedate', Math.round(Date.now() / 1000));
                client.hincrby(redis_v1+name, 'views', 1);
                client.expire(redis_v1+name, ttl);
                res.writeHead(201, { 'message': name+' Created'});
                res.end('{error: 201, message: '+name+' Created, protocol: '+protocol+', url: '+urlc.host+', path: '+path+', pass: '+pass+', link: '+host_url+name+'}');
            }else{
                client.ttl(redis_v1+query.name, function(err, ttl){
                    res.writeHead(409, {  'message': query.name+' in use'});
                    res.end('{error: 409, message: '+query.name+' in use, name: '+query.name+', link: '+hash.protocol+'//'+hash.url+hash.path+', ttl: '+ttl+'}');
                });
            }
        });
    }
});

app.get('/v1/new', function(req, res){
    url = require('url');
    var query = require('url').parse(req.url,true).query;
    var urlc = query.url;
    urlc = url.parse(urlc);
    if(urlc.protocol == null){
        var protocol = 'http:';
    }else{
        var protocol = urlc.protocol;
    }
    if(urlc.path == null){
        var path = '';
    }else{
        var path = urlc.path;
    }
    if(query.pass == null){
        var pass = randomString(4);
    }else{
        var pass = query.pass;
    }
    if(query.name == undefined){
        var name = randomString(5);
    }else if(query.name != undefined){
        var name = query.name;
    }
    if(query.url == undefined){
        res.send({error: 'No URL was entered.'});
  	}else{
        client.hgetall('tiny:v1:'+name, function(err, hash){
            if(hash == null){
                client.hmset('tiny:v1:'+name, 'url', urlc.host, 'protocol', protocol, 'path', path, 'remove', pass);
                client.hincrby('tiny:v1:'+name, 'views', 1);
                client.expire('tiny:v1:'+name, ttl);
                res.writeHead(201, { 'message': name+' Created'});
                res.end('{error: 201, message: '+name+' Created, protocol: '+protocol+', url: '+urlc.host+', path: '+path+', pass: '+pass+', link: '+host_url+name+'}');
            }else{
                client.ttl('tiny:v1:'+query.name, function(err, ttl){
                    res.writeHead(409, {  'message': query.name+' in use'});
                    res.end('{error: 409, message: '+query.name+' in use, name: '+query.name+', link: '+hash.protocol+'//'+hash.url+hash.path+', ttl: '+ttl+'}');
                });            
            }
        });
    }
});

app.get('/v1/stats/:id', function(req, res){
    if(req.params.id == undefined){
  		res.send({error: 'No ID was entered.'});
  	}else{
  		var id = req.params.id;
	  	client.hgetall(redis_v1+id, function(err, hash) {
            if(hash != null){
                res.writeHead(200, { 'message': id+' Stats'});
                res.end('{error: 200, message: '+id+' Stats, views: '+hash.views+' protocol: '+hash.protocol+', url: '+hash.url+', path: '+hash.path+', link: '+host_url+id+'}');
            }else{
                res.writeHead(404, {error: 'Invalid ID was entered.'});
                res.end('{error: 404, message: Invalid ID was entered}');
            }
        });
    }
});

app.get('/v1/:id', function(req, res){
  	if(req.params.id == undefined){
  		res.send({error: 'No ID was entered.'});
  	}else{
  		var id = req.params.id;
	  	client.hgetall(redis_v1+id, function(err, hash) {
	  		if(hash != null){
                if(hash.protocol != null){
                    client.hincrby(redis_v1+id, 'views', 1);
                    client.expire(redis_v1+id, ttl);
                    res.writeHead(302, {  'Location': hash.protocol+'//'+hash.url+hash.path});
                    res.end('{error: 302, message: moved location: '+hash.protocol+'//'+hash.url+'}');
                    process.stdout.write(host_url+id+' used\n');
                }else{
                    client.hincrby(redis_v1+id, 'views', 1);
                    client.expire(redis_v1+id, ttl);
                    res.writeHead(302, {  'Location': 'http://'+hash.url+hash.path});
                    res.end('{error: 302, message: moved location: http://'+hash.url+'}');
                    process.stdout.write(host_url+id+' used\n');
                }
	   		}else{
                res.writeHead(404, {error: 'Invalid ID was entered.'});
                res.end('{error: 404, message: Invalid ID was entered}');
	   		}
		});
    }
});

app.get('/v1/', function(req,res){
    res.writeHead(302, {  'Location': default_link});
	res.end();
});

//API Old

app.del('/:id?', function(req, res){
    var query = require('url').parse(req.url,true).query;
    var id = req.params.id;
    if(query.pass == null){
        var pass = '';
    }else{
        var pass = query.pass;
    }
    client.hgetall(redis_custom+id, function(err, hash) {
        if(hash != null){
            if(hash.remove != null){
                if(hash.remove == pass){
                    client.del(redis_custom+id);
                    res.writeHead(202, {  'message': id+' being deleted'});
                    res.end('{error: 202, message: '+id+' being deleted}');
                }else{
                    res.writeHead(401, {  'message': 'Password is incorect'});
                    res.end('{error: 401, Password is incorect}');
                }
            }else{
                client.del(redis_custom+id);
                res.writeHead(202, {  'message': id+' being deleted'});
                res.end('{error: 202, message: '+id+' being deleted}');
            }
        }else{
            client.hgetall(redis_random+id, function(err, hash) {
                if(hash.remove != null){
                    if(hash.remove == pass){
                        client.del(redis_random+id);
                        res.writeHead(202, {  'message': id+' being deleted'});
                        res.end('{error: 202, message: '+id+' being deleted}');
                    }else{
                        res.writeHead(401, {  'message': 'Password is incorect'});
                        res.end('{error: 401, Password is incorect}');
                    }
                }else{
                    client.del(redis_random+id);
                    res.writeHead(202, {  'message': id+' being deleted'});
                    res.end('{error: 202, message: '+id+' being deleted}');
                }
            });
        }
    });
}); 

app.post('/new', function(req, res){
    url = require('url');
    var query = require('url').parse(req.url,true).query;
    var urlc = query.url;
    urlc = url.parse(urlc);
    if(urlc.protocol == null){
        var protocol = 'http:';
    }else{
        var protocol = urlc.protocol;
    }
    if(urlc.path == null){
        var path = '';
    }else{
        var path = urlc.path;
    }
    if(query.pass == null){
        var pass = '';
    }else{
        var pass = query.pass;
    }
    if(query.url == undefined){
        res.send({error: 'No URL was entered.'});
  	} else if(query.name == undefined){
        query.name = randomString();
    }else{
        client.hgetall(redis_custom+query.name, function(err, hash){
            if(hash == null){
                client.hmset("tiny:custom:"+query.name, 'url', urlc.host, 'protocol', protocol, 'path', path, 'remove', pass);
                client.hincrby(redis_custom+query.name, 'views', 1);
                client.expire(redis_custom+query.name, cttl);
                res.writeHead(201, { 'message': query.name+' Created'});
                res.end('{error: 201, message: '+query.name+' Created, protocol: '+protocol+', url: '+urlc.host+', path: '+path+', pass: '+pass+', link: '+host_url+query.name+'}');
            }else{
                client.ttl(redis_custom+query.name, function(err, ttl){
                    res.writeHead(409, {  'message': query.name+' in use'});
                    res.end('{error: 409, message: '+query.name+' in use, name: '+query.name+', link: '+hash.protocol+'//'+hash.url+hash.path+', ttl: '+ttl+'}');
                });
            }
        });
    }
});

app.get('/new', function(req, res){
    url = require('url');
    var query = require('url').parse(req.url,true).query;
    var urlc = query.url;
    urlc = url.parse(urlc);
    if(urlc.protocol == null){
        var protocol = 'http:';
    }else{
        var protocol = urlc.protocol;
    }
    if(urlc.path == null){
        var path = '';
    }else{
        var path = urlc.path;
    }
    if(query.pass == null){
        var pass = '';
    }else{
        var pass = query.pass;
    }
    if(query.url == undefined){
        res.send({error: 'No URL was entered.'});
  	} else if(query.name == undefined){
        query.name = randomString();
    }else{
        client.hgetall(redis_custom+query.name, function(err, hash){
            if(hash == null){
                client.hmset("tiny:custom:"+query.name, 'url', urlc.host, 'protocol', protocol, 'path', path, 'remove', pass);
                client.hincrby(redis_custom+query.name, 'views', 1);
                client.expire(redis_custom+query.name, cttl);
                res.writeHead(201, { 'message': query.name+' Created'});
                res.end('{error: 201, message: '+query.name+' Created, protocol: '+protocol+', url: '+urlc.host+', path: '+path+', pass: '+pass+', link: '+host_url+query.name+'}');
            }else{
                client.ttl(redis_custom+query.name, function(err, ttl){
                    res.writeHead(409, {  'message': query.name+' in use'});
                    res.end('{error: 409, message: '+query.name+' in use, name: '+query.name+', link: '+hash.protocol+'//'+hash.url+hash.path+', ttl: '+ttl+'}');
                });
            }
        });
    }
});
// OLD API id code
app.get('/:id', function(req, res){
  	if(req.params.id == undefined){
  		res.send({error: 'No ID was entered.'});
  	}else{
  		var id = req.params.id;
	  	client.hgetall(redis_custom+id, function(err, hash) {
	  		if(hash != null){
                if(hash.protocol != null){
                    client.hincrby(redis_custom+id, 'views', 1);
                    client.expire(redis_custom+id, cttl);
                    res.writeHead(302, {  'Location': hash.protocol+'//'+hash.url+hash.path});
                    res.end('{error: 302, message: moved location: '+hash.protocol+'//'+hash.url+'}');
                    process.stdout.write(host_url+id+' used\n');
                }else{
                    client.hincrby(redis_custom+id, 'views', 1);
                    client.expire(redis_custom+id, cttl);
                    res.writeHead(302, {  'Location': 'http://'+hash.url+hash.path});
                    res.end('{error: 302, message: moved location: http://'+hash.url+'}');
                    process.stdout.write(host_url+id+' used\n');
                }
	   		}else{
                client.hgetall('url:tiny:'+id, function(err, hash) {
                    if(hash != null){
                        if(hash.protocol != null){
                            client.hincrby(redis_random+id, 'views', 1);
                            client.expire(redis_random+id, ttl);
                            res.writeHead(302, {  'Location': hash.protocol+'//'+hash.url+hash.path});
                            res.end('{error: 302, message: moved location: '+hash.protocol+'//'+hash.url+'}');
                            process.stdout.write(host_url+id+' used\n');
                        }else{
                            client.hincrby(redis_random+id, 'views', 1);
                            client.expire(redis_random+id, ttl);
                            res.writeHead(302, {  'Location': 'http://'+hash.url+hash.path});
                            res.end('{error: 302, message: moved location: http://'+hash.url+'}');
                            process.stdout.write(host_url+id+' used\n');
                        }
                    }else{
                        res.writeHead(404, {error: 'Invalid ID was entered.'});
                        res.end('{error: 404, message: Invalid ID was entered}');
                        process.stdout.write(host_url+id+' was tried, no value found\n');
                    }
                });
	   		}
		});
    }
});
// API v1 id code
/*
app.get('/:id', function(req, res){
  	if(req.params.id == undefined){
  		res.send({error: 'No ID was entered.'});
  	}else{
  		var id = req.params.id;
	  	client.hgetall(redis_v1+id, function(err, hash) {
	  		if(hash != null){
                if(hash.protocol != null){
                    client.hincrby(redis_v1+id, 'views', 1);
                    client.expire(redis_v1+id, ttl);
                    res.writeHead(302, {  'Location': hash.protocol+'//'+hash.url+hash.path});
                    res.end('{error: 302, message: moved location: '+hash.protocol+'//'+hash.url+'}');
                    process.stdout.write(host_url+id+' used\n');
                }else{
                    client.hincrby(redis_v1+id, 'views', 1);
                    client.expire(redis_v1+id, ttl);
                    res.writeHead(302, {  'Location': 'http://'+hash.url+hash.path});
                    res.end('{error: 302, message: moved location: http://'+hash.url+'}');
                    process.stdout.write(host_url+id+' used\n');
                }
	   		}else{
                res.writeHead(404, {error: 'Invalid ID was entered.'});
                res.end('{error: 404, message: Invalid ID was entered}');
	   		}
		});
    }
});
*/
app.get('/', function(req,res){
    res.writeHead(302, {  'Location': default_link});
	res.end();
});

// Redis Error:
client.on("error", function (err) {
        console.log("Error " + err);
});

app.listen(8092);
console.log("TinyURL server listening on port 8092");

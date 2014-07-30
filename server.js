// Version 0.0.1
/**
 * Module dependencies.
 */
 
var tinyurl_version = "0.0.1"; 
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
var cttl = 7776000;  //Custom link time out
// your Tiny URL
var host_url = 'http://127.0.0.1:8092/';
// Your Default URL
var default_link = 'http://127.0.0.1';

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

//Return a random String
function randomString() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 5;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

app.del('/:id?', function(req, res){
    var query = require('url').parse(req.url,true).query;
    var id = req.params.id;
    if(query.pass == null){
        var pass = '';
    }else{
        var pass = query.pass;
    }
    client.hgetall('tiny:custom:'+id, function(err, hash) {
        if(hash != null){
            if(hash.remove != null){
                if(hash.remove == pass){
                    client.del('tiny:custom:'+id);
                    res.writeHead(202, {  'message': id+' being deleted'});
                    res.end('{error: 202, message: '+id+' being deleted}');
                }else{
                    res.writeHead(401, {  'message': 'Password is incorect'});
                    res.end('{error: 401, Password is incorect}');
                }
            }else{
                client.del('tiny:custom:'+id);
                res.writeHead(202, {  'message': id+' being deleted'});
                res.end('{error: 202, message: '+id+' being deleted}');
            }
        }else{
            client.hgetall('tiny:random:'+id, function(err, hash) {
                if(hash.remove != null){
                    if(hash.remove == pass){
                        client.del('tiny:random:'+id);
                        res.writeHead(202, {  'message': id+' being deleted'});
                        res.end('{error: 202, message: '+id+' being deleted}');
                    }else{
                        res.writeHead(401, {  'message': 'Password is incorect'});
                        res.end('{error: 401, Password is incorect}');
                    }
                }else{
                    client.del('tiny:random:'+id);
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
        client.hgetall('tiny:custom:'+query.name, function(err, hash){
            if(hash == null){
                client.hmset("tiny:custom:"+query.name, 'url', urlc.host, 'protocol', protocol, 'path', path, 'remove', pass);
                client.hincrby('tiny:custom:'+query.name, 'views', 1);
                client.expire('tiny:custom:'+query.name, cttl);
                res.writeHead(201, { 'message': query.name+' Created'});
                res.end('{error: 201, message: '+query.name+' Created, protocol: '+protocol+', url: '+urlc.host+', path: '+path+', pass: '+pass+', link: '+host_url+query.name+'}');
            }else{
                client.ttl('tiny:custom:'+query.name, function(err, ttl){
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
        client.hgetall('tiny:custom:'+query.name, function(err, hash){
            if(hash == null){
                client.hmset("tiny:custom:"+query.name, 'url', urlc.host, 'protocol', protocol, 'path', path, 'remove', pass);
                client.hincrby('tiny:custom:'+query.name, 'views', 1);
                client.expire('tiny:custom:'+query.name, cttl);
                res.writeHead(201, { 'message': query.name+' Created'});
                res.end('{error: 201, message: '+query.name+' Created, protocol: '+protocol+', url: '+urlc.host+', path: '+path+', pass: '+pass+', link: '+host_url+query.name+'}');
            }else{
                client.ttl('tiny:custom:'+query.name, function(err, ttl){
                    res.writeHead(409, {  'message': query.name+' in use'});
                    res.end('{error: 409, message: '+query.name+' in use, name: '+query.name+', link: '+hash.protocol+'//'+hash.url+hash.path+', ttl: '+ttl+'}');
                });
            }
        });
    }
});

app.get('/:id', function(req, res){
  	if(req.params.id == undefined){
  		res.send({error: 'No ID was entered.'});
  	}else{
  		var id = req.params.id;
	  	client.hgetall('tiny:custom:'+id, function(err, hash) {
	  		if(hash != null){
                if(hash.protocol != null){
                    client.hincrby('tiny:custom:'+id, 'views', 1);
                    client.expire('tiny:custom:'+id, cttl);
                    res.writeHead(302, {  'Location': hash.protocol+'//'+hash.url+hash.path});
                    res.end('{error: 302, message: moved location: '+hash.protocol+'//'+hash.url+'}');
                    process.stdout.write(host_url+id+' used\n');
                }else{
                    client.hincrby('tiny:custom:'+id, 'views', 1);
                    client.expire('tiny:custom:'+id, cttl);
                    res.writeHead(302, {  'Location': 'http://'+hash.url+hash.path});
                    res.end('{error: 302, message: moved location: http://'+hash.url+'}');
                    process.stdout.write(host_url+id+' used\n');
                }
	   		}else{
                client.hgetall('url:tiny:'+id, function(err, hash) {
                    if(hash != null){
                        if(hash.protocol != null){
                            client.hincrby('tiny:random:'+id, 'views', 1);
                            client.expire('tiny:random:'+id, ttl);
                            res.writeHead(302, {  'Location': hash.protocol+'//'+hash.url+hash.path});
                            res.end('{error: 302, message: moved location: '+hash.protocol+'//'+hash.url+'}');
                            process.stdout.write(host_url+id+' used\n');
                        }else{
                            client.hincrby('tiny:random:'+id, 'views', 1);
                            client.expire('tiny:random:'+id, ttl);
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

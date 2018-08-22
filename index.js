// console.log('Hello World!');
/*
*Primary File for API
*
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');

const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// The server should respond to all request with a string
// Instantiate the http server
const httpServer = http.createServer(function(req,res){
    unifiedServer(req,res);
});

// Start the server, and have it listen on port 3000
httpServer.listen(config.httpPort, function(){
    console.log('The server is listening on port '+config.httpPort+' in '+ config.envName +' mode');
});
// Instantiate the https server
var httpsServerOptions = {
    'key':fs.readFileSync('./https/key.pem'),
    'cert':fs.readFileSync('./https/cert.pem')
}

const httpsServer = https.createServer(httpsServerOptions, function(req,res){
    unifiedServer(req,res);
});

// start the https server
httpsServer.listen(config.httpsPort, function(){
    console.log('The server is listening on port '+config.httpsPort+' in '+ config.envName +' mode');
});

// All the server logic for both http and https server
const unifiedServer = function(req, res){
    // Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the Path
    const path = parsedUrl.pathname;
    const trimmedPath=path.replace(/\/+|\/+$/g,'')

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get HTTP Method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });

    req.on('end',function(){
        buffer += decoder.end();
        
        // Choose the handler this request should go to. If one not found , use notfound handler
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        // construct the data object to send to the handler
        const data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };
        // Route the request to the handler specified to the router
        chosenHandler(data, function(statusCode, payload){
            // use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            // use the status code called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};
            
            // convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log('returning this response: ', statusCode, payloadString);
        });
    });
}
// Define a request route
const router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};
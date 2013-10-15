var parseString = require('xml2js').parseString;
var request = require('request');
var querystring = require('querystring');

exports.init = function(msg, cfg, cb) {
  debug('init');
};

exports.process = function(msg, cfg, next) {
  debug('process');
  var attachments = msg.attachments;
  debug(JSON.stringify(attachments));
  for (var file in attachments) {
    debug(file);
    var content = attachments[file].content;
    debug(content);
    if (typeof content === 'string') {
      decoded = new Buffer(content, 'base64').toString('utf8');
      debug(decoded);
      var parseString = require('xml2js').parseString;
      parseString(decoded, process_data);
    }
  }
};

process_data = function(err, result) {
  debug(JSON.stringify(result));
};

exports.debug = function(msg) {
  console.log("DEBUG: " + msg);
};

exports.login = function(project, clientId, clientSecret, callback) {
  var params = {
    'grant_type': 'client_credentials',
    'scope': 'manage_project:' + project
  };
  var payload = querystring.stringify(params);
  console.log('123')

  var request_options = {
    uri: 'https://' + clientId + ':' + clientSecret + '@' + 'auth.sphere.io/oauth/token',
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': payload.length
    },
    timeout: 20000
  };

  request(request_options, function(error, response, body) {
    console.log(response.statusCode)
    var jsonBody = JSON.parse(body)

    if (response.statusCode == 200) {
      console.log(jsonBody.access_token);
      callback(jsonBody.access_token);
    } else {
      throw new Error('Failed to get access token.')
      callback();
    }
  })
};

exports.createProduct = function(token, project, product) {
  var requestOptions = {
    uri: 'https://api.sphere.io' + "/" +  project + "/product",
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    body: product,
    timeout: 20000
  }
  console.log(requestOptions)

  request(requestOptions, function(error, response, body) {
    console.log(response.statusCode)
    //console.log(error)
    //console.log(body)
    if (response.statusCode == 200) {
      products = JSON.parse(body)
      console.log(products)
    }
  })
};

exports.shutdown = function(msg, cfg, cb, snapshot) {
  debug('shutdown');
};

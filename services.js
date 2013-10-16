var request = require('request');
var querystring = require('querystring');

debug = function(msg) {
  console.log("DEBUG: " + msg);
};

exports.process = function(msg, cfg, next) {
  debug('process');
  debug('process - msg: ' + msg);

  var now = new Date();
  var content = new Buffer("Hello World at " + now).toString('base64');

  var data = {
    body : {},
    attachments: {
      "data.xml" : {
        "content" : content
      }
    }
  };

  console.log("NEXT");
  console.log(data)
  next(null, data);
};

exports.login = function(projectKey, clientId, clientSecret, callback) {
  debug('login');
  var params = {
    'grant_type': 'client_credentials',
    'scope': 'manage_project:' + projectKey
  };
  var payload = querystring.stringify(params);

  var request_options = {
    uri: 'https://' + clientId + ':' + clientSecret + '@' + 'auth.sphere.io/oauth/token',
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': payload.length
    },
    timeout: 3000
  };

  request(request_options, function(error, response, body) {
    debug('login - status: ' + response.statusCode);
    var jsonBody = JSON.parse(body);

    if (response.statusCode == 200) {
      debug('login - token: ' + jsonBody.access_token);
      exports.accessToken = jsonBody.access_token;
      callback(projectKey, jsonBody.access_token);
    } else {
      throw new Error('Failed to get access token.')
      callback();
    }
  });
};

exports.getCustomers = function(projectKey, accessToken) {
  var request_options = {
    uri: 'https://api.sphere.io/' + projectKey + '/customers',
    method: 'GET',
    headers: {
      'Auhorization': 'Bearer ' + accessToken
    },
    timeout: 3000
  };
};

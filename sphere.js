var request = require('request');
var querystring = require('querystring');

debug = function(msg) {
  console.log("DEBUG: " + msg);
};

exports.login = function(projectKey, clientId, clientSecret, callback, finish) {
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
      'User-Agent': 'elastic.io <-> sphere.io: order export',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': payload.length
    },
    timeout: 3000
  };

  request(request_options, function(error, response, body) {
    debug('login - status: ' + response.statusCode);

    if (response.statusCode === 200) {
      var jsonBody = JSON.parse(body);
      debug('login - token: ' + jsonBody.access_token);
      callback(projectKey, jsonBody.access_token, exports.mapOrders, finish);
    } else {
      throw new Error('Failed to get access token - status: ' + response.statusCode);
    }
  });
};

exports.getOrders = function(projectKey, accessToken, callback, finish) {
  debug("getOrders of project '" + projectKey + "'");
  var request_options = {
    uri: 'https://api.sphere.io/' + projectKey + '/orders',
    method: 'GET',
    headers: {
      'User-Agent': 'elastic.io <-> sphere.io: order export',
      'Authorization': 'Bearer ' + accessToken
    },
    timeout: 5000
  };

  request(request_options, function(error, response, body) {
    debug('getOrders - status: ' + response.statusCode);

    if (response.statusCode === 200) {
      var jsonBody = JSON.parse(body);
      callback(jsonBody, finish);
    } else {
      throw new Error("Problem on fetching orders (status " + response.statusCode + "): \n" + body);
    }
  });
};

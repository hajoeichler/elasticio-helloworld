var request = require('request');
var querystring = require('querystring');

debug = function(msg) {
  console.log("DEBUG: " + msg);
};

exports.init = function(msg, cfg, cb) {
  debug('init');
  debug('init - msg: ' + msg);
  debug('init - cfg: ' + cfg);
};

// exports.process = function(msg, cfg, next) {
//   debug('process');
//   debug('process - msg: ' + msg);
//   login(exports.getCustomer);
//   data = {
//     body : {}
//     attachments: {
//       "data.xml" : {
//         "content" : "BASE64 encoded content of the XML file"
//       }
//     }
//   };
//   next(data);
// };
// 
// 
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
      'Auhorization': 'Bearer ' + accessToken,
    },
    timeout: 3000
  };
};

exports.shutdown = function(msg, cfg, cb, snapshot) {
  debug('shutdown');
};

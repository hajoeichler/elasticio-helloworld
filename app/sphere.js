/* ===========================================================
# elasticio-helloworld - v0.1.0
# ==============================================================
# Copyright (C) 2013 Hajo Eichler
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
var debug, querystring, request;

request = require("request");

querystring = require("querystring");

debug = function(msg) {
  return console.log("DEBUG: " + msg);
};

exports.login = function(projectKey, clientId, clientSecret, callback, finish) {
  var params, payload, request_options;
  debug("login");
  params = {
    grant_type: "client_credentials",
    scope: "manage_project:" + projectKey
  };
  payload = querystring.stringify(params);
  request_options = {
    uri: "https://" + clientId + ":" + clientSecret + "@auth.sphere.io/oauth/token",
    method: "POST",
    body: payload,
    headers: {
      "User-Agent": "elastic.io <-> sphere.io: order export",
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": payload.length
    },
    timeout: 3000
  };
  return request(request_options, function(error, response, body) {
    var jsonBody;
    debug("login - status: " + response.statusCode);
    if (response.statusCode === 200) {
      jsonBody = JSON.parse(body);
      debug("login - token: " + jsonBody.access_token);
      return callback(projectKey, jsonBody.access_token, exports.mapOrders, finish);
    } else {
      throw new Error("Failed to get access token - status: " + response.statusCode);
    }
  });
};

exports.getOrders = function(projectKey, accessToken, callback, finish) {
  var request_options;
  debug("getOrders of project " + projectKey);
  request_options = {
    uri: "https://api.sphere.io/" + projectKey + "/orders",
    method: "GET",
    headers: {
      "User-Agent": "elastic.io <-> sphere.io: order export",
      "Authorization": "Bearer " + accessToken
    },
    timeout: 5000
  };
  return request(request_options, function(error, response, body) {
    var jsonBody;
    debug("getOrders - status: " + response.statusCode);
    if (response.statusCode === 200) {
      jsonBody = JSON.parse(body);
      return callback(jsonBody, finish);
    } else {
      throw new Error("Failed to get access token - status: " + response.statusCode);
    }
  });
};

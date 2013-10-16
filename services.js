var request = require('request');
var querystring = require('querystring');
var builder = require('xmlbuilder');

debug = function(msg) {
  console.log("DEBUG: " + msg);
};

exports.process = function(msg, cfg, next) {
  debug('process');
  debug('process - msg: ' + msg);

  var now = new Date();
  var content = new Buffer("Hello World at " + now).toString('base64');

  // exports.login(cfg.projectKey, cfg.clientId, cfg.clientSecret)

  var data = {
    body : {},
    attachments: {
      "data.xml": {
        content: content
      }
    }
  };
  next(data);
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

    if (response.statusCode === 200) {
      var jsonBody = JSON.parse(body);
      debug('login - token: ' + jsonBody.access_token);
      callback(projectKey, jsonBody.access_token);
    } else {
      throw new Error('Failed to get access token with status: ' + response.statusCode);
    }
  });
};

exports.getOrders = function(projectKey, accessToken, callback) {
  debug('getOrders');
  var request_options = {
    uri: 'https://api.sphere.io/' + projectKey + '/orders',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + accessToken
    },
    timeout: 5000
  };

  request(request_options, function(error, response, body) {
    debug('getOrders - status: ' + response.statusCode);

    if (response.statusCode === 200) {
      var jsonBody = JSON.parse(body);
      debug('SPHERE orders: ' + jsonBody.total);
      callback(jsonBody);
    } else {
      debug('Problem on fetching orders: ' + body);
      callback();
    }
  });
};

exports.mapOrders = function(json) {
  var orders = json.results;
  debug('mapOrder: ' + orders.length);
  for (var i = 0; i < orders.length; i++) {
    exports.mapOrder(orders[i]);
  }
};

exports.mapOrder = function(order) {
  var doc = builder.create();
  var xml = doc.begin('order');

  exports.add(xml, order, 'id');
  exports.add(xml, order, 'version');
  exports.add(xml, order, 'createdAt');
  exports.add(xml, order, 'lastModifiedAt');
  exports.add(xml, order, 'customerId');
  exports.add(xml, order, 'customerEmail');
  exports.add(xml, order, 'eevoCusomterId');
  exports.add(xml, order, 'country');
  exports.add(xml, order, 'orderState');
  exports.add(xml, order, 'shipmentState');
  exports.add(xml, order, 'paymentState');

  if (order.taxedPrice !== undefined) {
    var p = order.taxedPrice;
    var xPrice = xml.e('taxedPrice')
    .e('totalNet').e('currencyCode').t(p.totalNet.currencyCode).up().e('centAmount').t(p.totalNet.centAmount).up().up()
    .e('totalGross').e('currencyCode').t(p.totalGross.currencyCode).up().e('centAmount').t(p.totalGross.centAmount).up().up();

    for (var i = 0; i < p.taxPortions.length; i++) {
      var t = p.taxPortions[i];
      xPrice.e('taxPortions')
        .e('rate').t(t.rate).up()
        .e('amount')
          .e('currencyCode').t(t.amount.currencyCode).up()
          .e('centAmount').t(t.amount.centAmount);
    }
  }

  if (order.shippingAddress) {
    exports.mapAddress(xml.e('shippingAddress'), order.shippingAddress);
  }

  if (order.billingAddress) {
    exports.mapAddress(xml.e('billingAddress'), order.billingAddress);
  }

  if (order.customerGroup) {
    var cg = order.customerGroup;
    var xCg = xml.e('customerGroup');
    exports.add(xCg, cg, 'id');
    exports.add(xCg, cg, 'version');
    exports.add(xCg, cg, 'name');
  }

  if (order.paymentInfo) {
    var pi = order.paymentInfo;
    var xPi = xml.e('paymentInfo');
    exports.add(xPi, pi, 'paymentMethod');
    exports.add(xPi, pi, 'paymentID');
  }

  debug('order in xml' + doc.toString());
  return doc;
};

exports.mapAddress = function(xml, address) {
  exports.add(xml, address, 'id');
  exports.add(xml, address, 'title');
  exports.add(xml, address, 'salutation');
  exports.add(xml, address, 'firstName');
  exports.add(xml, address, 'lastName');
  exports.add(xml, address, 'streetName');
  exports.add(xml, address, 'streetNumber');
  exports.add(xml, address, 'additionalStreetInfo');
  exports.add(xml, address, 'postalCode');
  exports.add(xml, address, 'city');
  exports.add(xml, address, 'region');
  exports.add(xml, address, 'state');
  exports.add(xml, address, 'country');
  exports.add(xml, address, 'company');
  exports.add(xml, address, 'department');
  exports.add(xml, address, 'building');
  exports.add(xml, address, 'apartment');
  exports.add(xml, address, 'pOBox');
  exports.add(xml, address, 'phone');
  exports.add(xml, address, 'mobile');
  exports.add(xml, address, 'email');
};

exports.add = function (xml, elem, name) {
  var value = elem[name];
  if (value !== undefined) {
    xml.e(name).t(value).up();
  }
};
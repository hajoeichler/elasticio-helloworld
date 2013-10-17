var request = require('request');
var querystring = require('querystring');
var builder = require('xmlbuilder');

debug = function(msg) {
  console.log("DEBUG: " + msg);
};

exports.process = function(msg, cfg, next) {
  debug('process');

  exports.login(cfg.projectKey, cfg.clientId, cfg.clientSecret, exports.getOrders, next);
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

exports.mapOrders = function(json, finish) {
  var orders = json.results;
  debug('mapOrders: ' + orders.length);

  var data = {
    body: {},
    attachments: {}
  };

  for (var i = 0; i < orders.length; i++) {
    var xmlOrder = exports.mapOrder(orders[i]);
    var fileName = orders[i].id + ".xml";
    var base64 = new Buffer(xmlOrder.toString()).toString('base64');
    data.attachments[fileName] = {
      content: base64
    };
  }
  finish(null, data);
};

exports.mapOrder = function(order) {
  debug('mapOrder: ' + order.id);

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
    var price = order.taxedPrice;
    var xPrice = xml.e('taxedPrice');
    exports.money(xPrice, price, 'totalNet');
    exports.money(xPrice, price, 'totalGross');

    for (var i = 0; i < price.taxPortions.length; i++) {
      var t = price.taxPortions[i];
      var xT = xPrice.e('taxPortions');
      xT.e('rate').t(t.rate);
      exports.money(xT, t, 'amount');
    }
  }

  if (order.shippingAddress) {
    exports.mapAddress(xml.e('shippingAddress'), order.shippingAddress);
  }

  if (order.billingAddress) {
    exports.mapAddress(xml.e('billingAddress'), order.billingAddress);
  }

  exports.customerGroup(xml, order);

  if (order.paymentInfo) {
    var pi = order.paymentInfo;
    var xPi = xml.e('paymentInfo');
    exports.add(xPi, pi, 'paymentMethod');
    exports.add(xPi, pi, 'paymentID');
  }

  if (order.shippingInfo) {
    var si = order.shippingInfo;
    var xSi = xml.e('shippingInfo');
    exports.add(xSi, si, 'shippingMethodName');
    exports.add(xSi, si, 'trackingData');

    exports.price(xSi, si);
    exports.taxRate(xSi, si);
  }

  if (order.lineItems !== undefined) {
    for (var j = 0; j < order.lineItems.length; j++) {
      var li = order.lineItems[j];
      var xLi = xml.e('lineItems');
      exports.add(xLi, li, 'id');
      exports.add(xLi, li, 'productId');
      exports.add(xLi, li, 'name');
      exports.add(xLi, li, 'quantity');

      exports.price(xLi, li);
      exports.taxRate(xLi, li);

      var variant = li.variant;
      var xVariant = xLi.e('variant');
      exports.add(xVariant, variant, 'id');
      exports.add(xVariant, variant, 'sku');

      if (variant.prices !== undefined) {
        for (var k = 0; k < variant.prices.length; k++) {
          exports.priceElem(xVariant.e('prices'), variant.prices[k]);
        }
      }

      if (variant.attributes !== undefined) {
        for (var l = 0; l < variant.attributes.length; l++) {
          exports.attributes(xVariant.e('attributes'), variant.attributes[l])
        }
      }
    }
  }

  debug('order in xml' + doc.toString());
  return doc;
};

exports.attributes = function(xml, elem) {
  xml
    .e('name').t(elem.name).up()
    .e('value').t(elem.value);
};

exports.money = function(xml, elem, name) {
  xml.e(name)
    .e('currencyCode').t(elem[name].currencyCode).up()
    .e('centAmount').t(elem[name].centAmount);
};

exports.price = function(xml, elem) {
  exports.priceElem(xml.e('price'), elem.price)
};

exports.priceElem = function(xP, p) {
  exports.money(xP, p, 'value');
  exports.add(xP, p, 'country');
  exports.customerGroup(xP, p);
};

exports.taxRate = function(xml, elem) {
    var tr = elem.taxRate;
    var xTr = xml.e('taxRate');
    exports.add(xTr, tr, 'id');
    exports.add(xTr, tr, 'name');
    exports.add(xTr, tr, 'amount');
    exports.add(xTr, tr, 'includedInPrice');
    exports.add(xTr, tr, 'country');
    exports.add(xTr, tr, 'state');
};

exports.customerGroup = function(xml, elem) {
  var cg = elem.customerGroup;
  if (cg) {
    var xCg = xml.e('customerGroup');
    exports.add(xCg, cg, 'id');
    exports.add(xCg, cg, 'version');
    exports.add(xCg, cg, 'name');
  }
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
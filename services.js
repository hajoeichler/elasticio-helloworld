var request = require('request');
var querystring = require('querystring');
var builder = require('xmlbuilder');

debug = function(msg) {
  console.log("DEBUG: " + msg);
};

exports.process = function(msg, cfg, next) {
  debug('process');

  exports.mapOrders(msg.body, next);
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
    var base64 = new Buffer(xmlOrder).toString('base64');
    data.attachments[fileName] = {
      content: base64
    };
  }
  finish(null, data);
};

exports.mapOrder = function(order) {
  if (order.id !== undefined) {
    debug('mapOrder: ' + order.id);
  }

  var xml = builder.create('order', { 'version': '1.0', 'encoding': 'UTF-8', 'standalone': true });

  var attribs = [ 'id', 'version', 'createdAt', 'lastModifiedAt', 'customerId', 'customerEmail',
                  'eevoCusomterId', 'country', 'orderState', 'shipmentState', 'paymentState' ];
  for (var i0 = 0; i0 < attribs.length; i0++) {
    exports.add(xml, order, attribs[i0]);
  }

  if (order.taxedPrice !== undefined) {
    var price = order.taxedPrice;
    var xPrice = xml.e('taxedPrice');
    exports.money(xPrice, price, 'totalNet');
    exports.money(xPrice, price, 'totalGross');

    for (var i1 = 0; i1 < price.taxPortions.length; i1++) {
      var t = price.taxPortions[i1];
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

    exports.money(xSi, si, 'price');
    exports.taxRate(xSi, si);
  }

  if (order.lineItems !== undefined) {
    for (var i2 = 0; i2 < order.lineItems.length; i2++) {
      var li = order.lineItems[i2];
      var xLi = xml.e('lineItems');
      exports.add(xLi, li, 'id');
      exports.add(xLi, li, 'productId');
      exports.add(xLi, li.name, 'de', 'name');

      var variant = li.variant;
      var xVariant = xLi.e('variant');
      exports.add(xVariant, variant, 'id');
      exports.add(xVariant, variant, 'sku');
      if (variant.prices !== undefined) {
        for (var i3 = 0; i3 < variant.prices.length; i3++) {
          exports.priceElem(xVariant.e('prices'), variant.prices[i3]);
        }
      }
      if (variant.attributes !== undefined) {
        for (var i4 = 0; i4 < variant.attributes.length; i4++) {
          exports.attributes(xVariant.e('attributes'), variant.attributes[i4]);
        }
      }

      exports.price(xLi, li);
      exports.add(xLi, li, 'quantity');
      exports.taxRate(xLi, li);
    }
  }

  if (order.customLineItems !== undefined) {
    for (var i5 = 0; i5 < order.customLineItems.length; i5++) {
      exports.customLineItem(xml.e('customLineItems'), order.customLineItems[i5]);
    }
  }

  return xml.end({ 'pretty': true, 'indent': '  ', 'newline': '\n' });
};

exports.customLineItem = function(xml, elem) {
  exports.add(xml, elem.name, 'de', 'name');
  exports.money(xml, elem, 'money');
  exports.add(xml, elem, 'slug');
  exports.add(xml, elem, 'quantity');

//    "taxCategory" : {
//      "id" : "2246b2fb-0531-47dd-84ec-c004d7fef3ce",
//     "typeId" : "tax-category"
//    }
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
  exports.priceElem(xml.e('price'), elem.price);
};

exports.priceElem = function(xP, p) {
  exports.money(xP, p, 'value');
  exports.add(xP, p, 'country');
  exports.customerGroup(xP, p);
};

exports.taxRate = function(xml, elem) {
  var tr = elem.taxRate;
  var xTr = xml.e('taxRate');
  var attribs = [ 'id', 'name', 'amount', 'includedInPrice', 'country', 'state' ];
  for (var i = 0; i < attribs.length; i++) {
    exports.add(xTr, tr, attribs[i]);
  }
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
  var attribs = [ 'id', 'title', 'salutation', 'firstName', 'lastName', 'streetName', 'streetNumber', 'additionalStreetInfo', 'postalCode',
                  'city', 'region', 'state', 'country', 'company', 'department', 'building', 'apartment', 'pOBox', 'phone', 'mobile', 'email' ];
  for (var i = 0; i < attribs.length; i++) {
    exports.add(xml, address, attribs[i]);
  }
};

exports.add = function (xml, elem, attr, xAttr) {
  if (xAttr === undefined) {
    xAttr = attr;
  }
  var value = elem[attr];
  if (value !== undefined) {
    xml.e(xAttr).t(value).up();
  }
};
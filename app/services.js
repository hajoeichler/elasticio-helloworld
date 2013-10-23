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
var builder, debug, querystring;

querystring = require("querystring");

builder = require("xmlbuilder");

debug = function(msg) {
  return console.log("DEBUG: " + msg);
};

exports.process = function(msg, cfg, next) {
  debug("process");
  return exports.mapOrders(msg.body, next);
};

exports.mapOrders = function(json, finish) {
  var base64, data, fileName, now, order, orders, xmlOrder, _i, _len;
  orders = json.results;
  debug("mapOrders: " + orders.length);
  now = new Buffer(new Date().toISOString()).toString("base64");
  data = {
    body: {},
    attachments: {
      "touch-timestamp.txt": {
        content: now
      }
    }
  };
  for (_i = 0, _len = orders.length; _i < _len; _i++) {
    order = orders[_i];
    xmlOrder = exports.mapOrder(order);
    debug(xmlOrder);
    fileName = "" + order.id + ".xml";
    base64 = new Buffer(xmlOrder).toString("base64");
    data.attachments[fileName] = {
      content: base64
    };
  }
  return finish(null, data);
};

exports.mapOrder = function(order) {
  var attr, attribs, customLineItem, lineItem, pi, price, si, tax, variant, xLi, xPi, xPrice, xSi, xT, xVariant, xml, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4;
  if (order.id) {
    debug("mapOrder: " + order.id);
  }
  xml = builder.create("order", {
    "version": "1.0",
    "encoding": "UTF-8",
    "standalone": true
  });
  xml.e("xsdVersion").t("0.6");
  attribs = ["id", "version", "createdAt", "lastModifiedAt", "customerId", "customerEmail", "eevoCusomterId", "country", "orderState", "shipmentState", "paymentState"];
  for (_i = 0, _len = attribs.length; _i < _len; _i++) {
    attr = attribs[_i];
    exports.add(xml, order, attr);
  }
  if (order.taxedPrice) {
    price = order.taxedPrice;
    xPrice = xml.e("taxedPrice");
    exports.money(xPrice, price, "totalNet");
    exports.money(xPrice, price, "totalGross");
    _ref = price.taxPortions;
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      tax = _ref[_j];
      xT = xPrice.e("taxPortions");
      xT.e("rate").t(tax.rate);
      exports.money(xT, tax, "amount");
    }
  }
  if (order.shippingAddress) {
    exports.mapAddress(xml.e("shippingAddress"), order.shippingAddress);
  }
  if (order.billingAddress) {
    exports.mapAddress(xml.e("billingAddress"), order.billingAddress);
  }
  exports.customerGroup(xml, order);
  if (order.paymentInfo) {
    pi = order.paymentInfo;
    xPi = xml.e("paymentInfo");
    exports.add(xPi, pi, "paymentMethod");
    exports.add(xPi, pi, "paymentID");
  }
  if (order.shippingInfo) {
    si = order.shippingInfo;
    xSi = xml.e("shippingInfo");
    exports.add(xSi, si, "shippingMethodName");
    exports.add(xSi, si, "trackingData");
    exports.money(xSi, si, "price");
    exports.taxRate(xSi, si);
  }
  if (order.lineItems) {
    _ref1 = order.lineItems;
    for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
      lineItem = _ref1[_k];
      xLi = xml.e("lineItems");
      exports.add(xLi, lineItem, "id");
      exports.add(xLi, lineItem, "productId");
      exports.add(xLi, lineItem.name, "de", "name");
      variant = lineItem.variant;
      xVariant = xLi.e("variant");
      exports.add(xVariant, variant, "id");
      exports.add(xVariant, variant, "sku");
      if (variant.prices) {
        _ref2 = variant.prices;
        for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
          price = _ref2[_l];
          exports.priceElem(xVariant.e("prices"), price);
        }
      }
      if (variant.attributes) {
        _ref3 = variant.attributes;
        for (_m = 0, _len4 = _ref3.length; _m < _len4; _m++) {
          attr = _ref3[_m];
          exports.attributes(xVariant.e("attributes"), attr);
        }
      }
      exports.price(xLi, lineItem);
      exports.add(xLi, lineItem, "quantity");
      exports.taxRate(xLi, lineItem);
    }
  }
  if (order.customLineItems) {
    _ref4 = order.customLineItems;
    for (_n = 0, _len5 = _ref4.length; _n < _len5; _n++) {
      customLineItem = _ref4[_n];
      exports.customLineItem(xml.e("customLineItems"), customLineItem);
    }
  }
  return xml.end({
    pretty: true,
    indent: "  ",
    newline: "\n"
  });
};

exports.customLineItem = function(xml, elem) {
  exports.add(xml, elem, "id");
  exports.add(xml, elem.name, "de", "name");
  exports.money(xml, elem, "money");
  exports.add(xml, elem, "slug");
  return exports.add(xml, elem, "quantity");
};

exports.attributes = function(xml, elem) {
  return xml.e("name").t(elem.name).up().e("value").t(elem.value);
};

exports.money = function(xml, elem, name) {
  return xml.e(name).e("currencyCode").t(elem[name].currencyCode).up().e("centAmount").t(elem[name].centAmount);
};

exports.price = function(xml, elem) {
  return exports.priceElem(xml.e("price"), elem.price);
};

exports.priceElem = function(xP, p) {
  exports.money(xP, p, "value");
  exports.add(xP, p, "country");
  return exports.customerGroup(xP, p);
};

exports.taxRate = function(xml, elem) {
  var attr, attribs, tr, xTr, _i, _len, _results;
  tr = elem.taxRate;
  xTr = xml.e("taxRate");
  attribs = ["id", "name", "amount", "includedInPrice", "country", "state"];
  _results = [];
  for (_i = 0, _len = attribs.length; _i < _len; _i++) {
    attr = attribs[_i];
    _results.push(exports.add(xTr, tr, attr));
  }
  return _results;
};

exports.customerGroup = function(xml, elem) {
  var cg, xCg;
  cg = elem.customerGroup;
  if (cg) {
    xCg = xml.e("customerGroup");
    exports.add(xCg, cg, "id");
    exports.add(xCg, cg, "version");
    return exports.add(xCg, cg, "name");
  }
};

exports.mapAddress = function(xml, address) {
  var attr, attribs, _i, _len, _results;
  attribs = ["id", "title", "salutation", "firstName", "lastName", "streetName", "streetNumber", "additionalStreetInfo", "postalCode", "city", "region", "state", "country", "company", "department", "building", "apartment", "pOBox", "phone", "mobile", "email"];
  _results = [];
  for (_i = 0, _len = attribs.length; _i < _len; _i++) {
    attr = attribs[_i];
    _results.push(exports.add(xml, address, attr));
  }
  return _results;
};

exports.add = function(xml, elem, attr, xAttr) {
  var value;
  if (!xAttr) {
    xAttr = attr;
  }
  value = elem[attr];
  if (value) {
    return xml.e(xAttr).t(value).up();
  }
};

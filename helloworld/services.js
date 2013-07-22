var parseString = require('xml2js').parseString;

exports.init = function(msg, cfg, cb) {
  console.log('init');
};

exports.process = function(msg, cfg, next) {
  console.log('process');
  var payload = msg.body.payload;
  if (typeof payload === "string") {
    console.log(payload);
    var parseString = require('xml2js').parseString;
    parseString(payload, function (err, result) {
      console.dir(result);
      });
  }
};

exports.shutdown = function(msg, cfg, cb, snapshot) {
  console.log('shutdown');
};

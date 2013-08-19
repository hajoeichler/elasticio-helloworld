var parseString = require('xml2js').parseString;

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

exports.shutdown = function(msg, cfg, cb, snapshot) {
  debug('shutdown');
};

const util = require('util');
var https = require('https');

exports.handler = (event, context, callback) => {
  console.log("Fetching risk score, invoked with " + util.inspect(event, {showHidden: false, depth: null}));

  var apiToken = process.env['apiToken'];
  var contactId = event.Details.ContactData.ContactId;

  https.get({
    hostname: process.env['BaseUrl'],
    path: "/v1/interaction/" + contactId + "/risk",
    headers: {
      Authorization: "Bearer " + apiToken,
    },
  },
  function(res) {
    var responseStr = '';
    res.on('data', function (chunk) {
      responseStr = responseStr + chunk;
    });
    res.on('end', function() {
      console.log('Got status code ' + res.statusCode + ', body ' + responseStr);
      r = JSON.parse(responseStr);
      callback(undefined, {'RiskScore': r.data.risk_score, 'IsHighRisk': r.data.is_high_risk, 'RiskReasons': r.data.risk_reasons});
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback(undefined, {});
  });
};

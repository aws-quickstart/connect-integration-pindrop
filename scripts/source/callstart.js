const util = require('util');
var https = require('https');

exports.handler = (event, context, callback) => {
  console.log("Creating call, invoked with " + util.inspect(event, {showHidden:false, depth:null}));
  var apiToken = process.env['apiToken'];
  var contactId = event.Details.ContactData.ContactId;
  var source = event.Details.ContactData.CustomerEndpoint.Address;
  var destination = event.Details.ContactData.SystemEndpoint.Address;
  var now = new Date().toISOString();

  var req = https.request({
    hostname: process.env['BaseUrl'],
    method: "PUT",
    path: "/v1/interaction/" + contactId + "?event=call_start.",
    headers: {
      Authorization: "Bearer " + apiToken,
    },
  },
  function(res) {
    console.log("Got response: " + res.statusCode);
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
    res.on('end', function() {
      console.log('END');
      callback(undefined, {});
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback(undefined, {});
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    callback(undefined, {});
  });
  req.write(JSON.stringify({ interaction_id: contactId, source: source, destination: destination, start_utc: now.substring(0, now.length - 1), end_utc: now.substring(0, now.length - 1)}));
  req.end();
};

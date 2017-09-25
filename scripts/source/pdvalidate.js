'use strict';

const https = require('https');
const url = require('url');

const URL_PATH = "/v1/interactions?filter=interactionId+EQ+none&source=aws";

// Sends a response to the pre-signed S3 URL
function sendResponse(event, callback, logStreamName, responseStatus, responseData) {
    const responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: `See the details in CloudWatch Log Stream: ${logStreamName}`,
        PhysicalResourceId: logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData,
    });

    console.log('RESPONSE BODY:\n', responseBody);

    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'Content-Type': '',
            'Content-Length': responseBody.length,
        },
    };

    const req = https.request(options, (res) => {
        console.log('STATUS:', res.statusCode);
        console.log('HEADERS:', JSON.stringify(res.headers));
        callback(null, 'Successfully sent stack response!');
    });

    req.on('error', (err) => {
        console.log('sendResponse Error:\n', err);
        callback(err);
    });

    req.write(responseBody);
    req.end();
}

exports.handler = (event, context, callback) => {

    let handleError = function(msg){
        console.log("ERROR: "+msg);
        sendResponse(event, callback, context.logStreamName, 'FAILED', { Error: msg });
    };

    let handleSuccess = function(){
        sendResponse(event, callback, context.logStreamName, 'SUCCESS', { Validated: "SUCCESS" });
    };

    const apiKey = process.env['apiToken'];
    const baseUrl = process.env['BaseUrl'];

    if (!baseUrl) {
        handleError('PBaseURL is not specified');
    } else if(!apiKey) {
        handleError('APIKey is not specified');
    } else {
        let req = https.request({
                hostname: baseUrl,
                method: "GET",
                path: URL_PATH,
                headers: {
                    Authorization: "Bearer " + apiKey
                }
            },
            (res) => {
                if (res.statusCode === 200) {
                    handleSuccess();
                } else {
                    if (res.statusCode === 401) {
                        handleError("The provided APIKey is invalid");
                    } else {
                        handleError("An unexpected error occurred: "+res.statusCode);
                    }
                }
        }).on('error', (err)=>{
            console.log(err);
            handleError('An unexpected error occurred');
        });

        req.on('error', function(err) {
            console.log(err);
            handleError('An unexpected error occurred');
        });

        req.end();
    }
};

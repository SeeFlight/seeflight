var https = require('https');

exports.getNewSabreToken = function(res, callback){
  var key = res.app.locals.sabreApiKey;
  var secret = res.app.locals.sabreApiSecret;
  var credentials = encodeSabreCredentials(key, secret);

  var options = {
    host: res.app.locals.sabreApiPath,
    path: '/v2/auth/token',
    method: 'POST',
    headers: {
      'Authorization' : 'Basic '+credentials,
      'Content-Type' : 'application/x-www-form-urlencoded'
    }
  };

  var request = https.request(options, function(resp){
    var data = "";
    resp.on('data', function (chunk) {
      data += chunk;
    });
    resp.on('end', function () {
      callback(null, resp, data);
    });
  }).on("error", function(e){
    console.error('Error when calling :\n'+options+'\nMessage :\n'+e.message);
    callback(e);
  });
  request.end('grant_type=client_credentials');  

};

function encodeSabreCredentials(key, secret){
  var encodedKey = new Buffer(key).toString('base64');
  var encodedSecret = new Buffer(secret).toString('base64');

  return new Buffer(encodedKey+':'+encodedSecret).toString('base64');
}   
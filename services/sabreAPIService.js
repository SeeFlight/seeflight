var http = require('http');
var https = require('https');
var moment = require('moment');

exports.getLeadPriceCalendar = function(res, callback, origin, destination, lengthofstay, departuredates, pointofsalecountry, minfare, maxfare){
	var options = {
		host: res.app.locals.sabreApiPath,
		path: '/v2/shop/flights/fares',
		method: 'GET',
		headers: {
			'Authorization' : 'Bearer '+res.app.locals.sabreApiToken
		}
	};

	options.path += '?origin='+origin;
	options.path += '&destination='+destination;
	if(departuredates){
		options.path += '&departuredate=';
		for(var i=0; i<departuredates.length; i++){
			options.path += departuredates[i];
			if(i !== departuredates.length-1){
				options.path += ',';
			}
		}
	}
	if(lengthofstay){
		options.path += '&lengthofstay=';
		for(var i=0; i<lengthofstay.length; i++){
			options.path += lengthofstay[i];
			if(i !== lengthofstay.length-1){
				options.path += ',';
			}
		}
	}
	if(minfare){
		options.path += '&minfare='+minfare;
	}
	if(maxfare){
		options.path += '&maxfare='+maxfare;
	}
	if(pointofsalecountry){
		options.path += '&pointofsalecountry='+pointofsalecountry;
	}

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
	request.end();
};
var http = require('http');
var https = require('https');
var moment = require('moment');
var oAuthService = require('./oAuthService');
var _this = this;
var tries = 0;

exports.getLeadPriceCalendar = function(res, forceRefresh, callback, origin, destination, lengthofstay, departuredates, pointofsalecountry, minfare, maxfare){
	checkSabreAuthentication(res, getLeadPriceCalendarCallback, forceRefresh);

	function getLeadPriceCalendarCallback(){
		var options = {
			host: res.app.locals.sabreApiPath,
			path: '/v2/shop/flights/fares',
			method: 'GET',
			headers: {
				'Authorization' : res.app.locals.sabreAccessTokenType+' '+res.app.locals.sabreAccessToken
			}
		};

		options.path += '?origin='+encodeURIComponent(origin);
		options.path += '&destination='+encodeURIComponent(destination);
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
				if(resp.statusCode === 401 && _this.tries < 4){
					_this.tries++;
					_this.getLeadPriceCalendar(res, true, callback, origin, destination, lengthofstay, departuredates, pointofsalecountry, minfare, maxfare);
				}else if(res.statusCode === 401){
					callback(null, resp, null);
				}else{
					callback(null, resp, data);
				}
			});
		}).on("error", function(e){
			console.error('Error when calling :\n'+JSON.stringify(options)+'\nMessage :\n'+e.message);
			callback(e);
		});
		request.end();	
	}
};

function checkSabreAuthentication(res, callback, forceRefresh){
	if(forceRefresh !== true && res.app.locals.sabreAccessToken && res.app.locals.sabreAccessTokenExpires && res.app.locals.sabreAccessTokenType && new Date().getTime()<res.app.locals.sabreAccessTokenExpires){
		callback();
	}else{
		oAuthService.getNewSabreToken(res, function(err, resp, data){
			if(err){
			}else{
				if(resp.statusCode === 200){
					var data = JSON.parse(data);
					res.app.locals.sabreAccessToken = data.access_token;
					res.app.locals.sabreAccessTokenExpires = new Date().getTime()+data.expires_in;
					res.app.locals.sabreAccessTokenType = data.token_type;
					callback();
				}
			}
		});
	}
}
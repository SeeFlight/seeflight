var http = require('http');
var https = require('https');
var moment = require('moment');
var _this = this;
var flightDAO = require('../dao/flightDAO');

exports.getBDVData = function(res, provider, flightId){
	flightDAO.getById(flightId, function(err, search){
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			if(search){
				for(var i=0; i<search.flights.length;i++){
					var host = provider.host;
					var path = provider.path;

					var options = {
						host: host,
						path: path,
						method: 'GET'
					};

					options.path += '?idPart='+provider.tokenId;
					options.path += '&departure='+search.origin;
					options.path += '&arrival='+search.destination;
					options.path += '&dateDep='+moment(parseInt(search.flights[i].departureDate)).format('YYYY-MM-DD'); 
					options.path += '&dateRet='+moment(parseInt(search.flights[i].returnDate)).format('YYYY-MM-DD'); 
					options.path += '&allerRet=R';
					options.path += '&classe=E';
					options.path += '&adultes=1';
					options.path += '&enfants=0';
					options.path += '&bebes=0';
					options.path += '&device=D';

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
						console.error('Error when calling :\n'+options+'\nMessage :\n'+e.message);
						callback(e);
					});
					request.end();
				}

				res.status(200).end();
			}else{
				res.status(404).send();
			}
		}
	});
};
var http = require('http');
var https = require('https');
var moment = require('moment');
var XmlStream = require('xml-stream');
var _this = this;
var flightDAO = require('../dao/flightDAO');

exports.getBDVData = function(res, provider, flightId, departureDate, returnDate, callback){
	flightDAO.getById(flightId, function(err, search){
		if (err) {
			callback(err);
			res.status(400);
		} else {
			if(search){
				var url = provider.protocol+"://"+provider.host+provider.path;

				url += '?idPart=PID_BDVL_44a&departure='+search.origin;
				url += '&arrival='+search.destination;
				url += '&dateDep='+moment(parseInt(departureDate)).format('YYYY-MM-DD'); 
				url += '&dateRet='+moment(parseInt(returnDate)).format('YYYY-MM-DD'); 
				url += '&allerRet=R';
				url += '&classe=E';
				url += '&adultes=1';
				url += '&enfants=0';
				url += '&bebes=0';
				url += '&device=D';

				http.get(url).on('response', function (response) {
					if(response.statusCode === 302){
						url = response.headers["location"];
						http.get(url).on('response', function(response){
	  						response.setEncoding('utf8');
							var xml = new XmlStream(response);
							
							xml.on('updateElement: getXmlSearch', function(search) {
								if(search.url){
									getResults(search.url, new Date().getTime(), search);
								}else{
									var error = "Unable to get the link from BDV";
									callback(error);
								}
							});
						});
					}else{
						var error = "Expected redirection from PublicIdee, got http code "+response.statusCode;
						callback(error);
					}
				}).on("error", function(e){
					callback(e);
					console.log(e);
				});
			}else{
				var error = "Flight ID not found";
				callback(error);
			}
		}
	});

	function getResults(url, timestamp, flight){
		http.get(url).on('response', function(response){
			response.setEncoding('utf8');
			var xml = new XmlStream(response);
			xml.on('updateElement: getXmlSearch', function(search) {
				if(search.result && search.result.type === 'searching'){
					setTimeout(function(){
						getResults(url, timestamp, flight);
					}, 5000);
				}else if(search.result && search.result.type === 'ok'){

				}else if(search.errors && search.errors.error.type === 'noOffer'){
					var error = "No offers found for BDV";
					callback(error);
				}else if(search.errors && search.errors.error.type === 'timeout'){
					if((new Date().getTime()-timestamp)<=150000){
						setTimeout(function(){
							getResults(url, timestamp, flight);
						}, 5000);
					}else{
						var error = "timeout "+(new Date().getTime()-timestamp)/1000+" sec "+url;
						callback(error);
					}
				}else{
					var error = "Not able to understand BDV results";
					callback(error);
				}
			});

			xml.collect('trip');
			xml.on('endElement: offers', function(offers) {
				var flight = {
					origin : flight.origin,
					destination : flight.destination,
					departureDate : departureDate,
					returnDate : returnDate,
					lowerPrice : offers.trip[0].totalPrice
				};
				callback(null, flight);
			});
		});
	}
};
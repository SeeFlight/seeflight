var http = require('http');
var https = require('https');
var moment = require('moment');
var XmlStream = require('xml-stream');
var soap = require('soap');
var _this = this;
var searchDAO = require('../dao/searchDAO');

exports.getBDVData = function(res, provider, flightId, departureDate, returnDate, callback){
	searchDAO.getById(flightId, function(err, search){
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
									getResults(search.url, new Date().getTime());
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

	function getResults(url, timestamp){
		http.get(url).on('response', function(response){
			response.setEncoding('utf8');
			var xml = new XmlStream(response);
			xml.on('updateElement: getXmlSearch', function(search) {
				if(search.result && search.result.type === 'searching'){
					setTimeout(function(){
						getResults(url, timestamp);
					}, 5000);
				}else if(search.result && search.result.type === 'ok'){

				}else if(search.errors && search.errors.error.type === 'noOffer'){
					var error = "No offers found for BDV";
					callback(error);
				}else if(search.errors && search.errors.error.type === 'timeout'){
					if((new Date().getTime()-timestamp)<=150000){
						setTimeout(function(){
							getResults(url, timestamp);
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
					departureDate : departureDate,
					returnDate : returnDate
				};
				var price = {
					provider : provider.name,
					price : offers.trip[0].totalPrice,
					deepLink : offers.trip[0].deepLink
				};
				searchDAO.updateFlightPrice(flightId, flight, price, function(err, data){
					if(err){
						callback(err);
					}else{
						if(data){
							callback(null, price);
						}else{
							var error = "Not able to store BDV offer";
							callback(error);
						}
					}
				});
			});
		});
	}
};

exports.getBravoflyData = function(res, provider, searchId, flightId, callback){
	searchDAO.getFlightById(searchId, flightId, function(err, search){
		if (err) {
			callback(err);
			res.status(400);
		} else {
			if(search){
				var soapRequest = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  xmlns:tns="http://webservices.bravofly.com/">';
				soapRequest += '<soap:Body>';
				soapRequest += '<BravoFlySearchWs:searchFlights xmlns:BravoFlySearchWs="http://webservices.bravofly.com/">';
				soapRequest += '<idBusinessProfile>'+provider.login+'</idBusinessProfile>';
				soapRequest += '<password>'+provider.password+'</password>';
				soapRequest += '<departureAirport>'+search.flights[0].origin+'</departureAirport>';
				soapRequest += '<arrivalAirport>'+search.flights[0].destination+'</arrivalAirport>';
				soapRequest += '<roundTrip>true</roundTrip>';
				soapRequest += '<outboundDate>'+moment(parseInt(search.flights[0].departureDate)).format('YYYY-MM-DD')+'</outboundDate>';
				soapRequest += '<returnDate>'+moment(parseInt(search.flights[0].returnDate)).format('YYYY-MM-DD')+'</returnDate>';
				soapRequest += '<adults>1</adults>';
				soapRequest += '<childs>0</childs>';
				soapRequest += '<infants>0</infants>';
				soapRequest += '<language>'+search.flights[0].pointOfSaleCountry+'</language>';
				soapRequest += '<numberOfResults>1</numberOfResults>'
				soapRequest += '</BravoFlySearchWs:searchFlights>';
				soapRequest += '</soap:Body>';
				soapRequest += '</soap:Envelope>';

				var options = {
					host: provider.host,
					port: 80,
					path: provider.path,
					method: 'POST',
					headers: {
						'Content-Type': 'text/xml'
					}
				};
				
				var put = http.request(options).on("response", function(response){
					var xml = new XmlStream(response);
							
					xml.collect('trips');
					xml.on('endElement: return', function(response) {
						if(response.idRequest){
							var flight = {
								_id : flightId
							};
							var price = {
								provider : provider.name,
								price : Math.ceil(response.trips[0].amount),
								currency : response.trips[0].currency,
								deeplink : response.trips[0].deeplink+"&partId="+provider.tokenId
							};
							searchDAO.updateFlightPrice(searchId, flight, price, function(err, data){
								if(err){
									callback(err);
								}else{
									if(data){
										callback(null, price);
									}else{
										var error = "Not able to store Bravofly offer";
										callback(error);
									}
								}
							});
						}else{
							var error = "Unable to get the deep link from Bravofly";
							callback(error);
						}
					});
				}).on("error", function(e){
					console.error(e);
					res.writeHead(500);
					callback(e);
				});
				put.write(soapRequest);
				put.end();
			}else{
				var error = "Flight ID not found";
				callback(error);
			}
		}
	});
};
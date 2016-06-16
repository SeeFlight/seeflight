var http = require('http');
var https = require('https');
var moment = require('moment');
var XmlStream = require('xml-stream');
var soap = require('soap');
var _this = this;
var searchDAO = require('../dao/searchDAO');

exports.getBDVData = function(res, provider, searchId, flightId, callback){
	searchDAO.getFlightById(searchId, flightId, function(err, search){
		if (err) {
			callback(err);
			res.status(400);
		} else {
			if(search){
				var url = provider.protocol+"://"+provider.host+provider.path;

				url += '?idPart=PID_BDVL_44b&departure='+search.flights[0].origin;
				url += '&arrival='+search.flights[0].destination;
				url += '&dateDep='+moment(parseInt(search.flights[0].departureDate)).format('YYYY-MM-DD');
				url += '&dateRet='+moment(parseInt(search.flights[0].returnDate)).format('YYYY-MM-DD');
				url += '&allerRet=R';
				url += '&classe=E';
				url += '&adultes=1';
				url += '&enfants=0';
				url += '&bebes=0';
				url += '&device=D';
				console.log(url);
				http.get(url).on('response', function (response) {
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
								deeplink : response.trips[0].deeplink+"&partId="+provider.tokenId,
								airline : response.trips[0].outboundLeg.hops.idAirline
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

exports.getOpodoData = function(res, provider, searchId, flightId, callback){
	searchDAO.getFlightById(searchId, flightId, function(err, search){
		if (err) {
			callback(err);
			res.status(400);
		} else {
			if(search){
				var soapRequest = '<soap:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1="http://metasearch.odigeo.com/metasearch/ws/v1/">';
				soapRequest += '<soapenv:Header/>';
				soapRequest += '<soapenv:Body>';
				soapRequest += '<v1:search>';
				soapRequest += '<preferences locale="fr_FR" realUserIP="127.0.0.1" userAgent="Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36" domainCode=".fr">';
				soapRequest += '</preferences>';
				soapRequest += '<searchRequest maxSize="5”>';
				soapRequest += '<itinerarySearchRequest cabinClass="TOURIST" numAdults="1" numChildren="0" numInfants="0" directFlightsOnly="false">';
				soapRequest += '<segmentRequests date="'+moment(parseInt(search.flights[0].departureDate)).format('YYYY-MM-DD')+'">';
				soapRequest += '<departure iataCode="'+search.flights[0].origin+'"/>';
				soapRequest += '<destination iataCode="'+search.flights[0].destination+'"/>';
				soapRequest += '</segmentRequests>';
				soapRequest += '<segmentRequests date="'+moment(parseInt(search.flights[0].returnDate)).format('YYYY-MM-DD')+'">';
				soapRequest += '<departure iataCode="'+search.flights[0].destination+'"/>';
				soapRequest += '<destination iataCode="'+search.flights[0].origin+'"/>';
				soapRequest += '</segmentRequests>';
				soapRequest += '</itinerarySearchRequest>';
				soapRequest += '</searchRequest>';
				soapRequest += '<metasearchEngineCode>'+provider.login+'</metasearchEngineCode>';
				soapRequest += '</v1:search>';
				soapRequest += '</soapenv:Body>';
				soapRequest += '</soapenv:Envelope>';

				var options = {
					host: provider.host,
					port: 80,
					path: provider.path,
					method: 'POST',
					headers: {
						'Content-Type': 'text/xml'
					}
				};

				//TODO : implement results
				console.log(options.host+options.path);
				var post = http.request(options).on("response", function(response){
					console.log(response.statusCode);
					var xml = new XmlStream(response);

					xml.collect('itineraryResultsPages');
					xml.on('endElement: searchStatus', function(response) {
						console.log(response);
					});
				}).on("error", function(e){
					console.error(e);
					res.writeHead(500);
					callback(e);
				});
				post.write(soapRequest);
				post.end();
			}else{
				var error = "Flight ID not found";
				callback(error);
			}
		}
	});
};

exports.getExpediaData = function(res, provider, searchId, flightId, callback){
	searchDAO.getFlightById(searchId, flightId, function(err, search){
		if (err) {
			callback(err);
			res.status(400);
		} else {
			if(search){
				var url = provider.protocol+"://"+provider.host+provider.path;

				url += '?pos='+search.flights[0].pointOfSaleCountry;
				url += '&tripFrom='+search.origin;
				url += '&tripTo='+search.destination;
				url += '&departDate='+moment(parseInt(search.flights[0].departureDate)).format('YYYY-MM-DD');
				url += '&returnDate='+moment(parseInt(search.flights[0].returnDate)).format('YYYY-MM-DD');

				http.get(url).on('response', function (response) {
					if(response.statusCode === 200){
						var result = JSON.stringify(response.data);

						var flight = {
							departureDate : search.flights[0].departureDate,
							returnDate : search.flights[0].returnDate
						};
						var price = {
							provider : provider.name,
							price : result.perPsgrPrice,
							deepLink : result.dealDeepLink
						};
						searchDAO.updateFlightPrice(flightId, flight, price, function(err, data){
							if(err){
								callback(err);
							}else{
								if(data){
									callback(null, price);
								}else{
									var error = "Not able to store Expedia offer";
									callback(error);
								}
							}
						});
					}else{
						var error = "Error while crawling Expedia API "+response.statusCode;
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
};

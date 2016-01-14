var http = require('http');
var https = require('https');
var moment = require('moment');
var XmlStream = require('xml-stream');
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
					var url = provider.protocol+"://"+provider.host+provider.path;

					url += '?idPart=PID_BDVL_44a&departure='+search.origin;
					url += '&arrival='+search.destination;
					url += '&dateDep='+moment(parseInt(search.flights[i].departureDate)).format('YYYY-MM-DD'); 
					url += '&dateRet='+moment(parseInt(search.flights[i].returnDate)).format('YYYY-MM-DD'); 
					url += '&allerRet=R';
					url += '&classe=E';
					url += '&adultes=1';
					url += '&enfants=0';
					url += '&bebes=0';
					url += '&device=D';

					http.get(url, function(resp){
					}).on('response', function (response) {
						if(response.statusCode === 302){
							url = response.headers["location"];
							http.get(url, function(resp){
							}).on('response', function(response){
		  						response.setEncoding('utf8');
								var xml = new XmlStream(response);
								
								xml.on('updateElement: getXmlSearch', function(search) {
									if(search.url){
										url = search.url;
										http.get(url).on('response', function(response){
					  						response.setEncoding('utf8');
											var xml = new XmlStream(response);
											xml.on('updateElement: getXmlSearch', function(search) {
												console.log(search);
											});
										});
									}
								});
							});
						}
					}).on("error", function(e){
						console.log(e);
					});
				}

				res.status(200).end();
			}else{
				res.status(404).send();
			}
		}
	});
};
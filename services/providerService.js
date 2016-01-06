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

					var options = {
						host: provider.host,
						path: provider.path,
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

					http.get(options, function(resp){	
						resp.on('response', function (response) {
							console.log('response');
							response.setEncoding('utf8');
							var xml = new XmlStream(response);
							
							xml.on('updateElement: getXmlSearch', function(search) {
								if(search.url){
									http.get(options, function(resp){	
										resp.on('response', function (response) {
											response.setEncoding('utf8');
											var xml = new XmlStream(response);
											
											xml.on('updateElement: getXmlSearch', function(search) {
												if(search.url){

												}
								}
								// Change <title> child to a new value, composed of its previous value
								// and the value of <pubDate> child.
								item.title = item.title.match(/^[^:]+/)[0] + ' on ' +
								  item.pubDate.replace(/ \+[0-9]{4}/, '');
							});
						});
						resp.on('end', function () {
							console.log('end');
							var paiement = {};
							if(resp.statusCode === 200){
								paiement = JSON.parse(data);
								var price = paiement.debitedFunds.amount.toString();
								var euro = price.slice(0, -2);
								var cents = price.substr(euro.length, 2);
								paiement.debitedFunds.amount = euro+"."+cents;
							}
							
							res.locals.currentPage = "paiements";
							res.render('paiement.html', {paiement:paiement});
						});
					}).on("error", function(e){
						logger.logRequestError(options, e.message);
						res.render('paiements.html');
					});
				}

				res.status(200).end();
			}else{
				res.status(404).send();
			}
		}
	});
};
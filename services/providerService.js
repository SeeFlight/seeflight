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

					http.get(options).on('response', function (response) {
  						response.setEncoding('utf8');
						var xml = new XmlStream(response);
						
						xml.on('updateElement: getXmlSearch', function(search) {
							console.log(search);
						});
					}).on("error", function(e){
						console.log(e);
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
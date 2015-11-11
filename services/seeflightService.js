var http = require('http');
var moment = require('moment');
var sabreAPIService = require('./sabreAPIService');
var mongoose = require('mongoose');
var Search = mongoose.model('Search');
var Flight = mongoose.model('Flight');

exports.getAndStoreFlights = function(res, origin, destination, callback){
	var nbRequests = Math.ceil(res.app.locals.maxLengthOfStay/res.app.locals.maxSabreAPILengthOfStay);
	var nbResults = 0;
	var saleCountry = res.app.locals.saleCountry;
	var j=1;

	var requestDate = new Date().getTime();		

	var search = new Search({
		requestDate : requestDate,
		origin : origin,
		destination : destination
	});

	for(var i=0; i<nbRequests; i++){
		var momentObj = moment();
		var arrayLengthOfStay = [];
		var arrayDepartureDates = [];
		for(var k=0; k<res.app.locals.maxSabreAPILengthOfStay && j<res.app.locals.maxLengthOfStay+1; k++){
			arrayLengthOfStay.push(j);
			j++;
		}
		for(var l=0; l<res.app.locals.maxLengthOfStay; l++){
			momentObj.add(1, 'days');
			arrayDepartureDates.push(momentObj.format('YYYY-MM-DD'));
		}
		sabreAPIService.getLeadPriceCalendar(res, false, sortSabreDatas, origin, destination, arrayLengthOfStay, arrayDepartureDates, saleCountry);
	}

	function sortSabreDatas(err, response, data){
		if(err){
			res.status(500);
			callback(err);
		}else{
			nbResults++;
			if(response.statusCode === 200){

				data = JSON.parse(data);

				for(var i=0; i<data.FareInfo.length; i++){
					var returnDateTime = data.FareInfo[i].ReturnDateTime;
					var departureDateTime = data.FareInfo[i].DepartureDateTime;

					var momentNow = moment(requestDate);
					var momentDeparture = moment(departureDateTime);
					var momentReturnDate = moment(returnDateTime);

					var daysToDeparture = momentDeparture.diff(momentNow, 'days')+1;
					var daysToReturn = momentReturnDate.diff(momentNow, 'days')+1;
					var daysInDestination = momentReturnDate.diff(momentDeparture, 'days');

					var flight = new Flight({
						requestDate : requestDate,
						origin: origin,
						destination: destination,
						lengthOfStay:daysInDestination,
						departureDate: moment(data.FareInfo[i].DepartureDateTime).toDate().getTime(),
						returnDate:moment(data.FareInfo[i].ReturnDateTime).toDate().getTime(),
						lowestFare:data.FareInfo[i].LowestFare.Fare,
						currencyCode:data.FareInfo[i].CurrencyCode,
						pointOfSaleCountry:saleCountry,
						daysToDeparture:daysToDeparture,
						daysToReturn:daysToReturn,
						airlineCode : data.FareInfo[i].LowestFare.AirlineCodes[0]
					});

					search.flights.push(flight);
				}

				if(nbRequests === nbResults){
					callback(null, search);
					search.save();
				}
			}else{
				if(nbRequests === nbResults){
					res.status(response.statusCode);
					callback("Unable to get Sabre results");
				}
			}
		}
	}
};
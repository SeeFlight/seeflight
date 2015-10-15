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
	var momentObj = moment();

	var requestDate = new Date().getTime();		

	var search = new Search({
		requestDate : requestDate,
		origin : origin,
		destination : destination
	});

	for(var i=0; i<=nbRequests; i++){
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
		sabreAPIService.getLeadPriceCalendar(res, sortSabreDatas, origin, destination, arrayLengthOfStay, arrayDepartureDates, saleCountry);
	}

	function sortSabreDatas(err, response, data){
		if(err){
			res.status(response.statusCode);
			callback(err);
		}else{
			if(response.statusCode === 200){
				nbResults++;

				data = JSON.parse(data);

				for(var i=0; i<data.FareInfo.length; i++){
					var returnDateTime = data.FareInfo[i].ReturnDateTime;
					var departureDateTime = data.FareInfo[i].DepartureDateTime;

					var momentNow = moment(requestDate);
					var momentDeparture = moment(departureDateTime);
					var momentReturnDate = moment(returnDateTime);

					var daysToDeparture = momentDeparture.diff(momentNow, 'days');
					var daysToReturn = momentReturnDate.diff(momentNow, 'days');
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
						daysToReturn:daysToReturn
					});

					search.flights.push(flight);
				}

				if(nbRequests === nbResults){
					callback(null, search);
					search.save();
				}
			}
		}
	}
};
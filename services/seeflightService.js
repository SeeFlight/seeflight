var http = require('http');
var moment = require('moment');
var sabreAPIService = require('./sabreAPIService');
var mongoose = require('mongoose');
var Search = mongoose.model('Search');
var Flight = mongoose.model('Flight');

exports.getAndStoreFlights = function(res, origin, destination, callback){
	var nbRequests = Math.ceil(res.app.locals.maxLengthOfStay/res.app.locals.maxSabreAPILengthOfStay);
	var saleCountry = res.app.locals.saleCountry;

	var j=1;
	var momentObj = moment();
	for(var i=1; i<=nbRequests; i++){
		var arrayLengthOfStay = [];
		var arrayDepartureDates = [];
		for(var k=0; k<res.app.locals.maxSabreAPILengthOfStay; k++){
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
			res.status(response.status).end(err);
		}else{
			if(response.statusCode === 200){
				data = JSON.parse(data);
				var requestDate = new Date().getTime();
				var search = new Search({
					requestDate : requestDate,
					origin : origin,
					destination : destination
				});

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
						departureDate: data.FareInfo[i].DepartureDateTime,
						returnDate:data.FareInfo[i].ReturnDateTime,
						lowestFare:data.FareInfo[i].LowestFare.Fare,
						currencyCode:data.FareInfo[i].CurrencyCode,
						pointOfSaleCountry:saleCountry,
						daysToDeparture:daysToDeparture,
						daysToReturn:daysToReturn
					});

					search.daysToDeparture = daysToDeparture;
					search.daysToReturn = daysToReturn;
					search.daysInDestination = daysInDestination;
					search.flights.push(flight);
				}

				search.save();
			}
		}
	}
};
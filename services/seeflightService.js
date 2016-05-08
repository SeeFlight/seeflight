var http = require('http');
var moment = require('moment');
var sabreAPIService = require('./sabreAPIService');
var mongoose = require('mongoose');
var Search = mongoose.model('Search');
var Flight = mongoose.model('Flight');
var providerDAO = require('../dao/providerDAO');

exports.getAndStoreFlights = function(res, origin, destination, originPointOfSale, callback){
	var nbRequests = Math.ceil(res.app.locals.maxLengthOfStay/res.app.locals.maxSabreAPILengthOfStay);
	var nbResults = 0;
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
		for(var l=0; l<res.app.locals.maxSeeflightDepartureDays; l++){
			momentObj.add(1, 'days');
			arrayDepartureDates.push(momentObj.format('YYYY-MM-DD'));
		}
		sabreAPIService.getLeadPriceCalendar(res, false, sortSabreDatas, origin, destination, arrayLengthOfStay, arrayDepartureDates, originPointOfSale);
	}

	function sortSabreDatas(err, response, data){
		if(err){
			res.status(500);
			callback(err);
		}else{
			nbResults++;
			if(response.statusCode === 200){

				data = JSON.parse(data);
				providerDAO.getAllProviders(function(err, providers){
					if (err) {
						errorMessage = errorHandler.getErrorMessage(err);
					} else {
						if(providers){
							providersFiltered = [];
							for(var i=0;i<providers.length;i++){
								if(providers[i].active){
									var providerFiltered = {
										name : providers[i].name
									};
									providersFiltered.push(providerFiltered);
								}
							}
							search.providers = providersFiltered;
						}

						for(var i=0; i<data.FareInfo.length; i++){
							var returnDateTime = data.FareInfo[i].ReturnDateTime;
							var departureDateTime = data.FareInfo[i].DepartureDateTime;

							var momentNow = moment();
							var momentDeparture = moment(departureDateTime);
							var momentReturnDate = moment(returnDateTime);

							var daysToDeparture = momentDeparture.diff(momentNow, 'days')+1;
							var daysToReturn = momentReturnDate.diff(momentNow, 'days')+1;
							var daysInDestination = momentReturnDate.diff(momentDeparture, 'days');

							if(data.FareInfo[i].LowestFare.Fare){
								var flight = new Flight({
									requestDate : requestDate,
									origin: origin,
									destination: destination,
									lengthOfStay:daysInDestination,
									departureDate: moment(data.FareInfo[i].DepartureDateTime).toDate().getTime(),
									returnDate:moment(data.FareInfo[i].ReturnDateTime).toDate().getTime(),
									lowestFare:Math.ceil(data.FareInfo[i].LowestFare.Fare),
									currencyCode:data.FareInfo[i].CurrencyCode,
									pointOfSaleCountry:originPointOfSale,
									daysToDeparture:daysToDeparture,
									daysToReturn:daysToReturn,
									airlineCode : data.FareInfo[i].LowestFare.AirlineCodes[0]
								});
								priceDirtyChecking(flight);
								search.flights.push(flight);
							}
						}

						if(nbRequests === nbResults){
							callback(null, search);
							search.save();
						}
					}
				});
			}else{
				if(nbRequests === nbResults){
					res.status(response.statusCode);
					callback("Unable to get Sabre results");
				}
			}
		}
	}
};

function priceDirtyChecking(flight){
	if(flight.pointOfSaleCountry === 'US' && flight.pointOfSaleDestinationCountry === 'US' && flight.airlineCode != 'SY'){
		flight.deepLink = 'http://www.dpbolvw.net/click-7889275-10581071?GOTO=EXPFLTWIZ&load=1&TripType=Roundtrip&FrAirport=';
		flight.deepLink += flight.origin;
		flight.deepLink += '&ToAirport=';
		flight.deepLink += flight.destination;
		flight.deepLink += '&FromDate=';
		flight.deepLink += moment(parseInt(flight.departureDate)).format('MM/DD/YYYY');
		flight.deepLink += '&ToDate=';
		flight.deepLink += moment(parseInt(flight.returnDate)).format('MM/DD/YYYY');
		flight.deepLink += '&NumAdult=1';
		flight.prices.push({
			deeplink : flight.deepLink,
			price : flight.lowestFare,
			provider : 'Expedia',
			currency : flight.currencyCode
		});
	}else if(flight.pointOfSaleCountry === 'US'){
		flight.deepLink = 'http://www.cheapoair.com/fpnext/Air/RemoteSearch/?tabid=1832&from=';
		flight.deepLink += flight.origin;
		flight.deepLink += '&to=';
		flight.deepLink += flight.destination;
		flight.deepLink += '&fromDt=';
		flight.deepLink += moment(parseInt(flight.departureDate)).format('MM/DD/YYYY');
		flight.deepLink += '&toDt=';
		flight.deepLink += moment(parseInt(flight.returnDate)).format('MM/DD/YYYY');
		flight.deepLink += '&rt=true&daan=&raan=&dst=&rst=&ad=1&se=0&ch=0&infl=0&infs=0&class=1&airpref=&preftyp=1&searchflxdt=false&IsNS=false&searchflxarpt=false&childAge=';
		flight.prices.push({
			deeplink : flight.deepLink,
			price : flight.lowestFare,
			provider : 'CheapOAir',
			currency : flight.currencyCode
		});
	}else if(flight.pointOfSaleCountry === 'GB'){			
		if(flight.origin === 'LON' && flight.airlineCode === 'D8'){
			flight.deepLink = 'http://tracking.publicidees.com/clic.php?progid=515&partid=47438&dpl=http://www.govoyages.com/?mktportal=publicidees&mktportal=publicidees&utm_source=publicidees&utm_medium=affiliates&utm_term=flight&utm_campaign=47438&utm_content=metasearch&#/results/type=R;dep=';
			flight.deepLink += moment(parseInt(flight.departureDate)).format('YYYY-MM-DD');
			flight.deepLink += ';from=';
			flight.deepLink += flight.origin;
			flight.deepLink += ';to=';
			flight.deepLink += flight.destination;
			flight.deepLink += ';ret=';
			flight.deepLink += moment(parseInt(flight.returnDate)).format('YYYY-MM-DD');
			flight.deepLink += ';collectionmethod=false;internalSearch=true';
			flight.prices.push({
				deeplink : flight.deepLink,
				price : flight.lowestFare,
				provider : 'GoVoyages',
				currency : flight.currencyCode
			});
		}else{
			flight.deepLink = 'http://www.tripsta.co.uk/airline-tickets/results?dep=('
			flight.deepLink += flight.origin;
			flight.deepLink += ')&arr=(';
			flight.deepLink += flight.destination;
			flight.deepLink += ')&isRoundtrip=1&obDate=';
			flight.deepLink += moment(parseInt(flight.departureDate)).format('DD/MM/YYYY');
			flight.deepLink += '&ibDate=';
			flight.deepLink += moment(parseInt(flight.returnDate)).format('DD/MM/YYYY');
			flight.deepLink += '&obTime=&ibTime=&extendedDates=0&resetStaticSearchResults=1&passengersAdult=1&passengersChild=0&passengersInfant=0&airlineCode=&class=&directFlightsOnly=0';
			flight.prices.push({
				deeplink : flight.deepLink,
				price : flight.lowestFare,
				provider : 'Tripsta',
				currency : flight.currencyCode
			});
		}
	}else if(((flight.origin === 'PAR' || flight.origin === 'ORY' || flight.origin === 'CDG') && (flight.destination === 'BCN' || flight.destination === 'VCE' || flight.destination === 'MAD' || flight.destination === 'ROM')) || ((flight.destination === 'PAR' || flight.destination === 'ORY' || flight.destination === 'CDG') && (flight.origin === 'BCN' || flight.origin === 'VCE' || flight.origin === 'MAD' || flight.origin === 'ROM'))){
		flight.deepLink = 'http://tracking.publicidees.com/clic.php?progid=515&partid=47438&dpl=http://www.govoyages.com/?mktportal=publicidees&mktportal=publicidees&utm_source=publicidees&utm_medium=affiliates&utm_term=flight&utm_campaign=47438&utm_content=metasearch&#/results/type=R;dep=';
		flight.deepLink += moment(parseInt(flight.departureDate)).format('YYYY-MM-DD');
		flight.deepLink += ';from=';
		flight.deepLink += flight.origin;
		flight.deepLink += ';to=';
		flight.deepLink += flight.destination;
		flight.deepLink += ';ret=';
		flight.deepLink += moment(parseInt(flight.returnDate)).format('YYYY-MM-DD');
		flight.deepLink += ';collectionmethod=false;airlinescodes=AF,IB,VY,UX,LH,KL,LX,SN,D8,UA,OS,SU,TP,AA,AZ,DY;internalSearch=true';
		flight.prices.push({
			deeplink : flight.deepLink,
			price : flight.lowestFare,
			provider : 'GoVoyages',
			currency : flight.currencyCode
		});
	}else{
		flight.deepLink = 'http://tracking.publicidees.com/clic.php?progid=515&partid=47438&dpl=http://www.govoyages.com/?mktportal=publicidees&mktportal=publicidees&utm_source=publicidees&utm_medium=affiliates&utm_term=flight&utm_campaign=47438&utm_content=metasearch&#/results/type=R;dep=';
		flight.deepLink += moment(parseInt(flight.departureDate)).format('YYYY-MM-DD');
		flight.deepLink += ';from=';
		flight.deepLink += flight.origin;
		flight.deepLink += ';to=';
		flight.deepLink += flight.destination;
		flight.deepLink += ';ret=';
		flight.deepLink += moment(parseInt(flight.returnDate)).format('YYYY-MM-DD');
		flight.deepLink += ';collectionmethod=false;internalSearch=true';
		if(flight.pointOfSaleCountry === 'FR' && flight.pointOfSaleDestinationCountry === 'FR'){
			flight.lowestFare = flight.lowestFare-40;
		}
		flight.prices.push({
			deeplink : flight.deepLink,
			price : flight.lowestFare,
			provider : 'GoVoyages',
			currency : flight.currencyCode
		});
	}
}
var mongoose = require('mongoose'),
	Search = mongoose.model('Search');

exports.getByOriginAndDestination = function(origin, destination, requestDate, callback){
	var query  = Search.where({ 
		origin : origin,
		destination : destination,
		requestDate : requestDate
	});
	query.findOne(function (err, search) {
		callback(err, search);
	});
};

exports.getById = function(id, callback){
	var query  = Search.where({ 
		_id: new mongoose.Types.ObjectId(id)
	});
	query.findOne(function (err, search) {
		callback(err, search);
	});
};

exports.updateFlightPrice = function(id, flight, price, callback){
	var query = {
		'_id': new mongoose.Types.ObjectId(id),
		'flights.departureDate' : flight.departureDate,
		'flights.returnDate' : flight.returnDate
	};
	var updateDoc = {
		'deepLink' : price.deeplink,
		'price' : price.price,
		'provider' : price.provider
	};
	var priceField = {
		'flights.$.prices' : updateDoc
	};
	var pushDocument = {
		$push : priceField
	};

	Search.findOneAndUpdate(query, pushDocument, function(err, doc){
	    callback(err, doc);
	});
};
var mongoose = require('mongoose'),
	Search = mongoose.model('Search'),
	Price = mongoose.model('Price');

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

exports.getFlightById = function(id, flightId, callback){
	var query  = { 
		_id: new mongoose.Types.ObjectId(id),
		'flights._id' : new mongoose.Types.ObjectId(flightId)
	};
	Search.findOne(query, 'flights.$', function (err, search) {
		callback(err, search);
	});
};

exports.updateFlightPrice = function(id, flightId, price, callback){
	var query = {
		_id: new mongoose.Types.ObjectId(id),
		'flights._id' : flightId
	};
	var updateDoc = {
		deeplink : price.deeplink,
		price : price.price,
		provider : price.provider
	};
	var priceField = {
		'flights.$.prices' : updateDoc
	};
	var pushDocument = {
		$push : priceField
	};
	Search.update(query, pushDocument, function(err, doc){
	    callback(err, doc);
	});
};

exports.getFlightProvider = function(idSearch, idFlight, name, callback){
	var query  = { 
		_id: new mongoose.Types.ObjectId(idSearch),
		'flights' : {
	        '$elemMatch':{
	            '_id': new mongoose.Types.ObjectId(idFlight),
	            'prices' : {
	                '$elemMatch':{
	                    'provider' : name
	                }
	             }
	         }
	     }
	};
	Search.findOne(query, 'flights.$', function(err, search){
		callback(err, search);
	})
};
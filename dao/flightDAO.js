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
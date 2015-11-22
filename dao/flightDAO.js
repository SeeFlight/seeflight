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
}
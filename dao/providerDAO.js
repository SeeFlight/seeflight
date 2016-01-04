var mongoose = require('mongoose'),
	Provider = mongoose.model('Provider');

exports.getAllProviders = function(callback){
	var query  = Provider.where({ 
	});
	query.find(function (err, search) {
		callback(err, search);
	});
}
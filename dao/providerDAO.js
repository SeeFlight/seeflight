var mongoose = require('mongoose'),
	Provider = mongoose.model('Provider');

exports.getAllProviders = function(callback){
	var query  = Provider.where({ 
	});
	query.find(function (err, search) {
		callback(err, search);
	});
};

exports.getAllProviderName = function(callback){
	var query  = Provider.where({ 
	});
	query.find(function (err, search) {
		callback(err, search);
	});
};

exports.getByName = function(name, callback){
	var query  = Provider.where({
		name : name
	});

	query.findOne(function (err, search) {
		callback(err, search);
	});
};
var mongoose = require('mongoose'),
	City = mongoose.model('City');

exports.getByCity = function(city, callback){
	var regex = new RegExp('^'+city+'$', "i");
	
	var query  = City.where({
		$or:[
			{ 
				airports : {
					$elemMatch : {
						airportCode : city
					}
				}
			}
			, 
			{
				cityCode : city
			}, 
			{
				cityName : regex
			}
		]
	});

	query.findOne(function (err, search) {
		callback(err, search);
	});
};
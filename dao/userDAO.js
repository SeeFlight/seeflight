var mongoose = require('mongoose'),
	User = mongoose.model('User');

exports.addUser = function(user, callback){
	var userDB = new User({
		name : user.name,
		mail : user.mail,
		creationDate : new Date().getTime()
	});

	userDB.save();

	callback(null, userDB);
};
/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var userDAO = require('../dao/userDAO');

exports.addUser = function(req, res){
	var user = req.body;

	if(user){
		userDAO.addUser(user, function(err, user){
			if(err){
				var error = {
					message : err
				};
				res.status(404).json(error);
			}else{
				res.status(201).send();
			}
		});
	}else{
		res.status(400).send();
	}
};
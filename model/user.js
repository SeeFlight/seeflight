'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * City Schema
 */
var UserSchema = new Schema({
	id:Schema.Types.ObjectId,
	name: String,
	mail : String,
	creationDate : String
});

mongoose.model('User', UserSchema);
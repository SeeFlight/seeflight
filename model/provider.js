'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * City Schema
 */
var ProviderSchema = new Schema({
	id: Schema.Types.ObjectId,
	name : String,
	protocol : String,
	host : String,
	path : String,
	tokenId : String,
	login : String,
	password : String,
	callback : String,
	active : Boolean
});

mongoose.model('Provider', ProviderSchema);
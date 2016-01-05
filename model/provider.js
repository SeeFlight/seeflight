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
	host : String,
	path : String,
	tokenId : String,
	callback : String
});

mongoose.model('Provider', ProviderSchema);
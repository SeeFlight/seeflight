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
	url : String,
	jsonConf : String
});

mongoose.model('Provider', ProviderSchema);
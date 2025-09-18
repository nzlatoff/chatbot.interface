const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema(
	{
		token: {
			type: String,
		},
		startedAt: {
			type: Date,
		},
		createdAt: {
			type: Date,
		},
		lifetimeMin: {
			type: Number,
		},
		name: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

let Token = mongoose.model("token", tokenSchema, "tokens");

module.exports = Token;

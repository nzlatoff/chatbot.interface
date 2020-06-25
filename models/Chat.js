const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    character: {
      type: String
    },
    message: {
      type: String
    },
    sender: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

let Chat = mongoose.model("theChat", chatSchema, "leschats");

module.exports = Chat;

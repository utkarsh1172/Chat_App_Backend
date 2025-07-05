const mongoose = require("mongoose");

const UserDetailSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobile: String,
    password: String,
    
  
  },
  {
    collection: "UserCred",
  }
);
mongoose.model("UserCred", UserDetailSchema);
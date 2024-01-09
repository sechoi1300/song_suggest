const mongoose = require("mongoose");
const db = "mongodb+srv://sechoi1300:CPkqckH6MhtF4XQM@cluster0.l26sg0e.mongodb.net/?retryWrites=true&w=majority";

mongoose.set("strictQuery", true, "useNewUrlParser", true);

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    console.log("MongoDB is Connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
module.exports = connectDB;
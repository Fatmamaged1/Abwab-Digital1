const mongoose = require("mongoose");
const database = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    
    .then((conn) => {
      console.log(`connecting to ${conn.connection.host}`);
    })
    .catch((err) => {
      console.error(`database connection error: ${err}`);
      process.exit(1);
    });
};
module.exports = database;

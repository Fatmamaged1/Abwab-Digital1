const mongoose = require("mongoose");
const database = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    //Fatmamaged
    //Z5RXbiUp1PxiSaac
    .then((conn) => {
      console.log(`connecting to ${conn.connection.host}`);
    })
    .catch((err) => {
      console.error(`database connection error: ${err}`);
      process.exit(1);
    });
};
module.exports = database;

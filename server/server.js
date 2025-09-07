const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const app = require("./app");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to DB!");

        app.listen(process.env.PORT, () => {
            console.log(`Port is listening to request on ${process.env.PORT}`)
        })
    })
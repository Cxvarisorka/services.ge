const { Vonage } = require('@vonage/server-sdk')

const vonage = new Vonage({
    apiKey: "8fdbb205",
    apiSecret: process.env.VONAGE_SECRET
});

module.exports = vonage;
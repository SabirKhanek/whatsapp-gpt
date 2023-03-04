const { Configuration, OpenAIApi } = require("openai")
require('dotenv').config()
// Check if the environment variables are set
if (!process.env.openai_key) {
    console.log('Please set the openai_key environment variables')
    process.exit(1)
}
const configuration = new Configuration({
    apiKey: process.env.openai_key
});

module.exports.openai = new OpenAIApi(configuration);
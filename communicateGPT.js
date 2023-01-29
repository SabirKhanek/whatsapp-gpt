const { Configuration, OpenAIApi } = require("openai")
const keyopenai = require('./key.json').api_key;
const configuration = new Configuration({
    apiKey: keyopenai,
});

const openai = new OpenAIApi(configuration);

async function generateResponse(request) {
    try {
        const resp = await openai.createCompletion({
            model: "text-davinci-002",
            prompt: request,
            temperature: 0.3,
            max_tokens: 3000,
            top_p: 1.0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
        })
        if (resp.data.choices[0].text) {
            txt = resp.data.choices[0].text
            return txt
        } else {
            return "Failed to get a response from GPT-3"
        }
    }
    catch (err) {
        return "Failed to get a response from GPT-3"
    }
}


module.exports = generateResponse;
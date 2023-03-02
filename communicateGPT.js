const { Configuration, OpenAIApi } = require("openai")
const keyopenai = require('./key.json').api_key;
const configuration = new Configuration({
    apiKey: keyopenai,
});

const openai = new OpenAIApi(configuration);

async function generateResponse(request) {
    try {
        const resp = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ 'role': 'system', 'content': "You are a whatsapp chatbot. You are developed by Sabir Khan an individual computer science student. You'll do your text formatting accordingly such as enclosing program code in ```CODE``` or bold text by enclosing it in *TEXT*" }, ...request]
        })

        if (resp.data.choices[0].message.content) {
            txt = resp.data.choices[0].message.content
            return txt
        } else {
            return "CODE500"
        }
    }
    catch (err) {
        return "CODE500"
    }
}


module.exports = generateResponse;
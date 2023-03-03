const { Configuration, OpenAIApi } = require("openai")
const { model_role: modelRole } = require('./config.js')

const configuration = new Configuration({
    apiKey: process.env.openai_key
});

const openai = new OpenAIApi(configuration);

async function generateResponse(request) {
    try {
        const resp = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ 'role': 'system', 'content': (modelRole ? modelRole : "You are a WhatsApp ChatBot") }, ...request]
        })

        if (resp.data.choices[0].message.content) {
            txt = resp.data.choices[0].message.content
            return txt
        } else {
            return "CODE500"
        }
    }
    catch (err) {
        console.log(err)
        return "CODE500"
    }
}

if (typeof module !== 'undefined' && !module.parent) {
    generateResponse([{ 'role': 'user', 'content': 'Hello' }]).then((resp) => {
        console.log(resp)
    })
}


module.exports = generateResponse;
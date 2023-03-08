const { openai } = require("./openai")
const { config, instructions: operationCommands } = require('./config.js')

async function generateResponse(request) {
    try {
        const resp = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ 'role': 'system', 'content': (config.model_role ? config.model_role : "You are a WhatsApp ChatBot") }, ...operationCommands, ...request]
        })

        if (resp.data.choices[0].message.content) {
            txt = { reply: resp.data.choices[0].message.content, cost: resp.data.usage.total_tokens }
            return txt
        } else {
            return "CODE500"
        }
    }
    catch (err) {
        console.log(err.message)
        return "CODE500"
    }
}

if (typeof module !== 'undefined' && !module.parent) {
    generateResponse([{ 'role': 'user', 'content': 'Hello' }]).then((resp) => {
        console.log(resp)
    })
}


module.exports = generateResponse;
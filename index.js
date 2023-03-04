require('dotenv').config()
// Check if the environment variables are set
if (!process.env.openai_key) {
    console.log('Please set the openai_key environment variables')
    process.exit(1)
}

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const generateAIResp = require('./communicateGPT.js');
const handleVoice = require('./speechToText.js');
const { handleDallERequest } = require('./textToImage.js');
const { commands, help: helpResponse } = require('./commands.js');


function hasResponseCommand(text) {
    if (text.includes('%%%DALLE-REQUEST%%%')) {
        return '%%%DALLE-REQUEST%%%'
    }
}

const responseCommandsOperations = {
    '%%%DALLE-REQUEST%%%': handleDallERequest
}


const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', "--disable-setuid-sandbox"]
    }
});

let conversationHistory = {};

// Read conversation history from file if it exists
if (fs.existsSync('conversationHistory.json')) {
    const data = fs.readFileSync('conversationHistory.json');
    conversationHistory = JSON.parse(data);
}

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED: ', qr);
    qrcode.generate(qr, { small: true })
});

async function handleMedia(message) {
    const media = await message.downloadMedia();
    if (media.mimetype === 'audio/ogg; codecs=opus') {
        const request = await handleVoice(media)
        if (request === 'NO TRANSCRIPTION') {
            client.sendMessage(message.from, 'I was unable to understand what you just said. Kindly try again. If it persists, please try typing instead.')
            return
        } else {
            return request
        }
    }
}

function handleCommands(req, message) {
    if (req === '%%clear') {
        // Clear the conversation history for this user
        conversationHistory[message.from] = [];
        client.sendMessage(message.from, 'Conversation history cleared');
        return true;
    } else if (req == '%%help') {
        client.sendMessage(message.from, helpResponse);
        return true;
    } else {
        return false;
    }
}

async function handleRequest(req, message) {
    if (req.startsWith('%%') && commands.includes(req)) {
        // Handle commands
        if (handleCommands(req, message)) return
    } else {
        // Store the message in the conversation history
        if (!conversationHistory[message.from]) {
            conversationHistory[message.from] = [];
        }
        conversationHistory[message.from].push({
            role: 'user',
            content: req,
        });

        // Create Request with past conversation
        const apiReq = [...conversationHistory[message.from]]

        // Generate a response
        var reply;
        try {
            reply = await generateAIResp(apiReq);
            if (reply === 'CODE500') throw 'error'
        } catch (error) {
            client.sendMessage(message.from, 'Something went wrong. Try clearing the conversation by typing "%%clear"');
            conversationHistory[message.from].pop()
            return
        }

        // TODO: Will add DALL-E integration here
        const response_command = hasResponseCommand(reply)
        if (Object.keys(responseCommandsOperations).includes(response_command)) {
            const operation = responseCommandsOperations[response_command]
            const operationResult = await operation(reply)
            if (operationResult) reply = operationResult
            else {
                client.sendMessage(message.from, "I am sorry I couldn't generate the requested image.")
                return
            }
        }
        // END TODO

        // Send the response to the user and store it in the conversation history
        if (typeof reply === 'string') {
            client.sendMessage(message.from, reply);
            conversationHistory[message.from].push({
                role: 'assistant',
                content: reply,
            });
        } else {
            if (reply.type && reply.type === 'media') {
                try {
                    const media = await MessageMedia.fromUrl(reply.mediaUrl);
                    client.sendMessage(message.from, media, { caption: reply.caption })
                    // conversationHistory[message.from].push({
                    //     role: 'assistant',
                    //     content: `Here's the image you requested:\n${reply.mediaUrl}`,
                    // });
                } catch (err) {
                    client.sendMessage(message.from, `Image was generated from DALL-E but couldn't be downloaded.\nYou can get the image from the URL yourself:\n${reply.mediaUrl}`)
                    // conversationHistory[message.from].push({
                    //     role: 'assistant',
                    //     content: `Here's the image you requested:\n${reply.mediaUrl}`,
                    // });
                }

            }
        }


        // Write the conversation history to a file after every message
        await fs.promises.writeFile('conversationHistory.json', JSON.stringify(conversationHistory))
        return true
    }
}

client.on('message', async (message) => {
    if (message.from === 'status@broadcast') return
    let request;
    if (message.hasMedia) {
        request = await handleMedia(message)
    }
    if (!request) request = message.body
    if (!request || !request.length > 0) return
    const response = await handleRequest(request, message);
});

client.on('ready', () => {
    console.log('Client is ready!');
});


client.initialize();
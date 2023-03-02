const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const generateAIResp = require('./communicateGPT.js');
const fs = require('fs');

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

client.on('message', async (message) => {
    if (message.from === 'status@broadcast') return
    console.log(`Message received: ${message.body} from ${message.from}`);

    // Store the message in the conversation history
    if (!conversationHistory[message.from]) {
        conversationHistory[message.from] = [];
    }
    conversationHistory[message.from].push({
        role: 'user',
        content: message.body,
    });

    const req = [...conversationHistory[message.from]]

    if (message.body === '!clear') {
        // Clear the conversation history for this user
        conversationHistory[message.from] = [];
        client.sendMessage(message.from, 'Conversation history cleared');
    } else {
        var reply;
        try {
            reply = await generateAIResp(req);
            if (reply === 'CODE500') throw 'error'
        } catch (error) {
            client.sendMessage(message.from, 'Something went wrong. Try clearing the conversation by');
            conversationHistory[message.from].pop()
            return
        }

        // Send the response to the user and store it in the conversation history
        client.sendMessage(message.from, reply);
        conversationHistory[message.from].push({
            role: 'assistant',
            content: reply,
        });
    }

    // Write the conversation history to a file after every message
    fs.writeFile('conversationHistory.json', JSON.stringify(conversationHistory), (err) => {
        if (err) {
            console.error(err);
        }
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
});


client.initialize();
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const generateAIResp = require('./communicateGPT.js')
const fs = require('fs');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', "--disable-setuid-sandbox"]
    }
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED: ', qr);
    qrcode.generate(qr, { small: true })
});

client.on('message', async (message) => {
    console.log(`Message received: ${message.body} from ${message.from}`)
    const reply = await generateAIResp(message.body)
    client.sendMessage(message.from, reply)
})

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();
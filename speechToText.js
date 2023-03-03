const { Leopard } = require("@picovoice/leopard-node");
const fs = require('fs');

const handle = new Leopard(process.env.picovoice_key);

async function getTranscription(mimetype, data) {
    // Generate a random file name with the same extension as the mimetype
    const extension = mimetype.split('/')[1].split(';')[0];
    const fileName = `${Math.random().toString(36).substring(2)}.${extension}`;

    // Write the base64 data to a file
    await fs.promises.writeFile(fileName, data, { encoding: 'base64' })
    // Perform operation on file
    const { transcript } = handle.processFile(fileName)
    // Delete the file
    try {
        await fs.promises.unlink(fileName)
    } catch {

    }
    if (transcript.length && transcript.length > 0) {
        return transcript
    }
}


async function handleVoice({ mimetype, data }) {
    // Get the transcription
    let transcription;
    try {
        transcription = await getTranscription(mimetype, data);
    } catch {
        return 'NO TRANSCRIPTION'
    }

    if (transcription) {
        return transcription
    } else {
        return 'NO TRANSCRIPTION'
    }
}

module.exports = handleVoice;
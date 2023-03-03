const fs = require('fs');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const FormData = require('form-data');

async function generateTranscription(filePath) {
    console.log(filePath)
    console.log(fs.existsSync(filePath))
    // set up the form data object
    const form = new FormData();
    form.append('model', 'whisper-1');
    form.append('file', fs.createReadStream(filePath));

    // send the POST request with Axios
    try {
        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
            headers: {
                'Authorization': 'Bearer ' + process.env.openai_key,
                ...form.getHeaders()
            }
        })
        console.log(response.data.text)
        return response.data.text
    } catch (err) {
        console.log(err.message)
        return ''
    }
}

async function convertOggToMp3(fileName) {
    // Replace with the correct paths for your input/output files
    const inputFilePath = fileName + '.ogg';
    const outputFilePath = fileName + '.mp3'

    // Create a readable stream for the input '.ogg' file
    const inputStream = fs.createReadStream(inputFilePath);

    // Use fluent-ffmpeg to convert the '.ogg' file to '.mp3' format
    ffmpeg(inputStream)
        .format('mp3')
        .pipe(fs.createWriteStream(outputFilePath))
        .on('finish', async () => {
            console.log('Conversion complete');
            try {
                await fs.promises.unlink(fileName + '.ogg')
            } catch {
                console.error('Error deleting the .ogg file');
            }
        });

    while (!fs.existsSync(outputFilePath)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return outputFilePath;
}

async function getTranscription(mimetype, data) {
    // Generate a random file name with the same extension as the mimetype
    const extension = mimetype.split('/')[1].split(';')[0];
    const fileName = `${Math.random().toString(36).substring(2)}`;

    // Write the base64 data to a file
    await fs.promises.writeFile(fileName + '.ogg', data, { encoding: 'base64' })
    // Perform operation on file

    // Get Mp3 audio file from OGG
    const fileNameMp3 = await convertOggToMp3(fileName)

    const transcript = await generateTranscription(fileNameMp3)

    // Delete the file
    try {
        await fs.promises.unlink(fileName + '.mp3')
    } catch {

    }
    if (transcript.length && transcript.length > 0) {
        return transcript
    }
}

if (typeof module !== 'undefined' && !module.parent) {
    // generateResponse([{ 'role': 'user', 'content': 'Hello' }]).then((resp) => {
    //     console.log(resp)
    // })
    generateTranscription('sound.mp3').then((resp => console.log(resp))).catch((err) => console.log(err))
}


async function handleVoice({ mimetype, data }) {
    // Get the transcription
    let transcription;
    try {
        transcription = await getTranscription(mimetype, data);
        console.log(transcription)
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
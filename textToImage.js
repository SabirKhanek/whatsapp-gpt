const { openai } = require('./openai')

async function handleDallERequest(request) {
    try {
        const indexOFOpen = request.indexOf('{')
        const indexOfClose = request.indexOf('}')
        if (indexOFOpen === -1 || indexOFOpen === -1 || indexOFOpen > indexOfClose) throw new Error('Invalid DALL-E Request format');
        let serviceRequest;
        serviceRequest = JSON.parse(request.slice(indexOFOpen, indexOfClose + 1))
        if (!(serviceRequest.promp || serviceRequest.caption)) throw new Error('Invalid DALL-E Request format');
        const response = await openai.createImage({ prompt: serviceRequest.prompt, n: 1, size: (serviceRequest.dimensions ? serviceRequest.dimensions : '512x512') })
        console.log('Logs: ' + response.data.data[0].url)
        if (response.data) {
            return { mediaUrl: response.data.data[0].url, caption: serviceRequest.caption, type: 'media', from: 'dall-e' };
        } else {
            throw new Error('invalid response from openai')
        }
    } catch (err) {
        console.log('Error in textToImage.js: ' + err.message)
        return
    }
}

if (typeof module !== 'undefined' && !module.parent) {
    handleDallERequest(text).then((resp) => {
        console.log(`ImageURL: ${resp.mediaUrl}\ncaption: ${resp.caption}`)
    })
}

module.exports.handleDallERequest = handleDallERequest


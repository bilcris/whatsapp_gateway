async function sendTextMessage(sessionId, number, message) {
    const sock = clients.get(sessionId);
    if (!sock) throw new Error('Session not found');
    if (!sock.user) throw new Error('Session not connected to WhatsApp');

    const jid = number.includes('@s.whatsapp.net') ? number: `${number}@s.whatsapp.net`;
    try {
        await sock.sendMessage(jid, { text: message});
    } catch (err) {
        console.error(`Gagak mengirim pesan: ${err.message}`);
        throw err;
    }
}

async function sendMedia(sessionId, number, fileUrl, caption = '', mediaType = 'document') {
    const sock = clients.get(sessionId);
    if (!sock) throw new Error('Session not found');
    if (!sock.user) throw new Error('Session not connected to WhatsApp');

    const response = await axios.get(fileUrl, { responseType: 'arraybuffer'});
    const buffer = Buffer.from(response.data, 'binary');
    let message;
    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;

    switch (mediaType) {
        case 'image':
            message = { image : buffer };
            break;
        case 'video':
            message = {video: buffer };
            break;
        case 'audio':
            message = { 
                audio : buffer,
                mimetype : 'audio/ogg; codecs=opus'
             };
            break;
        default:
            const fileName = fileUrl.split('/').pop();
            message = { 
                document : buffer,
                fileName : fileName,
                mimetype : mime.lookup(message.fileName) || 'application/octet-stream'
            }
            break;
    }

    if (caption) {
        message.caption = caption;
    }

    await sock.sendMessage(jid, message);
}

async function sendMediaFromUpload(sessionId, number, file, caption = '', mediaType = 'document'){
    const sock = clients.get(sessionId);
    
    if (!sock) throw new Error('Session not found');
    if (!sock.user) throw new Error('Session not connected to WhatsApp');

    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
    const buffer = file.buffer;
    const mimeType = file.mimetype;
    const fileName = file.originalname;

    let message;
    switch (mediaType) {
        case 'image':
            message = { image : buffer };
            break;
        case 'video':
            message = {video: buffer };
            break;
        case 'audio':
            message = { 
                audio : buffer,
                mimetype : 'audio/ogg; codecs=opus'
             };
            break;
        default:
            message = { 
                document : buffer,
                fileName : fileName,
                mimetype : mimeType || 'application/octet-stream'
            }
            break;
    }

    if (caption) message.caption = caption;
    await sock.sendMessage(jid, message);

}

module.exports = { sendTextMessage, sendMedia, sendMediaFromUpload }
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const settings = require('./setting');

const bot = new TelegramBot(settings.botToken, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Menu Unblock WhatsApp', callback_data: 'menuubenwa' }],
        [{ text: 'Menu Antivirus', callback_data: 'menuantivirus' }],
        [{ text: 'Admin Panel', callback_data: 'admin' }],
        [{ text: 'Cara Penggunaan', callback_data: 'cara' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Selamat datang di Bot Uben WA! Pilih menu di bawah:', opts);
});

bot.onText(/\/menuubenwa/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Uben WA 1', callback_data: 'ubenwa1' }],
        [{ text: 'Uben WA 2', callback_data: 'ubenwa2' }],
        [{ text: 'Uben WA 3', callback_data: 'ubenwa3' }],
        [{ text: 'Uben WA 4', callback_data: 'ubenwa4' }],
        [{ text: 'Uben WA 5', callback_data: 'ubenwa5' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Pilih teks unblock WhatsApp yang ingin dikirim:', opts);
});

bot.onText(/\/menuantivirus/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Cek Link', callback_data: 'ceklink' }],
        [{ text: 'Cek File', callback_data: 'cekfile' }],
        [{ text: 'Cek APK', callback_data: 'cekapk' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Pilih opsi antivirus:', opts);
});

bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  if (msg.from.id.toString() === settings.adminId) {
    bot.sendMessage(chatId, 'Admin panel: Use /settext <key> <new text> to change texts.');
  } else {
    bot.sendMessage(chatId, 'You are not authorized.');
  }
});

bot.onText(/\/settext (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (msg.from.id.toString() === settings.adminId) {
    const key = match[1];
    const newText = match[2];
    if (settings.texts[key]) {
      settings.texts[key] = newText;
      fs.writeFileSync('./setting.js', `module.exports = ${JSON.stringify(settings, null, 2)};`);
      bot.sendMessage(chatId, `Text for ${key} updated.`);
    } else {
      bot.sendMessage(chatId, 'Invalid key.');
    }
  } else {
    bot.sendMessage(chatId, 'You are not authorized.');
  }
});

for (let i = 1; i <= 5; i++) {
  bot.onText(new RegExp(`\/ubenwa${i}`), (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, settings.texts[`ubenwa${i}`]);
  });
}

bot.onText(/\/ceklink/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Send the link to check for viruses.');
  bot.once('message', (msg) => {
    if (msg.text && msg.text.startsWith('http')) {
      checkVirus(msg.text, chatId, 'link');
    } else {
      bot.sendMessage(chatId, 'Invalid link.');
    }
  });
});

bot.onText(/\/cekfile/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Send the file to check for viruses.');
});

bot.onText(/\/cekapk/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Send the APK file to check for viruses.');
});

bot.on('document', (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.document.file_id;
  const fileName = msg.document.file_name;
  if (fileName.endsWith('.apk')) {
    checkVirusFile(fileId, chatId, 'apk');
  } else {
    checkVirusFile(fileId, chatId, 'file');
  }
});

async function checkVirus(url, chatId, type) {
  try {
    // First, check if URL has been scanned before
    const reportResponse = await axios.get(`https://www.virustotal.com/vtapi/v2/url/report?apikey=${settings.totalVirusApiKey}&resource=${encodeURIComponent(url)}`);
    const reportResult = reportResponse.data;
    if (reportResult.response_code === 1) {
      const positives = reportResult.positives;
      const total = reportResult.total;
      bot.sendMessage(chatId, `${type} check: ${positives}/${total} detections.`);
    } else {
      // If not scanned, submit for scan
      const scanResponse = await axios.post(`https://www.virustotal.com/vtapi/v2/url/scan?apikey=${settings.totalVirusApiKey}&url=${encodeURIComponent(url)}`);
      const scanResult = scanResponse.data;
      if (scanResult.response_code === 1) {
        bot.sendMessage(chatId, 'Scanning URL... Please wait 30 seconds for results.');
        setTimeout(async () => {
          const finalReportResponse = await axios.get(`https://www.virustotal.com/vtapi/v2/url/report?apikey=${settings.totalVirusApiKey}&resource=${encodeURIComponent(url)}`);
          const finalResult = finalReportResponse.data;
          if (finalResult.response_code === 1) {
            const positives = finalResult.positives;
            const total = finalResult.total;
            bot.sendMessage(chatId, `${type} check: ${positives}/${total} detections.`);
          } else {
            bot.sendMessage(chatId, 'Scan completed but no results available.');
          }
        }, 30000); // Wait 30 seconds
      } else {
        bot.sendMessage(chatId, 'Error submitting URL for scan.');
      }
    }
  } catch (error) {
    bot.sendMessage(chatId, 'Error checking virus.');
  }
}

async function checkVirusFile(fileId, chatId, type) {
  try {
    const fileLink = await bot.getFileLink(fileId);
    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(response.data);
    const formData = new FormData();
    formData.append('file', fileBuffer, 'file');
    const vtResponse = await axios.post(`https://www.virustotal.com/vtapi/v2/file/scan?apikey=${settings.totalVirusApiKey}`, formData, {
      headers: formData.getHeaders()
    });
    const scanId = vtResponse.data.scan_id;
    setTimeout(async () => {
      const reportResponse = await axios.get(`https://www.virustotal.com/vtapi/v2/file/report?apikey=${settings.totalVirusApiKey}&resource=${scanId}`);
      const result = reportResponse.data;
      if (result.response_code === 1) {
        const positives = result.positives;
        const total = result.total;
        bot.sendMessage(chatId, `${type} check: ${positives}/${total} detections.`);
      } else {
        bot.sendMessage(chatId, 'No results found.');
      }
    }, 30000); // Wait 30 seconds for scan
  } catch (error) {
    bot.sendMessage(chatId, 'Error checking virus.');
  }
}

// Handle callback queries for inline buttons
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'menuubenwa') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Uben WA 1', callback_data: 'ubenwa1' }],
          [{ text: 'Uben WA 2', callback_data: 'ubenwa2' }],
          [{ text: 'Uben WA 3', callback_data: 'ubenwa3' }],
          [{ text: 'Uben WA 4', callback_data: 'ubenwa4' }],
          [{ text: 'Uben WA 5', callback_data: 'ubenwa5' }],
          [{ text: 'Kembali', callback_data: 'start' }]
        ]
      }
    };
    bot.sendMessage(chatId, 'Pilih teks unblock WhatsApp yang ingin dikirim:', opts);
  } else if (data === 'menuantivirus') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Cek Link', callback_data: 'ceklink' }],
          [{ text: 'Cek File', callback_data: 'cekfile' }],
          [{ text: 'Cek APK', callback_data: 'cekapk' }],
          [{ text: 'Kembali', callback_data: 'start' }]
        ]
      }
    };
    bot.sendMessage(chatId, 'Pilih opsi antivirus:', opts);
  } else if (data === 'admin') {
    if (query.from.id.toString() === settings.adminId) {
      bot.sendMessage(chatId, 'Admin panel: Use /settext <key> <new text> to change texts.');
    } else {
      bot.sendMessage(chatId, 'You are not authorized.');
    }
  } else if (data.startsWith('ubenwa')) {
    const num = data.replace('ubenwa', '');
    bot.sendMessage(chatId, settings.texts[`ubenwa${num}`]);
  } else if (data === 'ceklink') {
    bot.sendMessage(chatId, 'Kirim link yang ingin dicek virusnya.');
    bot.once('message', (msg) => {
      if (msg.text && msg.text.startsWith('http')) {
        checkVirus(msg.text, chatId, 'link');
      } else {
        bot.sendMessage(chatId, 'Link tidak valid.');
      }
    });
  } else if (data === 'cekfile') {
    bot.sendMessage(chatId, 'Kirim file yang ingin dicek virusnya.');
  } else if (data === 'cekapk') {
    bot.sendMessage(chatId, 'Kirim file APK yang ingin dicek virusnya.');
  } else if (data === 'cara') {
    const cara = `
Cara Penggunaan Bot Uben WA:

1. **Menu Unblock WhatsApp**:
   - Pilih teks unblock yang ingin dikirim.
   - Kirim teks tersebut ke:
     - support@whatsapp.com
     - https://www.whatsapp.com/contact/?subject=messenger

2. **Menu Antivirus**:
   - Pilih 'Cek Link' lalu kirim link untuk cek virus.
   - Pilih 'Cek File' atau 'Cek APK' lalu upload file untuk cek virus.

3. **Admin Panel** (hanya untuk admin):
   - Gunakan /settext ubenwa1 Teks baru untuk ubah teks unblock.

Bot ini menggunakan API Total Virus untuk cek virus.
    `;
    bot.sendMessage(chatId, cara);
  } else if (data === 'start') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Menu Unblock WhatsApp', callback_data: 'menuubenwa' }],
          [{ text: 'Menu Antivirus', callback_data: 'menuantivirus' }],
          [{ text: 'Admin Panel', callback_data: 'admin' }],
          [{ text: 'Cara Penggunaan', callback_data: 'cara' }]
        ]
      }
    };
    bot.sendMessage(chatId, 'Selamat datang di Bot Uben WA! Pilih menu di bawah:', opts);
  }

  bot.answerCallbackQuery(query.id);
});

console.log('Bot is running...');

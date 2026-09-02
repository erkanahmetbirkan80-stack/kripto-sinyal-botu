javascriptconst TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Sizin Bot Token bilginiz buraya eklenmiştir
const TOKEN = '8974920211:AAG8xJ4CaUtdmmSeqV0McSqtLhBpv9VZQPg';
// Buradaki tırnak içine @userinfobot'tan aldığınız ID numarasını yazın (Örn: '12345678')
const CHAT_ID = 'BURAYA_CHAT_ID_YAZIN';

const bot = new TelegramBot(TOKEN, { polling: true });

bot.sendMessage(CHAT_ID, "🚀 Binance Sinyal Botu Render üzerinde başarıyla başlatıldı! Anlık takip yapılıyor...");

async function kriptoTakipEt() {
    try {
        const response = await axios.get('https://binance.com');
        const fiyati = parseFloat(response.data.price);
        console.log(`Anlık BTC Fiyatı: $${fiyati}`);
    } catch (error) {
        console.error("Binance verisi çekilemedi:", error.message);
    }
}

setInterval(kriptoTakipEt, 60000);

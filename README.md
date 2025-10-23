# Telegram Bot Uben WA

Bot Telegram untuk membantu unblock akun WhatsApp dan cek virus menggunakan Total Virus API.

## Fitur

- **Menu Unblock WhatsApp**: Kirim teks permohonan unblock ke support WhatsApp.
- **Menu Antivirus**: Cek virus pada link, file, atau APK menggunakan Total Virus API.
- **Admin Panel**: Admin dapat mengubah teks unblock.

## Cara Penggunaan

1. **Setup Bot**:
   - Buat bot di Telegram via BotFather dan dapatkan token.
   - Dapatkan API key dari Total Virus.
   - Edit `setting.js` dengan token bot, ID bot, API key, dan ID admin.

2. **Jalankan Bot**:
   ```
   npm install
   npm start
   ```

3. **Interaksi dengan Bot**:
   - Kirim `/start` untuk menu utama.
   - Pilih menu menggunakan tombol inline.
   - Untuk unblock: Pilih teks dan kirim ke support@whatsapp.com atau https://www.whatsapp.com/contact/?subject=messenger.
   - Untuk antivirus: Kirim link atau upload file/APK untuk cek virus.

4. **Admin**:
   - Gunakan `/admin` untuk panel admin.
   - Gunakan `/settext ubenwa1 Teks baru` untuk ubah teks.

## Dependencies

- node-telegram-bot-api
- axios
- form-data

## Catatan

- Pastikan API key Total Virus valid.
- Bot menggunakan polling untuk menerima pesan.

const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "hi",
        version: "1.1",
        author: "Kaizenji",
        countDown: 1,
        role: 0,
        description: {
            en: "Response with a premium greeting"
        },
        category: "box chat",
    },

    onStart: async function() {}, 

    onChat: async function({ event, message, usersData }) {
        if (!event.body) return;

        const input = event.body.toLowerCase();
        const greetings = ["hi", "henlo", "hii", "hello", "zup", "hey", "yo"];
        
        if (greetings.includes(input)) {
            const name = await usersData.getName(event.senderID);
            const bankPath = path.join(__dirname, "cache", "bankData.json");
            
            // --- Custom Unique Design ---
            let statusMsg = "✨ ᴠɪᴘ ᴍᴇᴍʙᴇʀ";
            
            // Check if they have a loan from your bank system
            if (fs.existsSync(bankPath)) {
                const bankData = fs.readJsonSync(bankPath);
                if (bankData[event.senderID] && bankData[event.senderID].loan > 0) {
                    statusMsg = "📉 ɪɴ ᴅᴇʙᴛ";
                }
            }

            const response = 
                `╭──『 𝗠𝗔𝗖𝗞𝗬 𝗚𝗥𝗘𝗘𝗧𝗘𝗥 』──✦\n` +
                `┃\n` +
                `┃  👋 ʜᴇʟʟᴏ, ${name.toUpperCase()}!\n` +
                `┃  💬 ʜᴏᴡ ᴄᴀɴ ɪ ʜᴇʟᴘ ʏᴏᴜ ᴛᴏᴅᴀʏ?\n` +
                `┃\n` +
                `┃  ✨ sᴛᴀᴛᴜs: ${statusMsg}\n` +
                `╰───────────────✧`;

            return message.reply(response);
        }
    }
};

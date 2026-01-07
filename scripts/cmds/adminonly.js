const fs = require("fs-extra");

module.exports = {
    config: {
        name: "adminonly",
        // I removed "lockbot" from the list below to avoid the conflict
        aliases: ["adonly", "onlyad", "toggleadmin"], 
        version: "2.1",
        author: "NTKhang / Yuan",
        countDown: 5,
        role: 2, 
        description: {
            vi: "Bật/tắt chế độ chỉ admin mới có thể sử dụng bot",
            en: "Turn on/off admin-only mode for bot"
        },
        category: "owner",
        guide: {
            en: "{pn} [on | off]"
        }
    },

    onStart: async function ({ args, message }) {
        const { config } = global.GoatBot;
        const configPath = global.client.dirConfig;

        if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
            return message.reply("Please use: adminonly [on/off]");
        }

        const isEnable = args[0].toLowerCase() === "on";

        // Update the global config object
        config.adminOnly.enable = isEnable;

        try {
            // Write to config.json so it persists after restart
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

            if (isEnable) {
                return message.reply(
                    "╔═══════════════════════════╗\n" +
                    "🔒 ⚡ 𝗕𝗢𝗧 𝗟𝗢𝗖𝗞𝗘𝗗 ⚡ 🔒\n" +
                    "🛑 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬 𝐚𝗿𝐞 𝐝𝐢𝐬𝐚𝐛𝗹𝗲𝐝 𝐟𝗼𝐫 𝐧𝐨𝐰!\n" +
                    "📩 𝗖𝗼𝗻𝘁𝗮𝗰𝘁 𝐭𝐡𝐞 𝗮𝗱𝗺𝗶𝗻𝘀:\n" +
                    "🟦 facebook.com/61562953390569\n" +
                    "╚═══════════════════════════╝"
                );
            } else {
                return message.reply("🔓 𝗔𝗗𝗠𝗜𝗡-𝗢𝗡𝗟𝗬 𝗠𝗢𝗗𝗘 𝗗𝗜𝗦𝗔𝗕𝗟𝗘𝗗\nAll users can now use the bot.");
            }
        } catch (err) {
            console.error(err);
            return message.reply("Error: Could not update the config file.");
        }
    }
};
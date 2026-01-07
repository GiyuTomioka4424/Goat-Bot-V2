const fs = require("fs-extra");
const { getStreamsFromAttachment } = global.utils;

module.exports = {
    config: {
        name: "locknotify",
        aliases: ["locknoti", "announcelock"],
        version: "1.0",
        author: "NTKhang / Gemini",
        countDown: 10,
        role: 2,
        description: {
            vi: "Bật/tắt chế độ admin và thông báo cho tất cả các nhóm",
            en: "Toggle admin-only mode and notify all groups"
        },
        category: "owner",
        guide: {
            en: "{pn} [on | off] (kèm ảnh/video nếu muốn)"
        },
        envConfig: {
            delayPerGroup: 250
        }
    },

    onStart: async function ({ message, api, event, args, threadsData, commandName, envCommands }) {
        const { config } = global.GoatBot;
        const configPath = global.client.dirConfig;
        const { delayPerGroup } = envCommands[commandName];

        if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
            return message.reply("Please use: {pn} on OR {pn} off");
        }

        const isEnable = args[0].toLowerCase() === "on";
        
        // 1. Update the Bot Status
        config.adminOnly.enable = isEnable;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        // 2. Prepare the Announcement Message
        const banner = isEnable 
            ? "╔═══════════════════════════╗\n" +
              "🔒 ⚡ 𝗕𝗢𝗧 𝗟𝗢𝗖𝗞𝗘𝗗 ⚡ 🔒\n" +
              "🛑 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬 𝐚𝗿𝐞 𝐝𝐢𝐬𝐚𝐛𝗹𝗲𝐝 𝐟𝗼𝐫 𝐧𝐨𝐰!\n" +
              "📩 𝗖𝗼𝗻𝘁𝗮𝗰𝘁 𝐭𝐡𝐞 𝗮𝗱𝗺𝗶𝗻𝐬:\n" +
              "🟦 facebook.com/61562953390569\n" +
              "╚═══════════════════════════╝"
            : "╔═══════════════════════════╗\n" +
              "🔓 ⚡ 𝗕𝗢𝗧 𝗨𝗡𝗟𝗢𝗖𝗞𝗘𝗗 ⚡ 🔓\n" +
              "✅ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 𝗮𝗿𝗲 𝗻𝗼𝘄 𝗲𝗻𝗮𝗯𝗹𝗲𝗱!\n" +
              "✨ Thank you for your patience.\n" +
              "╚═══════════════════════════╝";

        const formSend = {
            body: `⚠️ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗨𝗣𝗗𝗔𝗧𝗘\n────────────────\n${banner}`,
            attachment: await getStreamsFromAttachment(
                [
                    ...event.attachments,
                    ...(event.messageReply?.attachments || [])
                ].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
            )
        };

        // 3. Get all groups
        const allThreads = (await threadsData.getAll()).filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);
        
        message.reply(`Processing... Admin-only mode: ${isEnable ? "ON" : "OFF"}\nSending announcement to ${allThreads.length} groups.`);

        // 4. Broadcast Loop
        let sentCount = 0;
        for (const thread of allThreads) {
            try {
                await api.sendMessage(formSend, thread.threadID);
                sentCount++;
                await new Promise(resolve => setTimeout(resolve, delayPerGroup));
            } catch (e) {
                console.error(`Failed to send to ${thread.threadID}`);
            }
        }

        return message.reply(`✅ System Updated!\nStatus: ${isEnable ? "LOCKED" : "UNLOCKED"}\nBroadcasted to ${sentCount} groups.`);
    }
};
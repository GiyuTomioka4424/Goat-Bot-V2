module.exports = {
    config: {
        name: "status",
        aliases: ["stats", "gamestatus"],
        version: "4.1",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "system"
    },

    onStart: async function ({ message, event }) {
        const { threadID } = event;

        // --- 1. SABONG STATUS ---
        const sabong = global.sabongSystem;
        let sabongDisplay = "🔴 **CLOSED**\n   └ *Update: Arena is quiet.*";
        if (sabong && sabong.stage !== "closed") {
            const limit = sabong.stage === "betting" ? 300000 : 120000;
            const remaining = Math.max(0, Math.ceil((limit - (Date.now() - sabong.startTime)) / 1000));
            sabongDisplay = `🟢 **OPEN** (${sabong.stage.toUpperCase()})\n   └ *Update: ${Math.floor(remaining / 60)}m ${remaining % 60}s remaining*`;
        }

        // --- 2. COLOR GAME STATUS ---
        const cg = global.cgSystem;
        let cgDisplay = "🔴 **CLOSED**\n   └ *Update: No dice rolling.*";
        if (cg && cg.stage !== "closed") {
            const limit = cg.stage === "betting" ? 300000 : 120000;
            const remaining = Math.max(0, Math.ceil((limit - (Date.now() - cg.startTime)) / 1000));
            cgDisplay = `🟢 **OPEN** (${cg.stage.toUpperCase()})\n   └ *Update: ${Math.floor(remaining / 60)}m ${remaining % 60}s remaining*`;
        }

        // --- 3. RAFFLE STATUS ---
        const raffle = global.raffleSystem;
        let raffleDisplay = "🔴 **CLOSED**\n   └ *Update: No mystery prizes.*";
        if (raffle && raffle.isOpen) {
            raffleDisplay = `🟢 **OPEN**\n   └ *Update: ${raffle.participants.length} joined. Waiting for Spin.*`;
        }

        // --- 4. HORSE RACE STATUS ---
        const race = global.raceSystem;
        let raceDisplay = "🔴 **CLOSED**\n   └ *Update: No race active.*";
        if (race && race.isOpen) {
            raceDisplay = `🟢 **OPEN**\n   └ *Update: Betting phase active! (Global)*`;
        }

        // --- 5. LOTTO STATUS ---
        let lottoDisplay = `🟢 **ALWAYS OPEN**\n   └ *Update: Jackpot up to $10 Billion!*`;

        // --- 6. QUIZ STATUS ---
        const quiz = global.GoatBot?.onReply;
        let quizActive = false;
        if (quiz) {
            for (const [key, value] of quiz) {
                if (value.commandName === "quiz") quizActive = true;
            }
        }
        let quizDisplay = quizActive ? "🟢 **ACTIVE**\n   └ *Update: Question in progress.*" : "🔴 **IDLE**\n   └ *Update: No active trivia.*";

        // --- CONSTRUCT UNIQUE UI ---
        const msg = `🏙️ **𝗠𝗔𝗖𝗞𝗬 𝗖𝗜𝗧𝗬: 𝗚𝗔𝗠𝗘 𝗦𝗧𝗔𝗧𝗨𝗦**\n` +
                    `━━━━━━━━━━━━━━━━━━━\n\n` +
                    `🐓 **𝗦𝗔𝗕𝗢𝗡𝗚**\n` +
                    `${sabongDisplay}\n\n` +
                    `🎨 **𝗖𝗢𝗟𝗢𝗥 𝗚𝗔𝗠𝗘**\n` +
                    `${cgDisplay}\n\n` +
                    `🎫 **𝗥𝗔𝗙𝗙𝗟𝗘**\n` +
                    `${raffleDisplay}\n\n` +
                    `🏇 **𝗛𝗢𝗥𝗦𝗘 𝗥𝗔𝗖𝗘**\n` +
                    `${raceDisplay}\n\n` +
                    `🎰 **𝗠𝗔𝗖𝗞𝗬 𝗟𝗢𝗧𝗧𝗢**\n` +
                    `${lottoDisplay}\n\n` +
                    `🧠 **𝗧𝗥𝗜𝗩𝗜𝗔 𝗤𝗨𝗜𝗭**\n` +
                    `${quizDisplay}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━\n` +
                    `✨ *Type !help to see game commands!*`;

        return message.reply(msg);
    }
};
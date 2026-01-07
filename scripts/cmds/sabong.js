const fs = require("fs-extra");
const path = require("path");
const JAIL_FILE = path.join(process.cwd(), "jailData.json");

if (global.sabongSystem === undefined) {
    global.sabongSystem = { 
        stage: "closed", 
        pool: [], 
        startTime: 0, 
        timer: null 
    };
}

module.exports = {
    config: {
        name: "sabong",
        version: "15.0",
        author: "Gab Yu",
        category: "gambling"
    },

    onStart: async function ({ message, args, event, usersData, permission, api }) {
        const { senderID, threadID } = event;
        const system = global.sabongSystem;

        const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
        if (jailList[senderID] && Date.now() < jailList[senderID].releaseAt) {
            return message.reply("⛓ **𝗕𝗔𝗡𝗡𝗘𝗗 𝗙𝗥𝗢𝗠 𝗔𝗥𝗘𝗡𝗔**\nPrisoners are not allowed to join Sabong matches.");
        }

        // --- ACTION: STATUS ---
        if (args[0] === "status") {
            if (system.stage === "closed") return message.reply("🏟 **𝗦𝗔𝗕𝗢𝗡𝗚 𝗦𝗧𝗔𝗧𝗨𝗦**: 𝗖𝗟𝗢𝗦𝗘𝗗\nWait for an admin to start!");
            
            const limit = system.stage === "betting" ? 300000 : 120000;
            const elapsed = Date.now() - system.startTime;
            const remaining = Math.max(0, Math.ceil((limit - elapsed) / 1000));
            return message.reply(`🏟 **𝗦𝗔𝗕𝗢𝗡𝗚 𝗦𝗧𝗔𝗧𝗨𝗦**: ${system.stage.toUpperCase()}\n━━━━━━━━━━━━━━━\n⏰ Time: ${Math.floor(remaining / 60)}m ${remaining % 60}s\n👥 Players: ${system.pool.length}\n━━━━━━━━━━━━━━━`);
        }

        // --- ACTION: RESET (With Refund) ---
        if (args[0] === "reset") {
            if (permission < 1) return message.reply("❌ Admins only.");
            for (const player of system.pool) {
                const u = await usersData.get(player.senderID);
                await usersData.set(player.senderID, { money: (u.money || 0) + player.bet });
            }
            clearTimeout(system.timer);
            system.stage = "closed";
            system.pool = [];
            system.timer = null;
            return message.reply("📢 **𝗦𝗔𝗕𝗢𝗡𝗚 𝗥𝗘𝗦𝗘𝗧**: All bets have been refunded and arena is closed.");
        }

        // --- ADMIN: START (Global Broadcast) ---
        if (args[0] === "start") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (system.stage !== "closed") return message.reply("⚠ A match is already running!");

            system.stage = "betting";
            system.pool = [];
            system.startTime = Date.now();

            // Fetch all threads and broadcast
            const allThreads = await api.getThreadList(100, null, ["INBOX"]);
            allThreads.filter(t => t.isGroup).forEach(g => {
                api.sendMessage("📢 𝗦𝗔𝗕𝗢𝗡𝗚: 𝗕𝗘𝗧𝗧𝗜𝗡𝗚 𝗢𝗣𝗘𝗡\n━━━━━━━━━━━━━━━━━━\n🕒 𝟱 𝗠𝗶𝗻𝘂𝘁𝗲𝘀 to place bets!\n👉 Usage: `!sabong <bet> <pula/puti>`", g.threadID);
            });

            system.timer = setTimeout(async () => {
                system.stage = "ongoing";
                system.startTime = Date.now();
                
                const groupThreads = (await api.getThreadList(100, null, ["INBOX"])).filter(t => t.isGroup);
                groupThreads.forEach(g => api.sendMessage("🚫 𝗦𝗔𝗕𝗢𝗡𝗚: 𝗕𝗘𝗧𝗧𝗜𝗡𝗚 𝗖𝗟𝗢𝗦𝗘𝗗\n⚔ The fight has started in the Arena!", g.threadID));

                system.timer = setTimeout(async () => {
                    const winner = Math.random() < 0.5 ? "pula" : "puti";
                    let winnerList = "";
                    
                    for (const p of system.pool) {
                        if (p.side === winner) {
                            const winAmount = p.bet * 2;
                            const u = await usersData.get(p.senderID);
                            await usersData.set(p.senderID, { money: (u.money || 0) + winAmount });
                            winnerList += `• ${p.name}: +$${winAmount.toLocaleString()}\n`;
                        }
                    }
                    
                    // Broadcast Results to all GCs
                    groupThreads.forEach(g => {
                        api.sendMessage(`🏆 𝗦𝗔𝗕𝗢𝗡𝗚 𝗥𝗘𝗦𝗨𝗟𝗧\n━━━━━━━━━━━━━━━━━━\nWinner: **${winner.toUpperCase()}**\n\n📜 **𝗪𝗜𝗡𝗡𝗘𝗥𝗦:**\n${winnerList || "No winners."}\n━━━━━━━━━━━━━━━━━━`, g.threadID);
                    });
                    
                    system.stage = "closed";
                    system.pool = [];
                    system.timer = null;
                }, 120000); 
            }, 300000); 
            return;
        }

        // --- PLAYER: BETTING ---
        if (system.stage === "closed") return message.reply("🏟 Arena is closed.");
        if (system.stage === "ongoing") return message.reply("🚫 Fight in progress.");

        const betAmount = parseInt(args[0]);
        const side = args[1]?.toLowerCase();

   
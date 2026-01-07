const fs = require("fs-extra");
const path = require("path");

const jailDataFile = path.join(process.cwd(), "jailData.json");
const MASTER_UID = "61562953390569"; 
const ADMIN_HQ = "9553014584821737"; 

// Tracker for Auto-Arrest
const spamTracker = new Map();

module.exports = {
    config: {
        name: "arrest",
        aliases: ["jail", "prison", "unjail", "prisoners"],
        version: "10.0",
        author: "Gab Yu",
        category: "moderation",
        role: 0 
    },

    onRun: async function ({ api, event, usersData }) {
        const { senderID, threadID } = event;
        const now = Date.now();

        // 🚨 --- AUTO ARREST LOGIC (Spam Detection) ---
        if (senderID === MASTER_UID) return; // Master is immune

        let userLog = spamTracker.get(senderID) || { count: 0, startTime: now };

        // Reset tracker if 15 seconds have passed
        if (now - userLog.startTime > 15000) {
            userLog = { count: 1, startTime: now };
        } else {
            userLog.count++;
        }

        spamTracker.set(senderID, userLog);

        if (userLog.count > 10) {
            const jailList = fs.existsSync(jailDataFile) ? fs.readJsonSync(jailDataFile) : {};
            
            // Check if already jailed to prevent duplicate reports
            if (jailList[senderID] && now < jailList[senderID].releaseAt) return;

            const name = await usersData.getName(senderID) || "Unknown User";
            const fine = 20000000;
            const userData = await usersData.get(senderID);

            // Apply Fine and Jail
            await usersData.set(senderID, { money: (userData.money || 0) - fine });
            jailList[senderID] = { releaseAt: now + (5 * 60 * 60 * 1000) };
            fs.writeJsonSync(jailDataFile, jailList);
            spamTracker.delete(senderID);

            api.sendMessage(`🚨 **𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧**\n━━━━━━━━━━━━━━━\n👤 **Name:** ${name}\n🆔 **UID:** ${senderID}\n⚠ **Reason:** Command Spamming\n💸 **Fine:** ₱20M Debt\n⛓ **Sentence:** 5 Hours`, threadID);
            
            return api.sendMessage(`📢 **𝗛𝗤 𝗔𝗨𝗧𝗢-𝗥𝗘𝗣𝗢𝗥𝗧**\n👤 Prisoner: ${name}\n🆔 UID: ${senderID}\n⚠ Reason: Spammed >10 cmds in 15s.`, ADMIN_HQ);
        }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, type, messageReply, mentions, senderID } = event;
        const now = Date.now();

        // 📋 --- JAIL LIST ---
        if (args[0] === "list") {
            if (!fs.existsSync(jailDataFile)) return api.sendMessage("📁 No jail records found.", threadID);
            const jailList = fs.readJsonSync(jailDataFile);
            const uids = Object.keys(jailList);
            if (uids.length === 0) return api.sendMessage("🕊 The jail is currently empty.", threadID);

            let msg = "⛓ **𝗠𝗔𝗖𝗞𝗬 𝗣𝗥𝗜𝗦𝗢𝗡 𝗗𝗔𝗧𝗔𝗕𝗔𝗦𝗘**\n━━━━━━━━━━━━━━━━━━\n";
            for (const uid of uids) {
                const name = await usersData.getName(uid) || "Unknown User";
                const timeleft = jailList[uid].releaseAt - now;
                if (timeleft > 0) {
                    const hours = Math.floor(timeleft / (1000 * 60 * 60));
                    const mins = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
                    msg += `👤 **Name:** ${name}\n🆔 **UID:** ${uid}\n⏳ **Remaining:** ${hours}h ${mins}m\n\n`;
                } else {
                    delete jailList[uid];
                }
            }
            fs.writeJsonSync(jailDataFile, jailList);
            return api.sendMessage(msg + "━━━━━━━━━━━━━━━━━━", threadID);
        }

        // 🔓 --- UNJAIL (Master Only) ---
        if (args[0] === "release" || args[0] === "unjail") {
            if (senderID !== MASTER_UID) return api.sendMessage("❌ Only the Master can release prisoners.", threadID);
            let jailList = fs.existsSync(jailDataFile) ? fs.readJsonSync(jailDataFile) : {};
            if (args[1] === "all") {
                fs.writeJsonSync(jailDataFile, {});
                return api.sendMessage("🔓 **𝗠𝗔𝗖𝗞𝗬 𝗣𝗥𝗜𝗦𝗢𝗡 𝗘𝗠𝗣𝗧𝗜𝗘𝗗**\nAll prisoners released by the Master.", threadID);
            }
            let uid = type === "message_reply" ? messageReply.senderID : Object.keys(mentions)[0] || args[1];
            if (!uid) return api.sendMessage("⚠ Tag/Reply to release.", threadID);
            delete jailList[uid];
            fs.writeJsonSync(jailDataFile, jailList);
            return api.sendMessage(`🔓 UID ${uid} has been released.`, threadID);
        }

        // 🚨 --- MANUAL ARREST (Master Only) ---
        if (senderID !== MASTER_UID) return api.sendMessage("❌ You are not authorized.", threadID);

        let targetUID = type === "message_reply" ? messageReply.senderID : Object.keys(mentions)[0] || args[0];
        if (!targetUID) return api.sendMessage("⚠ Tag/Reply to arrest.", threadID);

        const fine = 20000000;
        const userData = await use
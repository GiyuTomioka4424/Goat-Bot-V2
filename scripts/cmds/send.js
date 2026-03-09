const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(__dirname, "cache", "bankData.json");
const PRISON_FILE = path.join(process.cwd(), "prisonData.json"); // PNP Prison File
const TRANSFER_TAX = 0.05; 

module.exports = {
    config: {
        name: "send",
        version: "1.1",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "economy",
        guide: { en: "{pn} [amount] [@mention / reply / UID]" }
    },

    onStart: async function ({ message, args, event, usersData }) {
        const { senderID, mentions, messageReply, type } = event;
        const now = Date.now();

        // --- 🚨 MACKY PNP RESTRICTION GUARD ---
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) {
                return message.reply(
                    `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
                    `   🚨 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗥𝗘𝗦𝗧𝗥𝗜𝗖𝗧𝗜𝗢𝗡\n` +
                    `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
                    `  ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗\n` +
                    `  ❯ 𝖱𝖾𝖺𝗌𝗈𝗇: 𝖠𝖼𝗍𝗂𝗏𝖾 𝖶𝖺𝗋𝗋𝖺𝗇𝗍\n` +
                    ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
                    ` ⚖️ 𝖡𝖺𝗇𝗄𝗂𝗇𝗀 𝗉𝗋𝗂𝗏𝗂𝗅𝖾𝗀𝖾𝗌 𝗌𝖾𝗂𝗓𝖾𝖽.`
                );
            }
        }

        // Ensure bank data exists
        if (!fs.existsSync(BANK_FILE)) fs.writeJsonSync(BANK_FILE, {});
        const bankData = fs.readJsonSync(BANK_FILE);

        // Initialize sender if not exists
        if (!bankData[senderID]) bankData[senderID] = { bank: 0, loan: 0 };
        const sender = bankData[senderID];

        // 1. Check for Active Loan Restriction
        if (sender.loan > 0) {
            return message.reply("⚠️ [SECURITY] Access Denied. You cannot transfer funds while you have an unpaid loan in Macky Bank.");
        }

        // 2. Identify Recipient and Amount
        let targetID;
        let amount = parseInt(args[0]);

        if (type === "message_reply") {
            targetID = messageReply.senderID;
        } else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            if (isNaN(amount)) amount = parseInt(args[1]);
        } else if (args[1] && !isNaN(args[1])) {
            targetID = args[1]; 
        }

        // 3. Validations
        if (!targetID || isNaN(amount) || amount <= 0) {
            return message.reply("❌ Usage: send [amount] [@mention / reply / UID]");
        }

        if (targetID === senderID) {
            return message.reply("😹 You can't send money to yourself!");
        }

        if (sender.bank < amount) {
            return message.reply(`❌ Insufficient Funds. Your bank balance is only $${sender.bank.toLocaleString()}.`);
        }

        // 4. Processing
        const tax = Math.floor(amount * TRANSFER_TAX);
        const netAmount = amount - tax;

        if (!bankData[targetID]) bankData[targetID] = { bank: 0, loan: 0 };

        sender.bank -= amount;
        bankData[targetID].bank += netAmount;

        fs.writeJsonSync(BANK_FILE, bankData);

        const targetName = await usersData.getName(targetID);

        // 5. Visual Design
        const msg = 
            `╔════════════════════╗\n` +
            `       🏦  𝗠𝗔𝗖𝗞𝗬 𝗕𝗔𝗡𝗞\n` +
            `╚════════════════════╝\n` +
            `  ➤ 𝖲𝗍𝖺𝗍𝗎𝗌: TRANSFER SUCCESS\n` +
            `────────────────────\n` +
            `👤 To: ${targetName}\n` +
            `🆔 ID: ${targetID}\n` +
            `💵 Sent: $${amount.toLocaleString()}\n` +
            `⚖️ Fee (5%): -$${tax.toLocaleString()}\n` +
            `🎁 Received: $${netAmount.toLocaleString()}\n` +
            `────────────────────\n` +
            ` ✅ Transaction Secured`;

        return message.reply(msg);
    }
};
const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(__dirname, "bankData.json");
const JAIL_FILE = path.join(process.cwd(), "jailData.json");

module.exports = {
    config: {
        name: "bank",
        version: "12.0",
        author: "Gab Yu",
        countDown: 2,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, args, event, usersData }) {
        const { senderID, mentions, messageReply } = event;
        
        // --- LOAD DATA ---
        if (!fs.existsSync(BANK_FILE)) fs.writeJsonSync(BANK_FILE, {});
        const bankData = fs.readJsonSync(BANK_FILE);

        // Ensure user exists using the correct keys from your old data
        if (!bankData[senderID]) bankData[senderID] = { bank: 0, loan: 0, lastLoanTime: 0 };
        const user = bankData[senderID];
        const userData = await usersData.get(senderID);
        const userMoney = userData.money || 0;

        const design = (title, body) => `▰▱▰▱▰▱▰▱▰▱▰▱▰▱\n  🏦 𝗠𝗔𝗖𝗞𝗬 ${title}\n▰▱▰▱▰▱▰▱▰▱▰▱▰▱\n${body}\n▰▱▰▱▰▱▰▱▰▱▰▱▰▱`;

        // 📈 AUTOMATIC INTEREST
        if (user.loan > 0) {
            const now = Date.now();
            if (now - (user.lastLoanTime || 0) >= 3600000) {
                user.loan += Math.floor(user.loan * 0.01);
                user.lastLoanTime = now;
                fs.writeJsonSync(BANK_FILE, bankData);
            }
        }

        const act = args[0]?.toLowerCase();
        const val = args[1];

        // --- 1. RICHEST ---
        if (act === "richest") {
            const topList = Object.keys(bankData)
                .map(id => ({ id, bank: bankData[id].bank || 0 }))
                .sort((a, b) => b.bank - a.bank)
                .slice(0, 10);

            let rankMsg = "";
            for (let i = 0; i < topList.length; i++) {
                const name = await usersData.getName(topList[i].id) || "Unknown User";
                rankMsg += `${i + 1}. ${name} - $${topList[i].bank.toLocaleString()}\n`;
            }
            return message.reply(design("𝗥𝗜𝗖𝗛𝗘𝗦𝗧", rankMsg || "Vault is empty."));
        }

        // --- 2. CHECK (UID/Mention/Reply) ---
        if (act === "check") {
            const target = messageReply ? messageReply.senderID : (Object.keys(mentions)[0] || val || senderID);
            const tName = await usersData.getName(target);
            const tBank = bankData[target] || { bank: 0, loan: 0 };
            return message.reply(design("𝗦𝗖𝗔𝗡𝗡𝗘𝗥", ` 👤 𝗧𝗮𝗿𝗴𝗲𝘁: ${tName}\n 🆔 𝗜𝗗: ${target}\n 💰 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: $${(tBank.bank || 0).toLocaleString()}\n 📉 𝗟𝗼𝗮𝗻: $${(tBank.loan || 0).toLocaleString()}`));
        }

        // --- 3. DEPOSIT ---
        if (act === "deposit" || act === "dep") {
            const amt = val === "all" ? userMoney : parseInt(val);
            if (!amt || amt <= 0 || userMoney < amt) return message.reply("❌ Invalid amount.");
            user.bank += amt;
            await usersData.set(senderID, { money: userMoney - amt });
            fs.writeJsonSync(BANK_FILE, bankData);
            return message.reply(`🔹 $${amt.toLocaleString()} moved to Vault.`);
        }

        // --- 4. WITHDRAW ---
        if (act === "withdraw" || act === "wd") {
            const amt = val === "all" ? user.bank : parseInt(val);
            if (!amt || amt <= 0 || user.bank < amt) return message.reply("❌ Insufficient vault funds.");
            user.bank -= amt;
            await usersData.set(senderID, { money: userMoney + amt });
            fs.writeJsonSync(BANK_FILE, bankData);
            return message.reply(`🔹 $${amt.toLocaleString()} withdrawn to Wallet.`);
        }

        // --- 5. LOAN & PAYLOAN ---
        if (act === "loan") {
            const amt = parseInt(val);
            if (!amt || amt <= 0 || amt > 50000 || user.loan > 0) return message.reply("❌ Denied. (Max $50k or pay existing debt)");
            user.loan = Math.floor(amt * 1.05); // Includes initial fee from your code
            user.lastLoanTime = Date.now();
            await usersData.set(senderID, { money: userMoney + amt });
            fs.writeJsonSync(BANK_FILE, bankData);
            return message.reply(`🔹 Loan of $${amt.toLocaleString()} approved.`);
        }

        if (act === "payloan" || act === "pay") {
            const totalDebt = (userMoney < 0 ? Math.abs(userMoney) : 0) + user.loan;
            if (totalDebt <= 0) return message.reply("⚖️ No debts found.");
            const amt = val === "all" ? Math.min(userMoney, totalDebt) : parseInt(val);
            if (!amt || amt <= 0 || userMoney < amt) return message.reply("❌ Payment failed.");

            user.loan -= amt;
            if (user.loan < 0) user.loan = 0; // Prevent negative debt
            await usersData.set(senderID, { money: userMoney - amt });
            fs.writeJsonSync(BANK_FILE, bankData);
            return message.reply(`🔹 Paid $${amt.toLocaleString()} towards debt.`);
    
const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(__dirname, "cache", "bankData.json");
const TAX_RATE = 0.10; // 10% Deposit Tax
const TRANSFER_TAX = 0.05; // 5% Transfer Tax

module.exports = {
    config: {
        name: "bank",
        version: "12.2",
        author: "Gab Yu",
        countDown: 2,
        role: 0,
        category: "economy",
        guide: { en: "{pn} [dep/wd/loan/pay/transfer/bal/richest]" }
    },

    onStart: async function ({ message, args, event, usersData }) {
        const { senderID, mentions, messageReply } = event;
        
        if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
        if (!fs.existsSync(BANK_FILE)) fs.writeJsonSync(BANK_FILE, {});
        
        const bankData = fs.readJsonSync(BANK_FILE);
        if (!bankData[senderID]) bankData[senderID] = { bank: 0, loan: 0, lastLoanTime: 0 };
        
        const user = bankData[senderID];
        const userData = await usersData.get(senderID);
        const userMoney = userData.money || 0;

        const design = (title, body) => 
            `╔════════════════════╗\n` +
            `    🏦  𝗠𝗔𝗖𝗞𝗬 𝗩𝗜𝗣 𝗕𝗔𝗡𝗞\n` +
            `╚════════════════════╝\n` +
            `  ➤ 𝖲𝗍𝖺𝗍𝗎𝗌: ${title}\n` +
            `────────────────────\n` +
            `${body}\n` +
            `────────────────────\n` +
            ` ⚖️ 𝖳𝖺𝗑𝖾𝗌 𝖺𝗋𝖾 𝖺𝗎𝗍𝗈-𝖽𝖾𝖽𝗎𝖼𝗍𝖾𝖽`;

        const act = args[0]?.toLowerCase();
        const val = args[1];

        // --- 1. BALANCE ---
        if (!act || act === "bal") {
            const msg = ` 👤 ${await usersData.getName(senderID)}\n 💵 Wallet: $${userMoney.toLocaleString()}\n 💳 Vault: $${user.bank.toLocaleString()}\n 📉 Debt: $${user.loan.toLocaleString()}`;
            return message.reply(design("ACCOUNT INFO", msg));
        }

        // --- 2. DEPOSIT (WITH TAX) ---
        if (act === "deposit" || act === "dep") {
            const amt = val === "all" ? userMoney : parseInt(val);
            if (!amt || amt <= 0 || userMoney < amt) return message.reply("❌ Invalid amount.");
            
            const tax = Math.floor(amt * TAX_RATE);
            const netAmount = amt - tax;

            user.bank += netAmount;
            await usersData.set(senderID, { money: userMoney - amt });
            fs.writeJsonSync(BANK_FILE, bankData);

            return message.reply(design("DEPOSIT RECEIPT", 
                `💰 Gross: $${amt.toLocaleString()}\n` +
                `⚖️ Tax (10%): -$${tax.toLocaleString()}\n` +
                `✅ Credited: $${netAmount.toLocaleString()}`));
        }

        // --- 3. TRANSFER (WITH TAX) ---
        if (act === "transfer" || act === "send") {
            if (user.loan > 0) return message.reply("⚠️ You cannot transfer funds while you have an unpaid loan.");
            
            const targetID = Object.keys(mentions)[0] || (messageReply ? messageReply.senderID : args[2]);
            const amt = parseInt(val);

            if (!targetID || isNaN(amt) || amt <= 0) return message.reply("❌ Usage: bank transfer [amount] [@mention]");
            if (user.bank < amt) return message.reply("❌ Insufficient Vault funds.");

            const tTax = Math.floor(amt * TRANSFER_TAX);
            const tNet = amt - tTax;

            if (!bankData[targetID]) bankData[targetID] = { bank: 0, loan: 0 };
            
            user.bank -= amt;
            bankData[targetID].bank += tNet;
            fs.writeJsonSync(BANK_FILE, bankData);
            
            return message.reply(design("TRANSFER SUCCESS", 
                `👤 To: ${await usersData.getName(targetID)}\n` +
                `💵 Sent: $${amt.toLocaleString()}\n` +
                `⚖️ Fee (5%): -$${tTax.toLocaleString()}\n` +
                `🎁 Received: $${tNet.toLocaleString()}`));
        }

        // --- 4. WITHDRAW (FREE) ---
        if (act === "withdraw" || act === "wd") {
            const amt = val === "all" ? user.bank : parseInt(val);
            if (!amt || amt <= 0 || user.bank < amt) return message.reply("❌ Insufficient vault funds.");
            user.bank -= amt;
            await usersData.set(senderID, { money: userMoney + amt });
            fs.writeJsonSync(BANK_FILE, bankData);
            return message.reply(design("WITHDRAWAL", `💸 $${amt.toLocaleString()} moved to Wallet.`));
        }

        // --- 5. LOAN & PAY ---
        if (act === "loan") {
            const amt = parseInt(val);
            if (!amt || amt <= 0 || amt > 50000 || user.loan > 0) return message.reply("❌ Max loan $50k and no existing debt allowed.");
            user.loan = Math.floor(amt * 1.05);
            user.lastLoanTime = Date.now();
            await usersData.set(senderID, { money: userMoney + amt });
            fs.writeJsonSync(BANK_FILE, bankData);
            return message.reply(design("LOAN ISSUED", `🏦 Borrowed: $${amt.toLocaleString()}\n🚫 Gamb
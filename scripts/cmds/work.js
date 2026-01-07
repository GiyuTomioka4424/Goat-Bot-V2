const fs = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "work",
        version: "4.1",
        author: "Gab Yu",
        countDown: 60,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, usersData, event }) {
        const { senderID } = event;
        const BANK_FILE = path.join(__dirname, "bankData.json");
        const JAIL_FILE = path.join(process.cwd(), "jailData.json");
        
        // Check if user is in Jail
        const jailList = fs.existsSync(JAIL_FILE) ? JSON.parse(fs.readFileSync(JAIL_FILE, "utf8")) : {};
        const isJailed = jailList[senderID] && Date.now() < jailList[senderID].releaseAt;

        // 💰 NERFED SALARIES
        const jobs = [
            { job: "𝖦𝗋𝖺𝖻 𝖣𝗋𝗂𝗏𝖾𝗋", salary: [500, 1500] },
            { job: "𝖢𝖺𝗅𝗅 𝖢𝖾𝗇𝗍𝖾𝗋 𝖠𝗀𝖾𝗇𝗍", salary: [1000, 2500] },
            { job: "𝖥𝗋𝖾𝖾𝗅𝖺𝗇𝖼𝖾 𝖣𝖾𝗌𝗂𝗀𝗇𝖾𝗋", salary: [1500, 3500] },
            { job: "𝖲𝗍𝗋𝖾𝖾𝗍 𝖵𝖾𝗇𝖽𝗈𝗋", salary: [200, 800] },
            { job: "𝖲𝗈𝖿𝗍𝗐𝖺𝗋𝖾 𝖣𝖾𝗏𝖾𝗅𝗈𝗉𝖾𝗋", salary: [3000, 6000] },
            { job: "𝖲𝖺𝖻𝗈𝗇𝗀 𝖱𝖾𝖿𝖾𝗋𝖾𝖾", salary: [1000, 2000] },
            { job: "𝗖𝘆𝗯𝗲𝗿 𝗦𝗲𝗰𝘂𝗿𝗶𝘁𝘆 𝗘𝗻𝗴𝗶𝗻𝗲𝗲𝗿", salary: [5000, 10000] }
        ];

        let jobTitle, earned;
        if (isJailed) {
            jobTitle = "⛓️ 𝗣𝗿𝗶𝘀𝗼𝗻 𝗟𝗮𝗯𝗼𝗿 (𝗖𝗮𝗻𝘁𝗲𝗲𝗻 𝗗𝘂𝘁𝘆)";
            earned = Math.floor(Math.random() * (1000 - 300 + 1)) + 300; // Lower pay in jail
        } else {
            const selectedJob = jobs[Math.floor(Math.random() * jobs.length)];
            jobTitle = selectedJob.job;
            earned = Math.floor(Math.random() * (selectedJob.salary[1] - selectedJob.salary[0] + 1)) + selectedJob.salary[0];
        }

        const originalSalary = earned;
        const userData = await usersData.get(senderID);
        let currentMoney = userData.money || 0;
        let debtNote = "";

        // 🏛️ AUTO-PAY BANK LOAN FIRST
        if (fs.existsSync(BANK_FILE)) {
            const bankData = JSON.parse(fs.readFileSync(BANK_FILE, "utf8"));
            if (bankData[senderID] && bankData[senderID].loan > 0) {
                const payment = Math.min(earned, bankData[senderID].loan);
                bankData[senderID].loan -= payment;
                earned -= payment; 
                
                fs.writeFileSync(BANK_FILE, JSON.stringify(bankData, null, 2), "utf8");
                debtNote += `\n\n🏛️ **𝗠𝗔𝗖𝗞𝗬 𝗕𝗔𝗡𝗞 𝗗𝗘𝗗𝗨𝗖𝗧𝗜𝗢𝗡**\n💸 Paid: -$${payment.toLocaleString()}\n📉 Remaining Loan: $${bankData[senderID].loan.toLocaleString()}`;
            }
        }

        // ⚖️ AUTO-PAY ARREST FINE (Negative Balance)
        if (earned > 0 && currentMoney < 0) {
            const debtAmount = Math.abs(currentMoney);
            const payment = Math.min(earned, debtAmount);
            earned -= payment;
            debtNote += `\n\n⚖️ **𝗔𝗥𝗥𝗘𝗦𝗧 𝗗𝗘𝗕𝗧 𝗣𝗔𝗬𝗠𝗘𝗡𝗧**\n💸 Siphoned: -$${payment.toLocaleString()}\n📉 Fine Left: $${(debtAmount - payment).toLocaleString()}`;
        }

        await usersData.set(senderID, { money: currentMoney + (originalSalary - (originalSalary - earned)) });

        return message.reply(
            `🛠️ 𝗪𝗢𝗥𝗞 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘𝗗 🛠️\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👤 𝗝𝗼𝗯: ${jobTitle}\n` +
            `💵 𝗦𝗮𝗹𝗮𝗿𝘆: $${earned.toLocaleString()} (Gross: $${originalSalary.toLocaleString()})\n` +
            `✨ Task finished successfully.${debtNote}`
        );
    }
};
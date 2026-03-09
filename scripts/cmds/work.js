const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(__dirname, "cache", "bankData.json");
const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const spamTracker = new Map();

module.exports = {
    config: {
        name: "work",
        version: "4.2",
        author: "Gab Yu",
        countDown: 60,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, usersData, event }) {
        const { senderID } = event;
        const now = Date.now();

        // --- 👮 AUTO-ARREST SPAM LOGIC ---
        const userSpam = spamTracker.get(senderID) || { count: 0, last: 0 };
        if (now - userSpam.last < 1500) {
            userSpam.count++;
            if (userSpam.count >= 3) {
                let prisonList = fs.existsSync(PRISON_FILE) ? fs.readJsonSync(PRISON_FILE) : {};
                const sentence = 2 * 60 * 60 * 1000; // 2 Hours
                const fine = 50000;

                prisonList[senderID] = { 
                    name: (await usersData.get(senderID)).name || "Worker",
                    releaseAt: now + sentence, 
                    reason: "Labor Fraud / System Spamming" 
                };
                fs.writeJsonSync(PRISON_FILE, prisonList);
                await usersData.set(senderID, { money: ((await usersData.get(senderID)).money || 0) - fine });
                spamTracker.delete(senderID);
                return message.reply(`🚨 **𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧**\n━━━━━━━━━━━━━━━\n⚠ **Reason:** Work Spamming\n💸 **Fine:** $${fine.toLocaleString()}\n⛓ **Sentence:** 2 Hours\n\n*PNP has flagged your labor logs as fraudulent.*`);
            }
        } else { userSpam.count = 0; }
        userSpam.last = now;
        spamTracker.set(senderID, userSpam);

        // --- ⛓️ PRISONER CHECK & LABOR SYSTEM ---
        let isJailed = false;
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) isJailed = true;
        }

        // 💰 JOB LIST
        const jobs = [
            { job: "Grab Driver", salary: [500, 1500] },
            { job: "Call Center Agent", salary: [1000, 2500] },
            { job: "Freelance Designer", salary: [1500, 3500] },
            { job: "Street Vendor", salary: [200, 800] },
            { job: "Software Developer", salary: [3000, 6000] },
            { job: "Sabong Referee", salary: [1000, 2000] },
            { job: "Cyber Security Engineer", salary: [5000, 10000] }
        ];

        let jobTitle, earned;
        if (isJailed) {
            jobTitle = "⛓️ **𝗣𝗥𝗜𝗦𝗢𝗡 𝗟𝗔𝗕𝗢𝗥 (𝗖𝗮𝗻𝘁𝗲𝗲𝗻 𝗗𝘂𝘁𝘆)**";
            earned = Math.floor(Math.random() * (500 - 100 + 1)) + 100; // Drastically lower pay
        } else {
            const selectedJob = jobs[Math.floor(Math.random() * jobs.length)];
            jobTitle = selectedJob.job;
            earned = Math.floor(Math.random() * (selectedJob.salary[1] - selectedJob.salary[0] + 1)) + selectedJob.salary[0];
        }

        const originalSalary = earned;
        const userData = await usersData.get(senderID);
        let currentMoney = userData.money || 0;
        let debtNote = "";

        // 🏛️ AUTO-PAY BANK LOAN
        if (fs.existsSync(BANK_FILE)) {
            const bankData = fs.readJsonSync(BANK_FILE);
            if (bankData[senderID] && bankData[senderID].loan > 0) {
                const payment = Math.min(earned, bankData[senderID].loan);
                bankData[senderID].loan -= payment;
                earned -= payment; 
                fs.writeJsonSync(BANK_FILE, bankData, { spaces: 2 });
                debtNote += `\n\n🏛️ **𝗠𝗔𝗖𝗞𝗬 𝗕𝗔𝗡𝗞 𝗗𝗘𝗗𝗨𝗖𝗧𝗜𝗢𝗡**\n💸 Paid: -$${payment.toLocaleString()}\n📉 Remaining Loan: $${bankData[senderID].loan.toLocaleString()}`;
            }
        }

        // ⚖️ AUTO-PAY ARREST FINES (Negative Balance)
        if (earned > 0 && currentMoney < 0) {
            const debtAmount = Math.abs(currentMoney);
            const payment = Math.min(earned, debtAmount);
            currentMoney += payment; // Fix: Increment negative balance toward zero
            earned -= payment;
            debtNote += `\n\n⚖️ **𝗔𝗥𝗥𝗘𝗦𝗧 𝗗𝗘𝗕𝗧 𝗣𝗔𝗬𝗠𝗘𝗡𝗧**\n💸 Siphoned: -$${payment.toLocaleString()}\n📉 Fine Left: $${Math.abs(currentMoney).toLocaleString()}`;
        }

        await usersData.set(senderID, { money: currentMoney + earned });

        return message.reply(
            `🛠️ **𝗪𝗢𝗥𝗞 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘𝗗** 🛠️\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👤 **𝗝𝗼𝗯:** ${jobTitle}\n` +
            `💵 **𝗦𝗮𝗹𝗮𝗿𝘆:** $${earned.toLocaleString()} (Gross: $${originalSalary.toLocaleString()})\n` +
            `✨ Task finished successfully.${debtNote}\n\n━━━━━━━━━━━━━━━━━━\n💡 *Note: Loans and fines are siphoned automatically.*`
        );
    }
};
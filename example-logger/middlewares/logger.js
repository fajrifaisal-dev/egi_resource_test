const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../logs/app.log");

module.exports = async function logger(req, res, next) {
    const start = process.hrtime();

    try {
        // Tunggu middleware/route berikutnya selesai
        await new Promise((resolve) => {
            res.on("finish", resolve);
            next();
        });
    } finally {
        const diff = process.hrtime(start);
        const durationMs = diff[0] * 1000 + diff[1] / 1e6;

        const logEntry = {
            service: "user-service",
            level: durationMs > 1000 ? "WARN" : "INFO", // lebih dari 1000ms → WARN
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: durationMs.toFixed(2),
        };

        // kirim ke console
        console.log(JSON.stringify(logEntry));

        // simpan ke file
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");

    }
};

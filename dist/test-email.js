"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const email_service_1 = require("./src/modules/notification/email.service");
(0, email_service_1.sendEmail)("ankiitsingh21@gmail.com", "SCN Jobs Test Email", "If you see this, SMTP is working.", "<h2>SMTP is working ✅</h2>")
    .then(() => {
    console.log("Email sent successfully");
    process.exit(0);
})
    .catch((err) => {
    console.error("Email failed:", err.message);
    process.exit(1);
});

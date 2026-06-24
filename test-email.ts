import "dotenv/config";
import { sendEmail } from "./src/modules/notification/email.service";

sendEmail(
  "ankiitsingh21@gmail.com",
  "SCN Jobs Test Email",
  "If you see this, SMTP is working.",
  "<h2>SMTP is working ✅</h2>",
)
  .then(() => {
    console.log("Email sent successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Email failed:", err.message);
    process.exit(1);
  });

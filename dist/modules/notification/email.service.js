"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = process.env.SMTP_HOST
    ? nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        // false = STARTTLS (recommended for Gmail port 587)
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })
    : null;
const sendEmail = async (to, subject, text, html) => {
    try {
        // Development mode
        if (!transporter) {
            console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${text}`);
            return;
        }
        await transporter.sendMail({
            from: `"SCN Jobs" <${process.env.SMTP_FROM}>`,
            to,
            subject,
            text,
            html,
        });
        console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    }
    catch (error) {
        console.error("[EMAIL ERROR]", error.message);
        throw new Error("Failed to send email");
    }
};
exports.sendEmail = sendEmail;
// import { Resend } from "resend";
// const resend = process.env.RESEND_API_KEY
//   ? new Resend(process.env.RESEND_API_KEY)
//   : null;
// export const sendEmail = async (
//   to: string,
//   subject: string,
//   text: string,
//   html?: string
// ) => {
//   if (!resend) {
//     console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${text}`);
//     return;
//   }
//   const { error } = await resend.emails.send({
//     from: "SCN Jobs <hrscnjob@gmail.com>", 
//     to,
//     subject,
//     text,
//     html,
//   });
//   if (error) {
//     console.error("[EMAIL ERROR]", error.message);
//     throw new Error(error.message);
//   }
//   console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
// };

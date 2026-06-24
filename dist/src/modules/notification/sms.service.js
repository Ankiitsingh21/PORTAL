"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = void 0;
const axios_1 = __importDefault(require("axios"));
const sendSms = async (phone, otp) => {
    try {
        // Development mode (without MSG91)
        if (!process.env.MSG91_API_KEY) {
            console.log(`[DEV SMS] To: ${phone} | OTP: ${otp}`);
            return;
        }
        const response = await axios_1.default.post("https://api.msg91.com/api/v5/flow/", {
            flow_id: process.env.MSG91_FLOW_ID,
            sender: process.env.MSG91_SENDER_ID,
            mobiles: `91${phone}`,
            otp: otp,
        }, {
            headers: {
                authkey: process.env.MSG91_API_KEY,
                "Content-Type": "application/json",
            },
        });
        console.log(`[SMS SENT] OTP sent to ${phone}`, response.data);
    }
    catch (error) {
        console.error("[SMS ERROR]", error.response?.data || error.message);
        throw new Error("Failed to send SMS");
    }
};
exports.sendSms = sendSms;

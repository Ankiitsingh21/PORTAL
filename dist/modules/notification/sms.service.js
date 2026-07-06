"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = void 0;
const axios_1 = __importDefault(require("axios"));
const sendSms = async (phone, otp) => {
    try {
        const options = {
            method: "POST",
            url: "https://control.msg91.com/api/v5/otp",
            params: {
                template_id: process.env.MSG91_TEMPLATE_ID,
                mobile: `91${phone}`,
                authkey: process.env.MSG91_API_KEY
            },
            headers: {
                "Content-Type": "application/json"
            },
            data: {
                OTP: otp
            }
        };
        const response = await axios_1.default.request(options);
        console.log("MSG91 RESPONSE:", response.data);
    }
    catch (error) {
        console.log("MSG91 ERROR:", error.response?.data || error.message);
    }
};
exports.sendSms = sendSms;

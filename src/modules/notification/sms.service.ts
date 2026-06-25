import axios from "axios";

export const sendSms = async (phone: string, otp: string) => {
  try {
    if (!process.env.MSG91_API_KEY) {
      console.log(`[DEV SMS] To: ${phone} | OTP: ${otp}`);
      return;
    }

    const response = await axios.get("https://api.msg91.com/api/v5/otp", {
      params: {
        authkey: process.env.MSG91_API_KEY,
        mobile: `91${phone}`,
        otp: otp,
        sender: process.env.MSG91_SENDER_ID,
        otp_template_id: process.env.MSG91_TEMPLATE_ID,
      },
    });

    console.log(`[SMS SENT] OTP sent to ${phone}`, response.data);
  } catch (error: any) {
    console.error("[SMS ERROR]", error.response?.data || error.message);
    throw new Error("Failed to send SMS");
  }
};
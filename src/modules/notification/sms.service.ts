import axios from "axios";

export const sendSms = async (
  phone: string,
  otp: string
) => {

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


    const response = await axios.request(options);


    console.log(
      "MSG91 RESPONSE:",
      response.data
    );


  } catch(error:any){

    console.log(
      "MSG91 ERROR:",
      error.response?.data || error.message
    );

  }

};
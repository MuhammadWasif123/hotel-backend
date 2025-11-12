import transporter from "../config/nodemailer.js";
import { ApiError } from "./ApiError.js";

export const sendOtpEmail = async (toEmail, otp) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: toEmail,
      subject: "Verify Your Email - OTP",
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Welcome to Hotel Booking!</h2>
          <p>Your OTP for email verification is:</p>
          <h3 style="color: #1e90ff;">${otp}</h3>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
        </div>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email send to ${toEmail}`)
  } catch (error) {
    console.error("Error sending OTP email: ",error);
    throw new ApiError("Failed to send verification email");
  }
};

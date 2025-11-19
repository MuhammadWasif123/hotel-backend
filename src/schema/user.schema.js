import * as yup from "yup";

const registerSchema = yup.object({
  userName: yup.string().required("User Name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be atleast 6 characters")
    .required("Password is required"),
  phone: yup
    .string()
    .matches(/^\d{11}$/, "Phone Number must be 11 digits")
    .required("Phone number is required"),
});

const loginSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be atleast 6 characters")
    .required("Password is required"),
});

const otpSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  otp: yup
    .string()
    .required("OTP is required"),
});

export { registerSchema,loginSchema,otpSchema };

import {Router} from "express"
import { registerUser,loginUser,logoutUser,refreshAcessToken,verifyEmailOtp,resendEmailOtp,forgotPassword,verifyResetOtp,resetPassword} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multure.middleware.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import { registerSchema,loginSchema,otpSchema} from "../schema/user.schema.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1
        }
    ]),
    validate(registerSchema),
    registerUser
)

router.route("/login").post(
    validate(loginSchema),
    loginUser
)

router.route("/refresh-token").post(refreshAcessToken)

router.route("/logout").post(
    verifyJWT,
    logoutUser
)

router.route("/verify-email-otp").post(validate(otpSchema),verifyEmailOtp)

router.route("/resend-email-otp").post(resendEmailOtp)

router.route("/forgot-password").post(forgotPassword)

router.route("/verify-reset-otp").post(verifyResetOtp)

router.route("/reset-password").post(resetPassword)

router.route("/change-password").post()


export default router;
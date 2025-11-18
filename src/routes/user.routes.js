import {Router} from "express"
import { registerUser,loginUser,logoutUser,refreshAcessToken,verifyEmailOtp,resendEmailOtp} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multure.middleware.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import { registerSchema,loginSchema} from "../schema/user.schema.js";
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

router.route("/verify-email-otp").post(verifyEmailOtp)

router.route("/resend-email-otp").post(resendEmailOtp)

export default router;
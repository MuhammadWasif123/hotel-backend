import { ValidationError } from "yup";

export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.body, { abortEarly: false });

    // If schema is valid then move towards next controller/middleware
    next();
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        errors: err.errors, // Yup returns all validation error messages
      });
    }

    // Unexpected error
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during validation",
    });
  }
};

import { body, param, query, validationResult } from "express-validator";
import { JOB_TYPES, EXPERIENCE_LEVELS, JOB_STATUSES } from "../models/job.model.js";
import { removeFile } from "../utils/files.js";

export const validate = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (req.file?.filename) await removeFile(req.file.filename);

    const list = errors.array({ onlyFirstError: true }).map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    return res.status(400).json({
      success: false,
      message: list[0].message,
      errors: list,
    });
  }

  next();
};

const emailRule = (field = "email") =>
  body(field)
    .isString()
    .withMessage("Please provide a valid email")
    .bail()
    .trim()
    .toLowerCase()
    .isLength({ max: 254 })
    .withMessage("Email is too long")
    .isEmail()
    .withMessage("Please provide a valid email");

const passwordRule = (field, label = "Password") =>
  body(field)
    .isString()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage(`${label} must be between 8 and 72 characters`)
    .matches(/[A-Za-z]/)
    .withMessage(`${label} must include at least one letter`)
    .matches(/\d/)
    .withMessage(`${label} must include at least one number`);

const tokenRule = body("token")
  .isString()
  .matches(/^[a-f0-9]{64}$/)
  .withMessage("This link is invalid or has expired");

const optionalText = (field, label, max) =>
  body(field)
    .optional({ values: "falsy" })
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .trim()
    .isLength({ max })
    .withMessage(`${label} cannot exceed ${max} characters`);

export const registerValidator = [
  body("name")
    .isString()
    .withMessage("Name is required")
    .bail()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),
  emailRule(),
  passwordRule("password"),
  body("role")
    .optional()
    .isIn(["candidate", "employer"])
    .withMessage("Role must be candidate or employer"),
  body("company")
    .if(body("role").equals("employer"))
    .isString()
    .withMessage("Company name is required for employers")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Company name is required for employers")
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),
];

export const loginValidator = [
  emailRule(),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidator = [emailRule()];

export const resetPasswordValidator = [tokenRule, passwordRule("password", "New password")];

export const verifyEmailValidator = [tokenRule];

export const changePasswordValidator = [
  body("oldPassword").isString().notEmpty().withMessage("Current password is required"),
  passwordRule("newPassword", "New password"),
];

export const updateProfileValidator = [
  body("name")
    .isString()
    .withMessage("Name is required")
    .bail()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),
  optionalText("company", "Company name", 100),
];

export const jobValidator = [
  body("title")
    .isString()
    .withMessage("Job title is required")
    .bail()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Job title must be between 3 and 100 characters"),
  optionalText("company", "Company name", 100),
  body("description")
    .isString()
    .withMessage("Description is required")
    .bail()
    .trim()
    .isLength({ min: 20, max: 8000 })
    .withMessage("Description must be between 20 and 8000 characters"),
  body("requirements")
    .isArray({ min: 1, max: 30 })
    .withMessage("Add between 1 and 30 requirements"),
  body("requirements.*")
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Each requirement must be between 1 and 200 characters"),
  body("skills").optional().isArray({ max: 30 }).withMessage("Skills must be a list of up to 30"),
  body("skills.*")
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each skill must be between 1 and 50 characters"),
  body("benefits")
    .optional()
    .isArray({ max: 30 })
    .withMessage("Benefits must be a list of up to 30"),
  body("benefits.*")
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Each benefit must be between 1 and 200 characters"),
  optionalText("location", "Location", 100),
  body("jobType").optional().isIn(JOB_TYPES).withMessage("Invalid job type"),
  body("experienceLevel")
    .optional()
    .isIn(EXPERIENCE_LEVELS)
    .withMessage("Invalid experience level"),
  body("status").optional().isIn(JOB_STATUSES).withMessage("Invalid job status"),
  body("deadline")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Invalid deadline"),
  body("salaryRange.min")
    .optional({ values: "null" })
    .isFloat({ min: 0, max: 1000000000 })
    .withMessage("Minimum salary must be a positive number"),
  body("salaryRange.max")
    .optional({ values: "null" })
    .isFloat({ min: 0, max: 1000000000 })
    .withMessage("Maximum salary must be a positive number")
    .bail()
    .custom((value, { req }) => {
      const min = req.body.salaryRange?.min;
      if (min !== undefined && min !== null && min !== "" && Number(value) < Number(min)) {
        throw new Error("Maximum salary cannot be lower than minimum salary");
      }
      return true;
    }),
  body("salaryRange.currency")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .toUpperCase()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code"),
  body("applicationUrl")
    .optional({ values: "falsy" })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Application URL must start with http:// or https://"),
  body("openings")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 10000 })
    .withMessage("Openings must be a whole number of at least 1"),
  optionalText("category", "Category", 50),
  body("isRemote").optional().isBoolean().withMessage("Remote must be true or false"),
];

export const idValidator = [param("id").isMongoId().withMessage("Invalid ID")];

export const jobIdValidator = [param("jobId").isMongoId().withMessage("Invalid Job ID")];

export const applicationApplyValidator = [
  body("coverLetter")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Cover letter must be text")
    .bail()
    .isLength({ max: 5000 })
    .withMessage("Cover letter must be 5000 characters or fewer"),
];

export const applicationStatusValidator = [
  body("status")
    .isString()
    .trim()
    .isIn(["Pending", "Accepted", "Rejected"])
    .withMessage("Invalid application status"),
];

export const roleValidator = [
  body("role")
    .isString()
    .isIn(["admin", "candidate", "employer"])
    .withMessage("Invalid role"),
];

export const listQueryValidator = [
  query("page").optional().isInt({ min: 1, max: 100000 }).withMessage("Invalid page"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Invalid limit"),
];

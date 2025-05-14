const Joi = require("joi");
const schema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().allow("").optional(),
  gender: Joi.string().valid("Male", "Female", "Prefer not to say").required(),
  nationality: Joi.string().min(2).max(100).required(),
  dateOfBirth: Joi.date().iso().required(),
});
module.exports = schema;

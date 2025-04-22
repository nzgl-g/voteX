const Joi = require("joi");

const schema = Joi.object({
  name: Joi.string().required(),

  type: Joi.string().valid("election", "poll", "tournament").required(),

  description: Joi.string().allow(null).optional(),

  createdBy: Joi.string().optional().allow(null),
  requestId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  results: Joi.any().optional().allow(null),

  voterList: Joi.array().items(Joi.string()),

  isApproved: Joi.boolean().default(false),

  status: Joi.string()
    .valid("InProgress", "Complete", "Rejected", "Pending", "Approved")
    .default("Approved"),

  startTime: Joi.date().default(Date.now),

  endTime: Joi.date().default(Date.now),

  available: Joi.boolean().default(false),

  hiddenAt: Joi.date().allow(null).optional(),

  visibleAt: Joi.date().allow(null).optional(),
  details: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
});

module.exports = schema;

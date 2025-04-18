import Joi from 'joi';

const sessionSchema = Joi.object({
  name: Joi.string().required(),

  type: Joi.string()
    .valid("election", "approval", "poll", "tournament", "ranked")
    .required(),

  description: Joi.string().allow(null).optional(),
  
  createdBy: Joi.string().optional().allow(null),
  requestId:Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  results: Joi.any().optional().allow(null),

  voterList: Joi.array().items(Joi.string()),

  isApproved: Joi.boolean().default(false),

  status: Joi.string()
    .valid("ongoing", "completed", "canceled", "scheduled")
    .default("scheduled"),

  startTime: Joi.date().default(Date.now),

  endTime: Joi.date().default(Date.now),

  available: Joi.boolean().default(false),

  hiddenAt: Joi.date().allow(null).optional()
});


export default sessionSchema;

const Joi = require("joi");
const schema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'team_leader', 'team_member', 'candidate', 'voter').default('voter'),
});
module.exports = schema;

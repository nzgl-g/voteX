const Joi = require('joi');

const schemas = {
    createSession: Joi.object({
        sessionId: Joi.string().required().min(1),
        choices: Joi.array().items(Joi.string()).min(1).required(),
        voteMode: Joi.number().valid(0, 1, 2).required() // 0: SINGLE, 1: MULTIPLE, 2: RANKED
    }),

    endSession: Joi.object({
        sessionId: Joi.string().required().min(1)
    }),

    castVote: Joi.object({
        sessionId: Joi.string().required().min(1),
        choiceIds: Joi.array().items(Joi.string()).min(1).required()
    }),

    castRankedVote: Joi.object({
        sessionId: Joi.string().required().min(1),
        rankedChoices: Joi.array().items(Joi.string()).min(1).required()
    })
};

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                details: error.details.map(detail => detail.message)
            });
        }
        next();
    };
};

module.exports = {
    schemas,
    validate
}; 
import express from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import sessionRequest from '../models/SessionRequest.js';
import IsAdmin from '../middleware/IsAdmin.js';
import Joi from 'joi';
const router = express.Router();
// be sure to change this into only team members can see requests when done with initial testing

router.get("/",IsAdmin,async(req,res)=>{
 const requests = await sessionRequest.find();
  if (!requests) {
    res.send("error");
  }
  res.send(requests);
});
router.post("/", auth, async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        organization: Joi.string(),
        banner: Joi.object({
            id: Joi.string(),
            url: Joi.string()
        }),
        sessionType: Joi.string().valid("election", "approval", "poll", "tournament", "ranked").required(),
        votingMode: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        preparationSchedule: Joi.date(),
        accessControl: Joi.string().valid("public", "private", "invite").default("public"),
        secretPhrase: Joi.string(),
        displayLiveResults: Joi.boolean().default(true),
        verificationMethod: Joi.string(),
        options: Joi.array().items(Joi.object({
            title: Joi.string(),
            description: Joi.string()
        })),
        candidates: Joi.array().items(Joi.object({
            name: Joi.string(),
            email: Joi.string().email()
        }))
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const request = await new sessionRequest({
        user: req.user._id,
        ...value
    });
    
    await request.save();
    res.send(request);
});
// might add a route for declining requests without using the creation route in sessions
// or make session creation logic here?
router.put("/approve",IsAdmin,async(req,res)=>{
  const requestId=new mongoose.Types.ObjectId(req.body.id);
  const request = await sessionRequest.findById(requestId);
  if (!request) {
    res.send("error");
  }
  if(request.status==="approved"){
    return res.send("session request already approved")
  }
  request.status="approved";
  await request.save();
  res.send(request)
})
export default router;
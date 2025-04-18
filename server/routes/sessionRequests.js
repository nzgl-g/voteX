import express from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import sessionRequest from '../models/SessionRequest.js';
import IsAdmin from '../middleware/IsAdmin.js';
const router = express.Router();
// be sure to change this into only team members can see requests when done with initial testing

router.get("/",IsAdmin,async(req,res)=>{
 const requests = await sessionRequest.find();
  if (!requests) {
    res.send("error");
  }
  res.send(requests);
});
router.post("/",auth,async(req,res)=>{
    
const request =await new sessionRequest({
    user:req.user,
});
await request.save()

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
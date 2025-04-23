import jwt from 'jsonwebtoken';

export default function(req, res, next){
    const token = req.header("authorization");
    if (!token) {
        return res.send("no token provided");
    }
    try {
        const decoded = jwt.verify(token, "hello");
        if(decoded.role!=="team_member"){
            return res.send("not allowed");

        }
        req.user = decoded;
        next();
    } catch (ex) {
        return res.send("invalid token");
    }
}
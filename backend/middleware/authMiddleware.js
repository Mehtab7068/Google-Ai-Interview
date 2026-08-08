// C:/Ai Interview/backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import User from '../models/User.js'

const protect = asyncHandler(async (req, res, next) => {
    let token;
    
    // Defensive Check: Read from either standard or uppercase property headers
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
            
            if (!req.user) {
                res.status(401);
                throw new Error('User not found');
            }
            return next(); // Always return to avoid running fallbacks accidentally
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error("Not authorised, token failed.");
        }
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorised , no token");
    }
})

export { protect };
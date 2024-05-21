const jwt = require('jsonwebtoken');
require('dotenv').config();


//generate token
const generateToken = (user) => {    

    const token = jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '1h'});
    return token;

};

//verify token

const verifyToken = (user) => {
    
    if (!user.token) {
        return res.status(401).json({message: "Access denied. No token provided"})
    }

    try {

        return jwt.verify(user.token, process.env.SECRET_KEY)

    }catch(err) {
        console.error({"message": err.message});
        return {message: "Invalid token"};
    }
};

module.exports = { generateToken, verifyToken };
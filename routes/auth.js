const express = require('express');
const router = express.Router();
const User = require('../schema/user.schema');
const bcrypt = require('bcrypt');
const jwt = require ('jsonwebtoken');
const saltRounds = 10;


router.get('/',(req,res) => {
    throw new Error('This is forced error');
    res.send('login page');
});

router.post('/register', async (req, res, next) => {
    try{
        const { name, email, password } = req.body;
    const userExists = await User.findOne({email});
    if (userExists){
        return res.status(400).send('User already exists');
    }
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    const user = new User({
        name,
        email,
        password:hash
    });
    await user.save();
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.json({
        email: user.email,
        token

    })
    }
    catch(e){
        next(e);
        }
    

});

router.post('/login', async (req,res) => {
    try{
        const { email, password } = req.body;
    const userExists = await User.findOne({email});
    if (!userExists){
        return res.status(400).send('email or password is wrong');
    }
    const validPass = bcrypt.compareSync(password, userExists.password);
    if (!validPass){
        return res.status(400).send('email or password is wrong');
    }
    const token = jwt.sign({_id: userExists._id}, process.env.TOKEN_SECRET);
    res.json({
        email: userExists.email,
        token
        })
    }
    catch(e){
        throw new Error(e.message);
        }
    

});

router.post('/updatePassword', async (req,res) => {
    try{
        const { email, password, newPassword } = req.body;
        const token = req.headers['authorization'];
        const userExists = await User.findOne({email});
        if(!userExists){
            return res.status(400).send('email or password is wrong');
        }
        const validPass = bcrypt.compareSync(password, userExists.password);
        if (!validPass){
            return res.status(400).send('email or password is wrong');
            }
            const verifiedToken = jwt.verify(token , process.env.TOKEN_SECRET);
            const userId = userExists._id.toString();
            if(verifiedToken._id !== userId){
                return res.status(401).send('Unauthorised');
            }
            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(newPassword, salt);
            await User.findOneAndUpdate({email: userExists.email}, {password : hash});
            res.json({message: 'Password updated successfully'});
            }
            catch(e){
                throw new Error(e.message);
                }
})







module.exports = router;
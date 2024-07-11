const express = require('express');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const port = process.env.PORT || 3000;

const app = express();
const secret=process.env.S;


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//verify token
app.use((req, res, next) => {
    const token = req.cookies.token || '';
    if (token) {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                res.clearCookie('token');
            }
        });
    }
    next();
});


 
const models = require('./models/user');

const UserModel = models.User;
const Userdata = models.Userdata;

app.get('/', (req, res) => {
    const token = req.cookies.token || '';

    res.render('home', { token });
});
app.get('/nd',async (req, res) => {
    const token = req.cookies.token || '';
    const decoded = jwt.verify(token, secret);
    const user = await UserModel.findById(decoded.id);
    const userdata = await Userdata.findOne({ userid: decoded.id });
    const leetcode = userdata.leetcode;

    res.render('newdashboard', { token ,username:leetcode,userdata});
});
app.get('/profile/shared/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const profileResponse = await axios.get(`https://alfa-leetcode-api.onrender.com/${username}`);
        const profileData = profileResponse.data;
        res.render('profile', { profileData });
    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/create', (req, res) => {
    const token = req.cookies.token || '';
    res.render('index', { token });
});



app.post('/create', async (req, res) => {
    let { username, email, password,codeforces,leetcode,github } = req.body;
    password = await bcrypt.hash(password, 8);
    let createdUser = await UserModel.create({ username, email, password });

    let createdUserdata = await models.Userdata.create({ userid: createdUser._id, codeforces,leetcode,github });
    console.log(createdUserdata);
    const token = jwt.sign({ id: createdUser._id }, secret, { expiresIn: '1h' });
    res.cookie('token', token);
    res.redirect(`/profile/${token}`);
});

app.get('/login', (req, res) => {
    const token = req.cookies.token || '';
    res.render('login', { token });
});

app.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        let user = await UserModel.findOne({ email });

        if (user) {
            let isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });
                res.cookie('token', token);
                res.redirect(`/profile/${token}`);
            } else {
                res.status(401).render('login', { error: 'Invalid email or password', token: '' });
            }
        } else {
            res.status(401).render('login', { error: 'Invalid email or password', token: '' });
        }
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

app.get('/profile/:token', async (req, res) => {
    const token = req.params.token;

    try {
        const decoded = jwt.verify(token, secret);
        const user = await UserModel.findById(decoded.id);
        const userdata = await Userdata.findOne({ userid: decoded.id });

        if (!userdata) {
            return res.status(404).send('Userdata not found');
        }

        res.render('userprofile', { user, userdata, token });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.send('login session expired , go to login page to login again');
    }
});

app.get('/dashboard/:token', async (req, res) => {
    const token = req.params.token;

    try {
        const decoded = jwt.verify(token, secret);
        const user = await UserModel.findById(decoded.id);
        const userdata = await Userdata.findOne({ userid: decoded.id });

        if (!userdata) {
            return res.status(404).send('Userdata not found');
        }

        res.render('dashboard',{user,userdata,token});
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.send('login session expired , go to login page to login again');
    }
});



app.get('/logout', (req, res) => {
    res.cookie('token', '', { expires: new Date(0) });
    res.redirect('/');
});

app.post('/update-leetcode', async (req, res) => {
    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, secret);
        const userId = decoded.id;
        const newLeetcode = req.body.leetcode;

        let updated = await Userdata.findOneAndUpdate({ userid: userId }, { leetcode: newLeetcode }, { new: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating LeetCode username:', error);
        res.json({ success: false, message: 'Error updating LeetCode username' });
    }
});

app.post('/update-codeforces', async (req, res) => {
    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, secret);
        const userId = decoded.id;
        const newCodeforces = req.body.codeforces;

        let updated = await Userdata.findOneAndUpdate({ userid: userId }, { codeforces: newCodeforces }, { new: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating Codeforces username:', error);
        res.json({ success: false, message: 'Error updating Codeforces username' });
    }
});
app.post('/update-github', async (req, res) => {
    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, secret);
        const userId = decoded.id;
        const newGithub = req.body.github;

        let updated = await Userdata.findOneAndUpdate({ userid: userId }, { github: newGithub }, { new: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating Github username:', error);
        res.json({ success: false, message: 'Error updating Github username' });
    }
});


app.listen(port, () => {
    console.log(`Server is running at ${port}`); 
});

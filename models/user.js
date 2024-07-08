const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/authenticationapp')
    .then(() => console.log('Database connected successfully'))
    .catch(err => console.log('Database connection error: ', err));


const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const admin = mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const userdata = mongoose.Schema({
    userid: { type: String, required: true },
    leetcode: { type: String, default: '' },
    codeforces: { type: String, default: '' },
    github: { type: String, default: '' },
});
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', admin);
const Userdata = mongoose.model('Userdata', userdata);
module.exports = {
    User: User,
    Admin: Admin,
    Userdata: Userdata
};


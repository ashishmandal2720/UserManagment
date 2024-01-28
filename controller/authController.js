const User = require('../models/user');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ashishtest40@gmail.com',
        pass: 'ybrhhcukibqxrgch'
    }
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

const registerUserData = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({ error: 'Invalid mobile number' });
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({ error: 'Mobile number already in use' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = jwt.sign({ email }, "apple", { expiresIn: '1d' });

        const otp = generateOTP();

        const newUser = new User({
            name,
            email,
            mobile,
            password: hashedPassword,
            verificationToken,
            otp
        });

        await newUser.save();

        const verificationLink = `${req.protocol}://${req.get('host')}/user/verify-email?token=${verificationToken}`;
        const mailOptions = {
            to: email,
            subject: 'Email Verification',
            html: `Click <a href="${verificationLink}">here</a> to verify your email.`
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: 'User registered successfully. Please check your email for verification.' });
        console.log("Your OTP is: " + otp);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ error: 'Verification token is missing' });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, "apple");
        } catch (error) {
            console.error(error);
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'User is already verified' });
        }

        user.isVerified = true;
        await user.save();

        res.status(200).json({ message: 'Email verification successful. You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const signin = async (req, res) => {
    try {
        const { mobile, password } = req.body;
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({ error: 'Invalid mobile number' });
        }
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(401).json({ error: 'Invalid mobile number or password' });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid mobile number or password' });
        }
        if (!user.isVerified) {
            return res.status(401).json({ error: 'User is not verified. Please check your email for verification.' });
        }
        const token = jwt.sign({ userId: user._id }, "apple", { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const verifyMobileOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.otp !== otp) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }
        user.isMobileVerified = true;
        await user.save();

        res.status(200).json({ message: 'OTP verification successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const uploadImage = async (req, res) => {
    const userId = req.body._id;
    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).send('Invalid User');
        }
        const file = req.file;
        if (!file) {
            return res.status(400).send('No image in the request');
        }
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        user.image = `${basePath}${fileName}`;
        const updatedUser = await user.save();

        if (!updatedUser) {
            return res.status(500).send('The user cannot be updated');
        }
        res.send(updatedUser);
    } catch (error) {
        console.error('Error updating user image:', error);
        res.status(500).send('Internal Server Error');
    }
};

const downloadImage = async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('image not found');
      }
      res.send(user.image);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };

module.exports = {
    registerUserData,
    verifyEmail,
    signin,
    verifyMobileOTP,
    uploadImage,
    downloadImage
}


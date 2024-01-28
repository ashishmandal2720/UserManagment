const router = require('express').Router();
const uploadOptions = require("../middleware/uploads")

const {
    registerUserData,
    verifyEmail,
    signin,
    verifyMobileOTP,
    uploadImage,
    downloadImage
} = require('../controller/authController');


router.post("/register", registerUserData)
router.post("/verify-email", verifyEmail)
router.post("/signin", signin);
router.post("/verifyOTP", verifyMobileOTP);
router.post('/image', uploadOptions.single('image'), uploadImage);
router.get('/image/:id', downloadImage)
    

module.exports = router;
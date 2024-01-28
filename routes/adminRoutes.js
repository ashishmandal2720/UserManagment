const router = require('express').Router();
const verifyToken = require("../middleware/auth")

const {
    getAllRecords,

} = require('../controller/adminController');


router.get("/allRecords", verifyToken, getAllRecords);

module.exports = router;
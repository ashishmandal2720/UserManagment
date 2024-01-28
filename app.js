require("./config/config").connect();

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(express.static(__dirname + '/public'));

app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

const authRoutes = require('./routes/authRoutes')
app.use('/user', authRoutes);

const adminRoutes = require('./routes/adminRoutes')
app.use('/admin', adminRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
module.exports = app;
const express = require('express');
const cors = require('cors');
const route = require('./route.js/extract');
require('dotenv').config();




const PORT=process.env.ENV_PORT||5005;
const app=express();
app.use(cors({
    origin: process.env.FRONTEND_URL || "*"
}));
app.use(express.json());

app.use('/api',route);

app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`);
})


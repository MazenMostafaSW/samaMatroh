const mongoose = require ('mongoose')
const dbConection = _=>{
    mongoose.connect(process.env.db_URI)
    .then ( (conn) =>{
        console.log(`database connected :${conn.connection.host}`);
    })

};

module.exports = dbConection;
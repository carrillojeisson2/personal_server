const mongoose = require('mongoose');
const app  = require('./app');
const port = process.env.PORT || 3977;
const {API_VERSION, IP_SERVER, PORT_DB} = require('./config');


// mongoose.set("useFindAndModify", false);

mongoose.connect(
    `mongodb://${IP_SERVER}:${PORT_DB}/alana`,
    // {useNewUrlParser: true, useUnifiedTopology: true},
    (err, res) => {
        if(err) {
            throw err;
        }else{
            console.log("La conexion a la base de datos es correcta");

            app.listen(port, () => {
                console.log('api ok...');
                console.log(`http://${IP_SERVER}:${port}/api/${API_VERSION}/ `)
            })
        }
    }
)
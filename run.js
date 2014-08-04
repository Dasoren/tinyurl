var fs = require('fs.extra');
fs.exists('./config.js', function (exists) {
    if (exists) { 
        require('./server');
    } else { 
        fs.copy('./config.js.sample', './config.js', function (err) {
            if (err) { throw err; }
            console.log("made the config.js file.");
            require('./server');
        });
    }
});
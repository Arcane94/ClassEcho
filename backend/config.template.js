var config = {
    database: {
        host: 'localhost', //Host location
        user: 'root', //User
        password: '', //MySQL password
        port: 3306, //DB Port
        db: 'snapclass-observer' //Not sure about this
    },
    server: {
    port: '3011' //Port server will run on
    },
    email: {
        service: 'gmail', // SMTP service (e.g. gmail)
        host: '', // Optional SMTP host (leave empty to use service)
        port: 587, // SMTP port
        secure: false, // true for 465, false for other ports
        user: '', // Sender email address
        appPassword: '', // App password from email provider
        from: '' // Optional from address (defaults to user)
    },
    
    
    
    }
    
    
    
    module.exports = config
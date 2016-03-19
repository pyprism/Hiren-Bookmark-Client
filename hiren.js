/**
 * Created by prism on 3/7/16.
 */
var express = require('express'),
    jwt = require('jsonwebtoken'),
    mongoose = require('mongoose');

try {
    var config = require('./config.local.json');
} catch(e) {
    config = require('./config.json');
}

var db = mongoose.connection;
mongoose.connect(config.db_string);
db.on('error', console.error.bind(console, 'connection error:'));

var Account = require('./models/Account')(mongoose);
var Tags = require('./models/tag')(mongoose);
var Urls = require('./models/Url')(mongoose);
var auth = require('./routes/auth')(Account, config);
var tags = require('./routes/tags')(Tags, Urls);
var port = process.env.PORT || 3000;

//ensure authentication in every request
function ensureAuthenticated(req, res, next) {
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];
    if(token) {
        jwt.verify(token, config.secret, function(err, decoded) {          
            if (err) {
                return res.status(403).send({ error: "token not valid"});     
            } else {
                // if everything is good, save to request for use in other routes
               // req.decoded = decoded;
                next();
            }
        });
    }
    return res.status(403).send({ error: "token required"});     

}

express()
    .enable('trust proxy')
    .set('view engine', 'ejs')
    .use(require('morgan')('dev'))
    .use(require('helmet')())
    .use(express.static('./public'))
    .use(require('body-parser').urlencoded({extended: true}))
    .use(require('body-parser').json())
    //.use(require('cookie-parser')())
    .use(require('serve-favicon')(__dirname + '/public/favicon.ico'))
    //.use(require('express-session')({
   //     resave: false,
   //     saveUninitialized: true,
  //      secret: config.secret
  //  }))
    .use('/auth', auth)
    .use('/tags', tags)
    .get('*', function (req, res) {
        res.render('index');
    })
    .listen(port, function(){
        console.log('Bunny is running on port: ' + port);
    });
/* var express = require('express');
var router = express.Router(); */

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/User");
const Chat = require("../models/Chat");
var AdminUser = require("../models/AdminUser");
var Book = require("../models/Book");
var Usercontroller = require("../controllers/Usercontroller");
var CarModelController = require("../controllers/CarModelController");
var LanguageController = require("../controllers/LanguageController");
var OfferController = require("../controllers/OfferController");
var CmsPageController = require("../controllers/CmsPageController");
const TextSettingController = require("../controllers/TextSettingController");
const FCM = require('fcm-push');

let serverkey = ''

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Express RESTful API');
});

/* users routing */
router.use('/user',Usercontroller); 
router.use('/car-model',CarModelController); 
router.use('/language',LanguageController); 
router.use('/offer',OfferController); 
router.use('/cms-pages',CmsPageController); 
router.use('/text-setting',TextSettingController); 
/* users routing */

router.post('/signup', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Please pass username and password.'});
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password,
      message_type : "",
      status : "",
      lastmessage : "",
      carrier_type : "",
      fcm_token:null,


    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        console.log(err);
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});
 
router.get('/user-data/:id', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  var user_id = req.param('id');
  if (token) {
    AdminUser.find({
      _id:user_id
    },function (err, data) {
      if (err) return next(err);
      res.json(data);
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});

router.post('/signin', function(req, res) {
  User.findOne({
    username: req.body.username,
    // user_role_id: 1
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.sign(user.toJSON(), config.secret); 
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token,user:user});
        } else {
          res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

router.post('/book', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    console.log(req.body);
    var newBook = new Book({
      isbn: req.body.isbn,
      title: req.body.title,
      author: req.body.author,
      publisher: req.body.publisher
    });

    newBook.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Save book failed.'});
      }
      res.json({success: true, msg: 'Successful created new book.'});
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});

router.get('/book', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    Book.find(function (err, books) {
      if (err) return next(err);
      res.json(books);
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

function AuthenticateWithToken(headers, cb) {
  return cb(null);
  // if (headers && headers.authorization) {
  //   const token = headers.authorization.split(' ');
  //   console.log(token);
  //   if (token.length === 2) {
  //     User.findOne({token: token[1]}, function (err, user) {
  //       if (!user) cb('No Authorized.');
  //       else cb(null);
  //     })
  //   } else {
  //     cb('No Authorized.');
  //   }
  // } else {
  //   cb('No Authorized.');
  // }
}


router.post('/UpDateToken', function(req, res) {
  console.log('here');
  AuthenticateWithToken(req.headers, function(error) {
    if (error) return res.status(403).send({success: false, msg: 'Unauthorized.'});
    let id = req.body.user_id;
    let fcm_token = req.body.fcmtoken;
    console.log(id);

    Chat.find({receiverid: id, seen: 'sent'}, function (err, chats) {
      console.log(err);
      for (let i = 0; i < chats.length; i ++) {
        let chat = chats[i];
        chat.seen = 'MessageDelivered';
        chat.save();
      }
    });

    User.findOne({_id: id}, function(err, user) {
      if (user) {
        console.log(user);
        user.fcm_token = fcm_token;
        user.save(function (error, result) {
          if (!error) return res.status(200).send({success: true, msg: 'Updated FCM Token.' + result.fcm_token});
          else return res.status(303).send({success: false, msg: 'Fail to update token'});
        });

      }
      else return res.status(403).send({success: false, msg: 'Unauthorized.'});
    });
  });

});


router.post('/GetAllDrivers', function(req, res) {
  const token = getToken(req.headers);
  const user_id = req.body.user_id;
  if (token) {
    User.findOne({_id: user_id}, function(err, user) {
      if (user) {
        User.find({user_role_id: 3}, function (e, r) {
          if (e) {
            return res.status(401).send({success: false, msg: 'Failed'});
          } else {
            res.json(r);
          }
        })
      }
      else return res.status(403).send({success: false, msg: 'Unauthorized.'});
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});



router.post('/GetAllClients', function(req, res) {
  const token = getToken(req.headers);
  const user_id = req.body.user_id;
  if (token) {
    User.findOne({_id: user_id}, function(err, user) {
      if (user) {
        User.find({user_role_id: 2}, function (e, r) {
          if (e) {
            return res.status(401).send({success: false, msg: 'Failed'});
          } else {
            res.json(r);
          }
        })
      }
      else return res.status(403).send({success: false, msg: 'Unauthorized.'});
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});


router.post('/SendMessage', function(req, res) {
  AuthenticateWithToken(req.headers, function(error) {
    if (error) return res.status(403).send({success: false, msg: 'Unauthorized.'});
    let sender_id = req.body.sender_id;
    let receiver_id = req.body.receiver_id;
    let sender_token = req.body.sender_token;
    let receiver_token = req.body.receiver_token;
    let message = req.body.message;
    let title = req.body.title;
    let usertype = req.body.usertype;

    var newChat = new Chat({
      senderid: sender_id,
      receiverid: receiver_id,
      sender_token: sender_token,
      receiver_token: receiver_token,
      message_type: title,
      seen: 'sent'
    });
    if (title === 'pic') newChat.pic = text;
    else if (title === 'voice') newChat.voice = text;
    else newChat.message = message;

    newChat.save(function(err, chat) {
      if (err) {
        console.log(err);
        return res.json({success: false, msg: 'Can not save message'});
      }
      User.findOne({_id: sender_id}, function(e, r) {
        if (!r) return res.json({success: false, msg: 'Can not save message'});
        r.carrier_type = usertype;
        r.message_type = title;
        r.status = 'sent';
        r.lastmessage = message;
        r.save(function (er, re) {
          if (!re) res.json({success: false, msg: 'Can not save message'});
          res.json({success: true, msg: 'Success.'});
          sendFCMNotification(receiver_token, '');
        })
      });
    });

  });

});



router.post('/GetIndividualChatSeen', function(req, res) {
  AuthenticateWithToken(req.headers, function(error) {
    if (error) return res.status(403).send({success: false, msg: 'Unauthorized.'});
    let sender_id = req.body.sender_id;
    let receiver_id = req.body.receiver_id;

    Chat.find( {$or: [{senderid: sender_id, receiverid: receiver_id, $or: [{seen: 'sent'}, {seen: 'MessageDeliverd'}]},
        {receiverid: sender_id, senderid: receiver_id, $or: [{seen: 'sent'}, {seen: 'MessageDeliverd'}]}]},
      function (err, chats) {
        if (err) return res.status(400).send({success: false, msg: 'Failed.'});
        for (let i = 0; i < chats.length; i ++) {
          let chat = chats[i];
          chat.seen = 'MessageSeen';
          chat.save();
        }
        return res.status(200).send({success: true, msg: 'Success.'});
    })
  });

});


router.post('/GetIndividualChatAckSeen', function(req, res) {
  AuthenticateWithToken(req.headers, function(error) {
    if (error) return res.status(403).send({success: false, msg: 'Unauthorized.'});
    let sender_id = req.body.sender_id;
    let receiver_id = req.body.receiver_id;
    let sender_token = req.body.sender_token;
    let receiver_token = req.body.receiver_token;
    let text = req.body.text;
    let title = req.body.title;
    let usertype = req.body.usertype;

    Chat.findOne({ senderid: sender_id, receiverid: receiver_id, message_type: title, }, function (err, chat) {
      if (chat) return res.status(200).send({success: true, msg: 'Found'});
      return res.status(400).send({success: false, msg: 'Not Found'});
    });
    sendFCMNotification(receiver_token, '');
  });

});


sendFCMNotification = function (receiver_token, msg) {
  let fcm = new FCM(serverkey);
  var message = {
    to : receiver_token,
    data : {
      notification_type : 'Chat_Status',
      title : "Chatting Status",
      body : msg
    },
    notification : {
      title : "Chatting Status",
      body : msg
    }
  };
  fcm.send(message, function(err,response){
  });
};

module.exports = router;


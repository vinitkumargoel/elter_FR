const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const randToken = require('rand-token');

var UserSchema = new Schema({
  username: {
        type: String,
        unique: true,
        required: false
    },
  password: {
        type: String,
        required: false
    },
  token: {
    type: String,
    required: false,
  },
  type:{
    type: String,
    required: false,
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  lastmessage:{
    type: String,
    required: false,
  },
  status:{
    type: String,
    required: false,
  },
  message_type:{
    type: String,
    required: false,
  },
  carrier_type:{
    type: String,
    required: false,
  },
  fcm_token: {
    type: String,
    required: false
  },
  user_role_id: {
    type: String,
    default: 0,
  },
  seen:{
    type: String,
    default:false
  }
},{
    collection: 'users'
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isNew) {
      user.token = randToken.generate(64);
    }
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', UserSchema);

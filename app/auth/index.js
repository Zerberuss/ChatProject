'use strict';
var config           = require('../config');
var passport         = require('passport');
var logger           = require('../logger');
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var InstagramStrategy  = require('passport-instagram').Strategy;
var User             = require('../models/user');
var mysql            = require('mysql');

/**
 * Encapsulates all code for authentication
 * Either by using username and password, or by using social accounts
 *
 */
var init = function() {
    // Serialize and Deserialize user instances to and from the session.
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    // Plug-in Local Strategy
    passport.use(new LocalStrategy(function(username, password, done) {
        User.findOne({
            username: new RegExp(username, 'i'),
            socialId: null
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: 'Falsche Email oder Passwort.'
                });
            }
            user.validatePassword(password, function(err, isMatch) {
                if (err) {
                    return done(err);
                }
                if (!isMatch) {
                    return done(null, false, {
                        message: 'Falsche Email oder Passwort.'
                    });
                }
                return done(null, user);
            });
        });
    }));
    // In case of Facebook or Insta, tokenA is the access token, while tokenB is the refersh token.
    // In case of Twitter, tokenA is the token, whilet tokenB is the tokenSecret.
    var verifySocialAccount = function(tokenA, tokenB, data, done) {
        User.findOrCreate(data, function(err, user) {
            if (err) {
                return done(err);
            }
            return done(err, user);
        });
    };
    // Plug-in Facebook, Twitter adn Insta Strategies
    passport.use(new FacebookStrategy(config.facebook, verifySocialAccount));
    passport.use(new TwitterStrategy(config.twitter, verifySocialAccount));
    passport.use(new InstagramStrategy(config.instagram, verifySocialAccount));
    return passport;
}
module.exports = init();

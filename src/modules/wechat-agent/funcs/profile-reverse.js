var webdriver = require('selenium-webdriver')
var profileHelper = require('./read-profile');
var findOneContact = require('./find-one-contact');
var reset = require('./reset-pointer');
var searchLocator = webdriver.By.className('frm_search');
module.exports = function(nickname, callback){
    var data = {};
    var self = this;
    var driver = self.driver;
    driver.call(findOneAsync, self)
        .then(function(){
            driver.call(profileHelper.openPanel, self)
                .then(function(){
                    console.info('[flow]: read profile, the profile panel is opened');
                    return driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to open panel');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.readPlace, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read place');
                    return driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read place');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.readSex, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read Sex');
                    return driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read Sex');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.readNickname, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read Nickname');
                    return driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read Nickname');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.reverse, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to reverse');
                    return driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to reverse');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.readHeadImg, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read Head Img');
                    driver.sleep(2000);
                    driver.call(callback, self, null);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read Head Img');
                    return webdriver.promise.rejected(e);
                });
        })
        .thenCatch(function(err){
            console.warn(e);
            driver.call(reset, self);
            driver.call(callback, self, err);
        })
};
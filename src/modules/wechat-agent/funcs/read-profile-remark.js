var webdriver = require('selenium-webdriver')
var profileHelper = require('./read-profile');
var findOneContactUnStrict = require('./find-one-contact-unstrict');
var reset = require('./reset-pointer');

module.exports = function(contact, callback){
    var data = {};
    var self = this;
    var driver = self.driver;
    data.remark = contact.remark ? contact.remark : contact.nickname;
    data.headimgid = contact.headimgid;
    driver.call(findOneContactUnStrict, self, contact.nickname)
        .then(function(){
            driver.call(profileHelper.openPanel, self)
                .then(function(){
                    console.info('[flow]: read profile and remark, the profile panel is opened');
                    return driver.sleep(200);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile and remark, Failed to open panel');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.readPlace, self, data)
                .then(function(){
                    console.info('[flow]: read profile and remark, Succeed to read place');
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile and remark, Failed to read place');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.readSex, self, data)
                .then(function(){
                    console.info('[flow]: read profile and remark, Succeed to read Sex');
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile and remark, Failed to read Sex');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.readNickname, self, data)
                .then(function(){
                    console.info('[flow]: read profile and remark, Succeed to read Nickname');
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile and remark, Failed to read Nickname');
                    return webdriver.promise.rejected(e);
                });
            driver.call(profileHelper.remark, self, data)
                .then(function(){
                    console.info('[flow]: read profile and remark, Succeed to remark');
                    driver.sleep(200);
                    driver.call(reset, self);
                    return driver.call(callback, self, null, data);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile and remark, Failed to remark');
                    return webdriver.promise.rejected(e);
                });

        })
        .thenCatch(function(err){
            console.warn(err);
            driver.call(reset, self);
            driver.call(callback, self, err);
        });

};
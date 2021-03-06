var webdriver = require('selenium-webdriver');
var urlCore = require('url');
var qs = require('querystring');
var reset = require('./reset-pointer');
var request = require('request');
var closeLocator = webdriver.By.css('div.ngdialog-close');
var extractNickname = require('../../util/extractNickname');
var MYERROR = require('../settings/myerror');
var settings = require('../../../app/settings');
var fsServer = settings.fsUrl;
var codeService = require('../../util/codeService');

/**
 * contact list info spider
 * @param callback
 */
module.exports = function(callback){
    console.info("[transaction]: begin to read contact list");
    var self = this;
    var driver = self.driver;
    var contactArr = [];
    var startTime = null;
    driver.call(function(){
        driver.findElement({'css': '.web_wechat_add'}).click();
        driver.wait(webdriver.until.elementLocated(webdriver.By.css('#mmpop_system_menu')) , 20000);
        driver.findElements({'css': '#mmpop_system_menu .dropdown_menu >li'})
            .then(function(collection){
                return collection[0].findElement({css: 'a'}).click()
            });
        driver.wait(webdriver.until.elementLocated(webdriver.By.css('.ngdialog-content')), 20000);
        driver.call(function(){
            startTime = (new Date()).getTime();
            var receiveCount = 0;
            var baseCount = 0;
            return spiderContactList(self, contactArr).then(function (arr) {
                if(!arr.length){
                    return callback(null,[]);
                }
                var newArr = arr.filter(function(item){
                    return item != null;
                });
                baseCount = receiveCount = arr.length;
                contactArr = contactArr.concat(newArr);
                return iterator(new webdriver.promise.fulfilled());
            });
            function iterator(promise){
                return promise.then(function(){
                    return driver.executeScript(function(receiveCountContact) {
                        var $myContactScrollbar = $('#createChatRoomContainer >div:nth-child(2) div[jquery-scrollbar]');
                        var startPosContact = parseInt($myContactScrollbar.scrollTop(), 10);
                        var expectHeightContact = receiveCountContact * 55;
                        $myContactScrollbar.scrollTop(expectHeightContact);
                        var endPosContact = parseInt($myContactScrollbar.scrollTop(), 10);
                        var moveHeightContact = parseInt(endPosContact-startPosContact, 10);
                        return {
                            moveHeightContact : moveHeightContact,
                            done: moveHeightContact === 0,
                            actualCount: Math.floor(parseInt(endPosContact-startPosContact, 10)/55)
                        };
                    }, receiveCount)
                        .then(function (data) {
                            if(data.done){
                                return contactArr;
                            }
                            return spiderContactList(self,contactArr).then(function (arr) {
                                receiveCount += baseCount;
                                var newArr = arr.filter(function(item){
                                    return item != null;
                                });
                                contactArr = contactArr.concat(newArr);
                                if(newArr.length === 0){
                                    return contactArr
                                }else{
                                    iterator(promise);
                                }
                            })
                        });
                })
            }
        }).then(function(arr){
            console.log("[flow]: Succeed to get contact list info that length is [" + contactArr.length + "]");
            console.warn(contactArr);
            driver.findElement(closeLocator)
                .then(function(item){
                    return item.click();
                });
            driver.sleep(500);
            driver.call(function(){
                reset.call(self, function(){
                    callback(null, contactArr);
                });
            });
        })
    })
    .thenCatch(function(e){
        console.error('[flow]: Failed to read contact list');
        console.error(e);
        callback(e);
    })
};

function spiderContactList(self, contactArr){
    var driver = self.driver;
    driver.sleep(1000);
    return driver.findElements({'css': '#createChatRoomContainer div[ng-repeat="item in contactList"] >div'})
        .then(function(collection) {
            return webdriver.promise.map(collection, function (item, index, arr) {
                var contact = item;
                var username = "";
                var nickname = null;
                var result = {};
                return contact.findElement({css: '.avatar img'})
                    .then(function (imgEl) {
                        return imgEl.getAttribute('src')
                            .then(function (src) {
                                (uploadImg.bind(self))(src, result);
                                username = qs.parse(urlCore.parse(src).query).username;
                                if (!username || username.substr(0, 1) != "@" || hasUserName(contactArr, username)) {
                                    return null
                                } else {
                                    return contact.findElement({css: '.info .nickname'})
                                }
                            })
                            .then(function (nickNameEl) {
                                if (nickNameEl) {
                                    return nickNameEl.getInnerHtml();
                                }
                                return null;
                            })
                            .then(function (nickname) {
                                var refinedNickname = extractNickname(nickname);
                                if(!refinedNickname){
                                    return null
                                }
                                result['nickname'] = refinedNickname;
                                result['username'] = username;
                                return result;
                                //if(nickname && typeof nickname === 'string'){
                                //    console.log(nickname);
                                //    console.warn(validateIsNormalStrOrNot(nickname));
                                //    if(validateIsNormalStrOrNot(nickname)){
                                //        return null;
                                //    }
                                //    else if(nickname === ""){
                                //        return null;
                                //    }
                                //    else{
                                //        return {
                                //            nickname: nickname,
                                //            username: username
                                //        };
                                //    }
                                //}
                                //return null;
                            })
                    })
                    .thenCatch(function (e) {
                        console.error('[flow]: Failed to read contact list');
                        console.error(e);
                        throw e;
                    })
            })
            .thenCatch(function (e) {
                console.error('[flow]: Failed to read contact list');
                console.error(e);
                throw e;
            });
        })
}

function hasUserName(arr, key) {
    var self = arr;
    for(var i=0, len=self.length; i<len; i++){
        if(self[i] && self[i].username === key){
            return true;
        }
    }
    return false;
}

function uploadImg(src, data){
    var self = this;
    var mediaId = codeService.fetch();
    data.headimgid = mediaId;
    request.get({url: src, jar: self.j, encoding: null}, function(err, res, body){
        if(err){
            console.error(err);
            var e = new Error(err.message);
            e.code = MYERROR.FILE_SERVER.code;
            throw e;
        }
        if(body && body.length){
            console.info("[flow]: Succeed to upload head img, body  length  "+body.length)
        }
        var formData = {mediaId: mediaId, file: {value: body, options: {filename: 'xxx.jpg'}}};
        request.post({url:fsServer, formData: formData}, function(err, res, body) {
            if(err){
                console.error(err);
                var e = new Error(err.message);
                e.code = MYERROR.FILE_SERVER.code;
                throw e;
            }
            console.info('[flow]: Succeed to upload the headImg');
        });
    });
}

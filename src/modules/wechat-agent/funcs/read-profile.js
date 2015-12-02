var webdriver = require('selenium-webdriver');
var request = require('request');
var _ = require('underscore');
var url = require('url');
var qs = require('querystring');
var reset = require('./reset-pointer');
var settings = require('../app/settings');
var fsServer = settings.fsUrl;
var codeService = require('../services/codeService');
var fineOneContact = require('./find-one-contact');
var Promise = require('bluebird');

module.exports = readProfile = function(bid, callback){
    console.info("[transaction]: begin to read profile of contact that bid is " + bid);
    var self = this;
    var driver = self.driver;
    driver.call(fineOneContact, driver, bid)
        .then(function(){
            var data = {};
            self.driver.sleep(500);
            driver.call(openPanel, self)
                .then(function(){
                    console.info('[flow]: read profile, the profile panel is opened');
                    return self.driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to open panel');
                    return webdriver.promise.rejected(e);
                });
            driver.call(readPlace, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read place');
                    return self.driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read place');
                    return webdriver.promise.rejected(e);
                });
            driver.call(readSex, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read sex');
                    return self.driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read sex');
                    return webdriver.promise.rejected(e);
                });
            driver.call(readNickname, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read nickname');
                    return self.driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read nickname');
                    return webdriver.promise.rejected(e);
                });
            driver.call(readRemark, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read remark');
                    return self.driver.sleep(2000);
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read remark');
                    return webdriver.promise.rejected(e);
                });
            driver.call(readHeadImgAsync, self, data)
                .then(function(){
                    console.info('[flow]: read profile, Succeed to read head img');
                    self.driver.sleep(2000);
                    self.driver.call(callback, self, null)
                })
                .thenCatch(function(e){
                    console.error('[flow]: read profile, Failed to read head img');
                    return webdriver.promise.rejected(e);
                })
        })
        .thenCatch(function(){
            console.error("[flow]: Failed to find the contact that bid is " + bid);
            return callback(e);
        })
};

exports.readProfile.openPanel = openPanel;
exports.readProfile.reverse = openPanel;
exports.readProfile.remark = openPanel;
exports.readProfile.readPlace = openPanel;
exports.readProfile.readSex = openPanel;
exports.readProfile.readNickName = openPanel;
exports.readProfile.readRemark = openPanel;
exports.readProfile.readHeadImg = openPanel;

function openPanel(){
    var self = this;
    self.driver.sleep(500);
    var boxItem = self.driver.findElement({'css': '#chatArea>.box_hd'});
    boxItem.findElement({'css': 'div.title_wrap>div.title.poi'}).click()
        .thenCatch(function(e){
            console.error('[flow]: read profile, Failed to click #chatArea>.box_hd');
            return webdriver.promise.rejected(e);
        });
    self.driver.wait(webdriver.until.elementLocated(webdriver.By.css('#chatRoomMembersWrap div.member:nth-child(2)>img')), 5000)
        .thenCatch(function(e){
            console.error('[flow]: read profile, Failed to Wait for Element -> #chatArea>.box_hd');
            return webdriver.promise.rejected(e);
        });
    var btn = boxItem.findElement({'css': '#chatRoomMembersWrap div.member:nth-child(2)>img'});
    self.driver.sleep(500);
    btn.click().then(function(){console.info('[flow]: read profile, the profile panel is opened');})
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to click #chatArea>.box_hd');
            return webdriver.promise.rejected(e);
        });
    return self.driver.sleep(2000)
}

function reverse(data){
    var self = this;
    var itemEl = self.driver.findElement({'css': 'div.meta_area p[contenteditable]'});
    self.driver.sleep(200);
    itemEl.click()
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to click btn -> div.meta_area p[contenteditable]');
            return webdriver.promise.rejected(e);
        });
    self.driver.executeScript('window.document.querySelector("div.meta_area p[contenteditable]").innerText = "";')
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to clear input -> #chatArea>.box_hd');
            return webdriver.promise.rejected(e);
        });
    self.driver.sleep(500);
    self.driver.executeScript('window.document.querySelector("div.meta_area p[contenteditable]").blur();')
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to blur input -> div.meta_area p[contenteditable]');
            return webdriver.promise.rejected(e);
        });
    self.driver.findElement({css: '#mmpop_profile .avatar .img'}).click()
        .then(function () {
            data.bid = data.nickname;
            console.log("[flow]:clear remark ok");
        })
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to click img -> #mmpop_profile .avatar .img');
            return webdriver.promise.rejected(e);
        });
    return self.driver.sleep(1000)
}

function remark(data){
    var self = this;
    var itemEl = self.driver.findElement({'css': 'div.meta_area p[contenteditable]'});
    self.driver.sleep(200);
    itemEl.click()
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to click input -> div.meta_area p[contenteditable]');
            return webdriver.promise.rejected(e);
        });
    self.driver.executeScript('window.document.querySelector("div.meta_area p[contenteditable]").innerText = "";')
        .then(function () {
            var code = codeService.fetch();
            data.bid = code;
            return itemEl.sendKeys(code)
        })
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to execute script clear div.meta_area p[contenteditable]');
            return webdriver.promise.rejected(e);
        });
    self.driver.sleep(500);
    self.driver.executeScript('window.document.querySelector("div.meta_area p[contenteditable]").blur();')
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to execute script blur div.meta_area p[contenteditable]');
            return webdriver.promise.rejected(e);
        });
    self.driver.findElement({css: '#mmpop_profile .avatar .img'}).click()
        .then(function () {
            console.log("[flow]: read profile, modify remark ok");
            return self.driver.sleep(1000)
        })
        .thenCatch(function(){
            console.error('[flow]: read profile, Failed to click img -> #mmpop_profile .avatar .img]');
            return webdriver.promise.rejected(e);
        });
}

function readPlace(data){
    var self = this;
    var popEl = self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini'});
    var placeEl = self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(2) p'});
    placeEl.getText()
        .then(function(placetxt){
            console.info('[flow]: read profile, place is ' + placetxt);
            data.place = placetxt;
            data.botid = self.id;
            return popEl;
        })
        .thenCatch(function(){
            data.place = "";
            return popEl;
        })
}

function readSex(data){
    var self = this;
    var sexEl = self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini div.profile_mini_bd>div.nickname_area i[ng-if]'});
    sexEl.getAttribute('class')
        .then(function(txt){
            var tmpSex = txt.split(' ')[1];
            if(tmpSex === 'web_wechat_men'){
                data.sex = 1;
            }
            else if(tmpSex === 'web_wechat_women'){
                data.sex = 2;
            }
            else{
                data.sex = 0;
            }
            console.info('[flow]: sex is ' + data.sex);
        })
        .thenCatch(function(){
            data.sex = 0;
        })
}

function readNickname(data){
    var self = this;
    var nickNameEl = self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini div.profile_mini_bd>div.nickname_area h4'});
    nickNameEl.getText()
        .then(function(txt){
            console.info('[flow]: nickname is ' + txt);
            return data.nickname = txt;
        })
        .thenCatch(function(){
            data.nickname = "";
        })
}

function readRemark(data){
    var self = this;
    var remarkEl =  self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(1) p'});
    remarkEl.getText()
        .then(function(bidtxt){
            if(bidtxt === '点击修改备注' || 'Click to edit alias'){
                console.info('[flow]: remark is empty');
                return data.bid = data.nickname;
            }
            console.info('[flow]: remark is ' + data.nickname);
            return data.bid = bidtxt;
        })
}

var readHeadImgAsync = Promise.promisify(readHeadImg);

function readHeadImg(data, callback){
    var self = this;
    var headEl =  self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini div.profile_mini_hd img'});
    headEl.getAttribute('src')
        .then(function(src){
            var urlJson = _.pick(url.parse(src), 'protocol', 'slashes', 'host', 'hostname', 'pathname');
            var qsJson = qs.parse(url.parse(src).query);
            delete qsJson["skey"];
            delete qsJson["type"];
            urlJson.search = qs.stringify(qsJson);
            var formatUrl = url.format(urlJson);
            request.get({url: formatUrl, jar: self.j, encoding: null}, function(err, res, body){
                if(body && body.length){
                    console.info("[flow]: Succeed to upload head img, body  length  "+body.length)
                }
                var formData = {file: {value: body, options: {filename: 'xxx.jpg'}}};
                request.post({url:fsServer, formData: formData}, function(err, res, body) {
                    if (err) {
                        return callback(err, null);
                    }
                    try{
                        var json = JSON.parse(body);
                    }catch(e){
                        return callback(e, data);
                    }
                    console.info('[flow]: Succeed to upload the headImg');
                    data.headimgid = json['media_id'] || "";
                    reset(self, function(){
                        return callback(json.err, data);
                    });
                });
            })
        })
}
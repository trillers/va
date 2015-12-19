var reset = require('./reset-pointer');
var PromiseBB = require('bluebird');
var webdriver = require('selenium-webdriver');
var _modifyRemarkAsync = require('./modify-user-remark-decorator');

module.exports = function(self, item, parentItem, callback){
    parentItem.click()
        .then(function(){
            return self.driver.sleep(500);
        })
        .then(function(){
            return _findElementsInChatAysnc(self)
                .then(function(items){
                    var promiseArr = [];
                    items.forEach(function(item){
                        promiseArr.push(addOneUserAsync(self, item));
                    });
                    PromiseBB.all(promiseArr)
                        .then(function(arr){
                            return arr;
                        })
                        .catch(Error, function(e){
                            throw e;
                        })
                })
                .then(function() {
                    return self.driver.sleep(1000)
                })
                .then(function(){
                    return clearPanelAsync();
                })
                .then(function() {
                    return reset(self, callback);
                })
                .thenCatch(function(err){
                    console.error("Failed to add contact----");
                    console.error(err);
                    callback(err);
                })
        })
        .thenCatch(function(err){
            console.error('[flow]: Failed to handler a recommend');
            console.error(err);
            callback(err);
        });
    function addOneUserAsync(self, item){
        return item.click()
            .then(function(){
                return _modifyRemarkAsync(self, null, item);
            })
            .then(function(profile){
                console.info("[flow]:the contact has been added, the profile is****");
                console.info(profile);
                self.emit('contactAdded', {err: null, data: {botid: self.id, remark: profile.code, nickname: profile.nickName}});
            })
            .thenCatch(function(e){
                console.error('[flow]: error occur - add one user');
                console.error(e);
                throw e;
            })
    }
    function clearPanelAsync(){
        var chatArea, posX;
        return self.driver.findElement({css: '.chat_bd'})
            .then(function(item){
                chatArea = item;
                return self.driver.executeScript('return document.querySelector(".chat_bd").clientWidth')
            })
            .then(function(width){
                posX = parseInt(width, 10) - 100;
                console.log(posX);
                return new webdriver.ActionSequence(self.driver)
                    .mouseMove(chatArea, {x: posX, y:100})
                    .click(webdriver.Button.RIGHT)
                    .perform();
            })
            .then(function(){
                console.log("[flow]:the recommend panel has been clear");
                return self.driver.findElement({css: 'a[ng-click="item.callback()"]'})
            })
            .then(function(item){
                return item.click();
            })
            .then(function(){
                return self.driver.sleep(500);
            })
            .thenCatch(function(e){
                console.error("Failed to clear the panel after add a contact");
                console.error(e);
                throw e;
            })
    }
};

function _findElementsInChatAysnc(self){
    return self.driver.findElements({'css': '#chatArea div.card>div.card_bd>div.info>h3'})
        .then(function(items){
            return items
        })
        .thenCatch(function(e){
            console.error('[flow]: Failed to findOne in chat[code]-----' + JSON.stringify(e));
            console.error(e);
            throw e;
        })
}
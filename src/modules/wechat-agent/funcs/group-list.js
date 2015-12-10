var webdriver = require('selenium-webdriver');
var urlCore = require('url');
var qs = require('querystring');
var reset = require('./reset-pointer');
var closeLocator = webdriver.By.css('div.ngdialog-close');
/**
 * group list info spider
 * @param driver
 * @param callback
 */
module.exports = function(callback){
    var self = this;
    console.info("[transaction]: begin to read group list");
    var driver = self.driver;
    var groupNameArr = [];
    driver.call(function(){
        driver.findElement({'css': '.web_wechat_add'}).click();
        driver.wait(webdriver.until.elementLocated(webdriver.By.css('#mmpop_system_menu')) , 20000);
        driver.findElements({'css': '#mmpop_system_menu .dropdown_menu >li'})
            .then(function(collection){
                return collection[0].findElement({css: 'a'}).click()
            });
        driver.wait(webdriver.until.elementLocated(webdriver.By.css('.ngdialog-content')), 20000);
        driver.findElement({css: '#createChatRoomContainer ul li:nth-child(2)'})
            .then(function(liNode){
                return liNode.click()
            });
        driver.call(function(){
            var receiveCount = 0;
            var baseCount = 0;
            return spiderGroupList(driver, groupNameArr).then(function (arr) {
                if(!arr.length){
                    return callback(null,[]);
                }
                receiveCount = baseCount = arr.length;
                groupNameArr = groupNameArr.concat(arr);
                return iterator(new webdriver.promise.fulfilled());
            });
            function iterator(promise){
                return promise.then(function(){
                    return driver.executeScript(function(receiveCount) {
                        var $myScrollbar = $myScrollbar || $('#createChatRoomContainer >div:nth-child(3) div[jquery-scrollbar]');
                        var startPos = parseInt($myScrollbar.scrollTop(), 10);
                        var expectHeight = receiveCount * 50;
                        $myScrollbar.scrollTop(expectHeight);
                        var endPos = $myScrollbar.scrollTop();
                        var moveHeight = parseInt(endPos-startPos, 10);
                        return {done: moveHeight === 0, actualCount: Math.floor(parseInt(endPos-startPos, 10)/50)};
                    }, receiveCount)
                        .then(function (data) {
                            if(data.done){
                                return groupNameArr;
                            }
                            return spiderGroupList(driver,groupNameArr)
                                .then(function (arr) {
                                    receiveCount += baseCount;
                                    var newArr = arr.filter(function(item){
                                        return item.name != null;
                                    });
                                    groupNameArr = groupNameArr.concat(newArr);
                                    if(newArr.length === 0){
                                        return groupNameArr
                                    }else{
                                        iterator(promise);
                                    }
                                })
                        })
                })
            }
        }).then(function(arr){
            driver.findElement(closeLocator)
                .then(function(item){
                    return item.click();
                });
            driver.sleep(500);
            driver.call(function(){
                reset.call(self, function(){
                    callback(null, groupNameArr);
                });
            });
        })
    })
    .thenCatch(function(e){
        console.error('[flow]: group list, Failed to read group list');
        console.error(e);
        callback(e);
    });
};

function spiderGroupList(driver, groupNameArr){
    return driver.sleep(1000)
        .then(function(){
            return driver.findElements({'css': '#createChatRoomContainer div[ng-repeat="item in allContacts"]'})
                .then(function(collection) {
                    return webdriver.promise.map(collection, function (item, index, arr) {
                        var contact = item;
                        var username = "";
                        return contact.findElement({css: '.avatar img'})
                            .then(function (imgEl) {
                                return imgEl.getAttribute('mm-src')
                                    .then(function (src) {
                                        username = qs.parse(urlCore.parse(src).query).username;
                                        if (hasUserName(groupNameArr, username)) {
                                            return null
                                        } else {
                                            return contact.findElement({css: '.nickname'})
                                        }
                                    })
                                    .then(function (nickNameEl) {
                                        if (nickNameEl) {
                                            return nickNameEl.getText();
                                        }
                                        return null;
                                    })
                                    .then(function (nickname) {
                                        return {
                                            username: username,
                                            name: nickname
                                        };
                                    })
                                    .thenCatch(function (e) {
                                        throw e;
                                    })
                            })
                            .thenCatch(function (e) {
                                throw e;
                            })
                    })
                    .thenCatch(function (e) {
                        throw e;
                    });
                })
        })
        .thenCatch(function(e){
            console.error('[flow]: Failed to read group list');
            console.error(e)
            throw e;
        })
}

function hasUserName(arr, key) {
    var self = arr;
    for(var i=0, len=self.length; i<len; i++){
        if(self[i].username === key){
            return true;
        }
    }
    return false;
}
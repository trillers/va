var PromiseBB = require('bluebird');
var request = require('request');
var reset = require('./reset-pointer');
var fsServer = require('../../../app/settings').fsUrl;
var webdriver = require('selenium-webdriver');

module.exports = function(self, item, parentItem, callback){
    item.getText()
        .then(function(count){
            parentItem.click()
                .then(function(){
                    return self.driver.sleep(200);
                })
                .then(function(){
                    spiderContent(self, count, function(err, msgArr){
                        if(msgArr){
                            self.emit('receive', {err: null, data: {msgArr: msgArr}});
                        }
                        return reset(self, callback);
                    })
                })
                .thenCatch(function(e){
                    console.error(e);
                    throw e;
                })
        })
        .thenCatch(function(e){
            console.error("[flow]: Failed to receive msg");
            console.error(e);
            callback(e);
        })
};
function spiderContent(self, unReadCount, callback){
    //walk in dom
    self.driver.findElement({'css': '#chatArea'})
        .then(function(chatwrapper){
            return chatwrapper.findElements({'css': 'div[ng-repeat="message in chatContent"]'});
        })
        .then(function(collection){
            var unreadArr = collection.slice(-unReadCount);
            var PromiseArr = [];
            unreadArr.forEach(function(item){
                PromiseArr.push(_getContentAsync(self, item));
            });
            return PromiseBB.all(PromiseArr)
                .then(function(arr){
                    var newArr = arr.filter(function(item){
                        return item != null
                    });
                    return newArr;
                })
                .catch(Error, function(e){
                    throw e;
                })
        })
        .then(function(msgArr){
            return callback(null, msgArr);
        })
        .thenCatch(function(e){
            console.error("[flow]: Failed to receive msg");
            console.error(e);
            return callback(e);
        });
    var _getContentAsync = PromiseBB.promisify(_getContent);
    function _getContent(self, promiseOrigin, callback){
        try{
            var msg = {
                MsgId: Math.ceil(parseInt(new Date().getTime(), 10)/1000).toString(),
                FromUserName: self.sendTo,
                ToUserName: self.id,
                CreateTime: parseInt(new Date().getTime(), 10).toString()
            };

        }catch(e){
            return callback(e);
        }
        var groupNameEl = promiseOrigin.findElement(webdriver.By.css('h4'));
        groupNameEl.then(function(h4El){
            if(h4El){
                return h4El.getText()
            }else{
                return null;
            }
        }).thenCatch(function(){
            return null;
        })
        .then(function(nickname){
            if(nickname){
                msg.Member = nickname;
            }
            var currNode = null;
            promise = promiseOrigin.findElement({css: '.js_message_bubble'});
            promise.findElement({'css': '.bubble_cont >div'})
                .then(function(item){
                    currNode = item;
                    return item.getAttribute('class')
                })
                .then(function(className){
                    if(className === 'plain'){
                        console.info('[flow]: type is plain');
                        currNode.findElement({'css': 'pre.js_message_plain'})
                            .then(function(preEl){
                                preEl.getText().then(function(payLoad){
                                    console.info('[flow]: payLoad is');
                                    console.info(payLoad);
                                    if(payLoad){
                                        msg['Content'] = payLoad;
                                        msg['MsgType'] = 'text';
                                        return callback(null, msg);
                                    } else {
                                        preEl.findElement({'css': 'img'})
                                            .then(function(img){
                                                return img.getAttribute('text');
                                            })
                                            .then(function(text){
                                                //custom expression eg: [开心]_web
                                                msg['Content'] = text.split('_')[0];
                                                msg['MsgType'] = 'text';
                                                callback(null, msg);
                                            })
                                    }

                                })
                            })
                            .thenCatch(function(e){
                                console.error('[flow]: receive message failed');
                                console.error(e);
                                return callback(e, null)
                            })
                    }
                    else if(className === 'picture'){
                        console.info("[flow]: type is image");
                        return currNode.findElement({'css': '.msg-img'})
                            .then(function(img){
                                return img.getAttribute('src')
                            })
                            .then(function(src){
                                return getMediaUrl(src)
                            })
                            .then(function(url){
                                console.info("[flow]: url is " + url);
                                getMediaFile(url, 'jpg', function(err, res){
                                    if(err){
                                        return callback(err, null)
                                    }
                                    msg['MediaId'] = res['wx_media_id'];
                                    msg['FsMediaId'] = res['media_id'];
                                    msg['MsgType'] = 'image';
                                    callback(null, msg);
                                })
                            })
                            .thenCatch(function(e){
                                callback(e, null)
                            })
                    }
                    else if(className === 'voice'){
                        console.info("[flow]: type is voice");
                        return promise.getAttribute('data-cm')
                            .then(function(attr){
                                var obj = JSON.parse(attr);
                                getMediaFile(self.baseUrl + 'cgi-bin/mmwebwx-bin/webwxgetvoice?msgid=' + obj.msgId, 'mp3', function(err, res){
                                    if(err){
                                        return callback(err, null)
                                    }
                                    msg['MediaId'] = res['wx_media_id'];
                                    msg['FsMediaId'] = res['media_id'];
                                    msg['MsgType'] = 'voice';
                                    callback(null, msg);
                                });
                            })
                            .thenCatch(function(e){
                                callback(e, null)
                            })
                    }
                    else{
                        callback(null, null);
                    }
                })
                .thenCatch(function(e){
                    console.error('[flow]: spider content error');
                    console.error(e.stack)
                    return callback(e, null);
                });
            function getMediaUrl(src){
                var url = src.split('&type=slave')[0];
                return url;
            }
            function getMediaFile(url, fileType, callback){
                console.info("[flow]: file url is " + url);
                var formData = {
                    file: {
                        value: request({url: url, jar: self.j, encoding: null}),
                        options: {
                            filename: 'xxx.' + fileType
                        }
                    }
                };
                request.post({url:fsServer, formData: formData}, function(err, res, body) {
                    if (err) {
                        return callback(err, null);
                    }
                    try{
                        var json = JSON.parse(body);
                    }catch(e){
                        console.error("[flow]: -receive message - Failed to parse json from file server");
                        return callback(e);
                    }
                    if(json.err){
                        return callback(json.err, null);
                    }
                    callback(null, json);
                });
            }
        });
    }
}
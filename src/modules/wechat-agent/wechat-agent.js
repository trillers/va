var EventEmitter = require('events').EventEmitter;
var util = require('util');
var request = require('request');
var settings = require('../../app/settings');
var createDriver = require('../webdriver/webdriverFactory');
var TaskQueue = require('l-mq');

function WechatAgent(worker){
    EventEmitter.call(this);
    this.id = worker.id;
    this.pid = worker.pid;
    this.status = worker.status || 'start';
    this.sendTo = null;
    this.driver = createDriver();
    this.taskQueue = new TaskQueue(1);
    this.loggedIn = false;
    this.callCsToLogin = null;
    this.waitForLogin = null;
    this.baseUrl = "";
    this.j = request.jar();
}

util.inherits(WechatAgent, EventEmitter);

var proto = WechatAgent.prototype;

proto.getStatus = function(){
    return this.status;
};

proto.start = function(){
    var self = this;
    console.log('[transaction]: begin to start botid=' + self.id);
    self._login(function(err, data){
        console.log('login ok');
        if(err) {
            self.stop().then(function(){
                self.start();
            })
        }else{
            self._polling();
        }
    });
};

proto._login = function(){
    var self = this;
    console.log("[flow]: Begin to login");
    self.driver.get(settings.wxIndexUrl)
        .then(function(){
            needLogin(self, function(err, media_id){
                if(err){
                    console.error(err);
                    return self.stop()
                        .then(function(){
                            return self.start();
                        });
                }
                return;
            });
            self.callCsToLogin = setInterval(function(){
                needLogin(self, function(err, media_id){
                    if(err){
                        console.error(err);
                        self.stop()
                            .then(function(){
                                return self.start();
                            });
                    }
                    return;
                });
            }, settings.callCsToLoginGap);
            self.waitForLogin = setInterval(function(){
                self.driver.findElement({css: '.nickname span'})
                    .then(function(span){
                        return span.getText()
                    })
                    .then(function(txt){
                        if(!self.loggedIn && txt != ""){
                            clearInterval(self.waitForLogin);
                            clearInterval(self.callCsToLogin);
                            self.loggedIn = true;
                            self.emit('login', {err: null, data: {botid: self.id}});
                            callback(null, null);
                        }
                    })
                    .thenCatch(function(e){
                        console.error("[system]: Failed to wait for login");
                        console.error(e);
                        self.stop().then(function(){
                            self.start();
                        });
                    })
            }, settings.waitForLoginGap);
        })
        .thenCatch(function(e){
            console.error("[system]: Failed to login");
            console.error(e);
            callback(e, null);
        });
};

proto.restart = function(){};

proto.stop = function(){};

proto.init = function(){};

proto.sendText = function(){};

proto.sendImage = function(){};

proto.readProfile = function(){};

proto.groupList = function(){};

proto.contactList = function(){};

proto.contactListRemark = function(){};

proto.addUserInGroup = function(){};

proto.addUserInGroup = function(){};

proto.onContactProfile = function(){};

proto.onRemarkContact = function(){};

proto.onLogin = function(){};

proto.onAbort = function(){};

proto.onReceive = function(){};

proto.onNeedLogin = function(){};

proto.onAddContact = function(){};

proto.onDisconnect = function(){};

proto._polling = function(){};

proto._login = function(){};

proto._findOne = function(){};

proto._walkChatList = function(){};

proto._LoginOrNot = function(){};

function getLoginQr(wcBot, callback){
    var self = wcBot;
    console.info("[flow]: enter git login qr");
    waitFor(self.driver, {css: '.qrcode img'}, 50000)
        .then(function(){
            console.info("[flow]: wait ok qr img node ready");
            return self.driver.findElement({css: '.qrcode img'});
        })
        .then(function(img){
            img.getAttribute('src')
                .then(function(src){
                    console.info("[flow]: src is " + src);
                    var formData = {
                        file: {
                            value: request({url: src, jar: self.j, encoding: null}),
                            options: {
                                filename: 'xxx.jpg'
                            }
                        }
                    };
                    console.info('[flow]: file system server,s url is ' + fsServer);
                    request.post({url: fsServer, formData: formData}, function(err, res, body) {
                        if(err){
                            console.error('[system]: Failed to upload qr img when client disconnect');
                            console.error(err);
                            return callback(err, null);
                        }
                        try{
                            var json = JSON.parse(body);
                        }catch(e){
                            console.error("[system]: -Failed to get login qrcode -m JSON parse error");
                            console.error(body);
                            return callback(e, null);
                        }
                        if(json.err){
                            return callback(json.err, null);
                        }
                        callback(null, json);
                    });
                })
                .thenCatch(function(e){
                    console.error('[system]: Failed to get img attribute when client disconnect');
                    return callback(e, null);
                })
        })
        .thenCatch(function(e){
            console.error('[system]: Failed to find img node when client disconnect');
            return callback(e, null);
        })
}

function needLogin(wcBot, callback){
    var self = wcBot;
    getLoginQr(self, function(err, data){
        if(err){
            console.error('[flow]: Failed to get Qrcode that used to login');
            callback(err, null);
        }else{
            console.info("[flow]: get login qrcode successful the media_id is [ " + data.media_id + " ]");
            self.emit('needLogin', {err: null, data:{wx_media_id: data.wx_media_id, media_id: data.media_id, botid: self.id}});
            return callback(null, null);
        }
    })
}

function pollingDispatcher(self,input){
    var handlers = {
        '朋友推荐消息': suggestFriendHandler,
        'Recommend' : suggestFriendHandler,
        'defaultHandler': (function(input){
            self.sendTo = input;
            return receiveMessageHandler;
        })(input)
    };
    return handlers[input] || handlers['defaultHandler'];
}

module.exports = function(worker){
    return new WechatAgent(worker)
};
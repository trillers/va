var EventEmitter = require('events').EventEmitter;
var util = require('util');
var request = require('request');
var settings = require('../../app/settings');
var webdriver = require('selenium-webdriver');
var createDriver = require('../webdriver/webdriverFactory');
var fsServer = settings.fsUrl;
var TaskQueue = require('l-mq');
var getCount = require('../util').getCount;
var getBroker = require('../wechat-broker');
var STATUS = require('./settings/constant').STATUS;
var CONSTANT = require('./settings/constant');
var microsFactory = require('../../app/macros');
var helper = require('./helper');

var findOneContact = require('./funcs/find-one-contact');
var reset = require('./funcs/reset-pointer');
var readProfile = require('./funcs/read-profile');
var sendText = require('./funcs/send-text');
var sendImage = require('./funcs/send-image');
var spiderContactListInfo = require('./funcs/contact-list');
var reverseProfileAsync = require('./funcs/profile-reverse');
var spiderGroupListInfo = require('./funcs/group-list');

function WechatAgent(worker){
    EventEmitter.call(this);
    this.id = worker.id;
    this.managerId = worker.managerId;
    this.pid = worker.pid;
    this.status = worker.status || STATUS.STARTING;
    this.prevStatus = worker.prevStatus || STATUS.STARTING;
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

proto.start = function(options, callback){
    console.info('[system]: an agent is startup [id]=' + this.id);
    var self = this;
    console.log('[transaction]: begin to start botid=' + self.id);
    self._login(function(err){
        if(err){
            console.log(err);
            return callback(err);
        }
        self._transition(STATUS.LOGGING);
        if(options.intention === CONSTANT.INTENTION.REGISTER){
            //TODO register
            //TODO check
            //pass than emit register event
            //failed than exit
        }
        //mode trusted | untrusted
        if(options.mode === CONSTANT.MODE.UNTRUSTED){
            //TODO check
            //pass than polling
            //failed than exit

        } else {
            //polling

        }
    });
};

proto._login = function(callback){
    var self = this;
    console.log("[flow]: Begin to login");
    self.driver.get(settings.wxIndexUrl)
        .then(function(){
            helper.needLogin(self, function(err, media_id){
                if(err){
                    console.error(err);
                    return self.stop()
                        .then(function(){
                            return self.start();
                        });
                }
            });
            self.callCsToLogin = setInterval(function(){
                helper.needLogin(self, function(err, media_id){
                    if(err){
                        console.error(err);
                        self.stop()
                            .then(function(){
                                return self.start();
                            });
                    }
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

proto.restart = function(){
    var self = this;
    return self.driver.close()
        .then(function(){
            return self.init(self);
        })
        .thenCatch(function(e){
            console.error('[system]: Failed to stop bot');
            console.error(e);
            return self.init(self);
        })
        .then(function(){
            return self.start();
        })
};

proto.stop = function(){
    var self = this;
    return self.driver.close()
        .then(function(){
            return self.init(self);
        })
        .thenCatch(function(e){
            console.error('[system]: Failed to stop bot');
            console.error(e);
            return self.init(self);
        })
};

proto.init = function(bot){
    bot.sendTo = null;
    bot.driver = createDriver();
    bot.taskQueue = new TaskQueue(1);
    bot.loggedIn = false;
    if(bot.callCsToLogin){
        bot.callCsToLogin = null;
        clearInterval(bot.callCsToLogin);
    }
    if(bot.waitForLogin){
        clearInterval(bot.waitForLogin);
        bot.waitForLogin = null;
    }
    bot.emit('abort', {err: null, data: {botid: bot.id}});
    return bot.driver.sleep(3000);
};

proto.sendText = function(json, callback){
    this.micrios = microsFactory();
    this.micrios.scheduleMacros(sendText, this, json, callback);
};

proto.sendImage = function(json, callback){
    this.micrios = microsFactory();
    this.micrios.scheduleMacros(sendImage, this, json, callback);
};

proto.readProfile = function(bid, callback){
    this.micrios = microsFactory();
    this.micrios.scheduleMacros(readProfile, this, bid, callback);
};

proto.groupList = function(callback){
    spiderGroupListInfo.call(this, callback);
};

proto.contactList = function(callback){
    var self = this;
    var resultList = null;
    spiderContactListInfo(self, function(err, list){
        resultList = list;
        if(err){
            return callback(err);
        }
        reset(self, function(err){
            if(err){
                //TODO
            }
            list.forEach(function(contact){
                if(contact.nickname.substr(0, 3) != 'bu-'){
                    self.readProfile(contact.nickname, function(err, data){
                        if(err){
                            console.log("[flow]: contact list, Failed to get contact list");
                            console.warn(err);
                        }else{
                            data.botid = self.id;
                            self.emit('remarkcontact', {err: null, data: data})
                        }
                    });
                }else{
                    //入队
                    self.taskQueue.enqueue(reverseProfileAsync, {args:[self, contact.nickname]}, function(err, data){
                        if(err){
                            console.log("[flow]: contact list, Failed to remark contact");
                            console.warn(err);
                        }else{
                            self.emit('remarkcontact', {err: null, data: data})
                        }
                    });

                }
            });
        });
    })
};

proto.onContactProfile = function(handler){
    var self = this;
    self.removeAllListeners('contactprofile').on('contactprofile', function(data){
        handler.call(self, data.err, data.data)
    });
};

proto.onRemarkContact = function(handler){
    var self = this;
    self.removeAllListeners('remarkcontact').on('remarkcontact', function(data){
        handler.call(self, data.err, data.data)
    });
};

proto.onLogin = function(handler){
    var self = this;
    self.removeAllListeners('login').on('login', function(data){
        handler.call(self, data.err, data.data)
    });
};

proto.onAbort = function(handler){
    var self = this;
    this.removeAllListeners('abort').on('abort', function(data){
        handler.call(self, data.err, data.data)
    });
};

proto.onReceive = function(handler){
    var self = this;
    this.removeAllListeners('receive').on('receive', function(data){
        var err = data.err;
        var data = data.data;
        handler.call(self, err, data);
    });
};

proto.onNeedLogin = function(handler){
    var self = this;
    this.removeAllListeners('needLogin').on('needLogin', function(data){
        var err = data.err;
        var data = data.data;
        handler.call(self, err, data);
    });
};

proto.onAddContact = function(handler){
    var self = this;
    this.removeAllListeners('contactAdded').on('contactAdded', function(data){
        var err = data.err;
        var data = data.data;
        handler.call(self, err, data);
    });
};

proto.onDisconnect = function(handler){
    this.removeAllListeners('disconnect').on('disconnect', handler);
};

proto._walkChatList = function(callback){
    var self = this;
    self.driver.findElements({'css': 'div[ng-repeat*="chatContact"]'})
        .then(function(collection){
            var len = collection.length;
            function iterator(index){
                var item = collection[index];
                var iblockTemp = null;
                item.findElement({'css': 'i.web_wechat_reddot_middle.icon'})
                    .then(function(iblock){
                        if(!iblock){
                            return webdriver.promise.rejected(new webdriver.error.Error(801, 'no_result'))
                        }
                        iblockTemp = iblock;
                        return item.findElement({'css': 'span.nickname_text'})
                            .then(function(h3El){
                                return h3El.getText()
                            })
                            .then(function(txt){
                                console.info("[transaction] -receive : a new message received");
                                console.info("[flow]: the title is " + txt);
                                return helper.pollingDispatcher(self, txt)(self, iblockTemp, item, callback);
                            })
                            .thenCatch(function(e){
                                console.info("[flow]: walk In dom failed");
                                console.error(e);
                                callback(e);
                            })
                    })
                    .thenCatch(function(e){
                        if(e.code === 7){
                            index++;
                            if(index <= (len-1)){
                                return iterator(index)
                            }
                            return callback(null, null);
                        }
                        console.error(e);
                        callback(e);
                    })
            }
            iterator(0);
        })
        .thenCatch(function(err){
            return callback(err);
        })
};

proto._LoginOrNot = function(callback){
    var self = this;
    self.driver.findElement({css: '.nickname span'})
        .then(function(span){
            return span.getText()
        })
        .then(function(txt){
            if(txt != '' && self.loggedIn){
                return callback(null, null);
            } else {
                return webdriver.promise.rejected(new webdriver.error.Error(801, 'no_result'))
            }
        })
        .thenCatch(function(e){
            console.error(e);
            callback(e, null);
        });
};

proto._transition = function(status){
    var self = this;
    self.prevStatus = self.status;
    self.status = status;
    getBroker().then(function(broker){
        broker.brokerAgent.statusChange({
            NewStatus: self.status,
            OldStatus: self.prevStatus,
            CreateTime: (new Date()).getTime(),
            AgentId: self.id,
            NodeId: self.managerId
        })
    })
};

module.exports = function(worker){
    return new WechatAgent(worker)
};
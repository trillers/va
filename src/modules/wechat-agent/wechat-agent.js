'use strict';
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('../util/myutil');
var request = require('request');
var settings = require('../../app/settings');
var webdriver = require('selenium-webdriver');
var createDriver = require('../webdriver/webdriverFactory');
var getBroker = require('../wechat-broker');
var STATUS = require('./settings/constant').STATUS;
var CONSTANT = require('./settings/constant');
var microsFactory = require('../../app/macros');
var helper = require('./helper');
var myError = require('./settings/myerror');
var Promise = require('bluebird');
//functionalities
var reset = require('./funcs/reset-pointer');
var readProfile = require('./funcs/read-profile');
var sendText = require('./funcs/send-text');
var sendImage = require('./funcs/send-image');
var spiderContactListInfo = require('./funcs/contact-list');
var reverseProfileAsync = require('./funcs/profile-reverse');
var spiderGroupListInfo = require('./funcs/group-list');
var getHostProfile = require('./funcs/get-host-profile');

function WechatAgent(worker){
    EventEmitter.call(this);
    this.id = worker.id;
    this.pid = worker.pid;
    // enum<logging, mislogged, logged, exceptional, aborted, exited>
    this.status = worker.status || STATUS.STARTING;
    this.prevStatus = worker.prevStatus || STATUS.STARTING;
    this.managerId = worker.managerId;
    this.driver = null;
    this.nav = null;
    this.initialOptions = null;
    this.sendTo = null;
    this.loggedIn = worker.loggedIn || false;
    this.callCsToLogin = null;
    this.waitForLogin = null;
    this._disConnectWatcher = null;
    this.baseUrl = "";
    this.j = (function(){
        var jar = request.jar();
        if(worker.j && worker.j.length > 0){
            worker.j.forEach(function(cookie){
                var requestCookie = request.cookie(cookie.name + '=' + cookie.value);
                jar.setCookie(requestCookie, settings.wxIndexUrl);
            });
        }
        return  jar;
    }())
}

util.inherits(WechatAgent, EventEmitter);

var proto = WechatAgent.prototype;

/**
 * compose driver
 * @param driver webdriver.WebDriver
 * @param opts   Object<{cookie:string}>
 * @returns {*}
 */
proto.withDriver = function(driver, opts){
    if(driver && !!driver.instanceOf(webdriver.WebDriver)){
        throw new Error('Failed to create agent when with driver, driver type error')
    }
    else if(!driver){
        var self = this;
        self.driver = createDriver();
        return self.driver.call(function(){
            if(opts){
                self.driver.get('http://pc.qq.com/404');
                var options = new webdriver.WebDriver.Options(self.driver);
                if(opts && opts.cookies && opts.cookies.length>0){
                    opts.cookies.forEach(function(cookie){
                        options.addCookie(cookie.key, cookie.value, '/', '.qq.com');
                    });
                }
                //no cookies
                self.driver.get('https://wx.qq.com');
            }else{
                //no options
                self.driver.get('https://wx.qq.com');
            }
        });
    }
    else{
        this.driver = driver;
        return driver.sleep(200);
    }
};

/**
 * compose navigator
 * @param driver     webdriver.WebDriver
 */
proto.withNavigator = function(driver){
    this.nav = new webdriver.WebDriver.Navigation(driver);
};

/**
 * get Cookie from wechat, set it to the bot
 * @returns {Promise<webdriver.promise.Promise>}
 */
proto.extractCookies = function(){
    var self = this;
    return self.driver.getCurrentUrl().then(function(url){
        self.baseUrl = url;
        setCookiesAndPolling();
    });
    function setCookiesAndPolling(){
        self.driver.manage().getCookies().then(function(cookies){
            cookies.forEach(function(cookie){
                var requestCookie = request.cookie(cookie.name + '=' + cookie.value);
                self.j.setCookie(requestCookie, self.baseUrl);
            });
        });
    }
};

/**
 * get the bot start
 * @param options
 * @param callback
 */
proto.start = function(options, callback){
    console.info('[system]: an agent is startup [id]=' + this.id);
    var self = this;
    console.log('[transaction]: begin to start botid=' + self.id);
    self.initialOptions = options;
    //pass directly
    self.startWithCookies(function(err){
        if(!err){
            self._LoginOrNot(function(err){
                if(err){
                    self._login(loggedInHandler);
                }else{
                    done(callback)
                }
            });
            return;
        }
        console.warn("[flow]: Failed to start with cookies, begin to login");
        self._login(loggedInHandler);
    });
    function loggedInHandler(err){
        clearInterval(self.waitForLogin);
        clearInterval(self.callCsToLogin);
        if(err){
            console.error("[system]: Failed to login");
            self.stop()
            .then(function(){
                callback(null)
            })
            .catch(function(e){
                callback(e)
            })
        }
        if(options.intention === CONSTANT.INTENTION.REGISTER){
            //TODO register
            //pass than emit register event
            //failed than exit
            self.driver.call(getHostProfile, self).then(function(profile){
                self.emit('first-profile', {err: null, data: profile});
                return done(callback);
            })
            .thenCatch(function(e){
                console.error(e);
                return callback(e);
            })
        }
        //mode trusted | untrusted
        if(options.mode === CONSTANT.MODE.UNTRUSTED){
            var oriProfile = {
                nickname: options.nickname,
                sex: options.sex
            };
            self.driver.call(getHostProfile, self)
                .then(function(currProfile){
                    if(matchUser(currProfile, oriProfile)){
                        done(callback);
                    } else {
                        self.transition(STATUS.MISLOGGED);
                        self.stop().then(function(){
                            return callback(new webdriver.error.Error(myError.USER_NO_HOST.code, myError.USER_NO_HOST.msg));
                        })
                    }
                }).thenCatch(function(e){
                    callback(e);
                })
        } else {
            done(callback)
        }
    }
    function done(callback){
        self.loggedIn = true;
        self._watchDisconnect();
        self.transition(STATUS.LOGGED);
        self.emit('login', {err: null, data: {botid: self.id}});
        self.extractCookies();
        self.driver.sleep(3000).then(function(){callback(null)})
    }
    function matchUser(currPro, oriPro){
        var expectRate = 50;
        _.objPick(currPro, 'nickname', 'sex');
        console.warn('check match user');
        console.log(currPro);
        console.log(oriPro);
        var actualRate = _.objMatchRate(oriPro, currPro);
        console.warn('[flow]: match rate is ' + actualRate);
        return actualRate >= expectRate
    }

};

/**
 * allow bot to stop working
 * @callback Promise
 */
proto.stop = function(){
    var self = this;
    return new Promise(function(resolve, reject){
        if(_.arr.in([STATUS.ABORTED, STATUS.EXITED], self.status)){
            return resolve();
        }
        return self.driver.close()
            .then(function(){
                self.init(self);
                return resolve();
            })
            .thenCatch(function(e){
                console.warn('[system]: Failed to stop bot');
                //nothing to do...
                self.init(self);
                return reject(e);
            })
    });
};

/**
 * initialize bot
 * @param bot
 * @returns {*}
 */
proto.init = function(bot){
    bot.sendTo = null;
    bot.loggedIn = false;
    if(bot.callCsToLogin){
        bot.callCsToLogin = null;
        clearInterval(bot.callCsToLogin);
    }
    if(bot.waitForLogin){
        clearInterval(bot.waitForLogin);
        bot.waitForLogin = null;
    }
    if(bot._disConnectWatcher){
        clearInterval(bot._disConnectWatcher);
        bot._disConnectWatcher = null;
    }
    bot.emit('abort', {err: null, data: {botid: bot.id}});
};

/**
 * send text to a contact
 * @param json
 * @param callback
 */
proto.sendText = function(json, callback){
    this.micrios = microsFactory();
    this.micrios.scheduleMacros(sendText, this, {sendTo: json.BuId, content: json.Content}, callback);
};

/**
 * send image to a contact
 * @param json
 * @param callback
 */
proto.sendImage = function(json, callback){
    this.micrios = microsFactory();
    this.micrios.scheduleMacros(sendImage, this, {sendTo: json.BuId, content: json.MediaId}, callback);
};

/**
 * obtain contact's profile
 * @param json
 * @param callback(Error, Object<{headimgid, remark, nickname, sex, place, botid}>)
 */
proto.readProfile = function(json, callback){
    this.micrios = microsFactory();
    this.micrios.scheduleMacros(readProfile, this, json.BuId, callback);
};

/**
 * obtain all groups's info
 * @param callback
 */
proto.groupList = function(callback){
    this.micrios = microsFactory();
    this.micrios.scheduleMacros(spiderGroupListInfo, this, callback);
};

/**
 * obtain all contacts's info
 * @param callback
 */
proto.contactList = function(callback){
    var resultList = null;
    var self = this;
    var doneIndex = 0;
    self.micrios = microsFactory();
    self.micrios.scheduleMacros(spiderContactListInfo, self, done);
    function done(err, list){
        resultList = list;
        if(err){
            return callback(err);
        }
        reset.call(self, function(err){
            if(err){
                //TODO
            }
            for(let i=0,len=list.length; i<len; i++){
                let contact = list[i];
                //read his profile, and send a remark contact event
                if(contact.nickname.substr(0, 3) != 'bu-'){
                    self.micrios.scheduleMacros(readProfile, self, contact.nickname, eachCallback);
                }
                //clear the bu- remark, and send a remark contact event
                else{
                    self.micrios.scheduleMacros(reverseProfileAsync, self, contact.nickname, eachCallback);
                }
            }
        });
        function eachCallback(err, data){
            if (err) {
                console.log("[flow]: contact list, Failed to get contact list");
                console.warn(err);
            }else{
                self.emit('remarkcontact', {err: null, data: data});
            }
            checkDone(list);
        }
    }
    function checkDone(list){
        doneIndex++;
        if(doneIndex === list.length){
            callback(null);
        }
    }
};

/**
 * check if someone call me
 * @param callback
 */
proto.walkChatList = function(callback){
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

/**
 * check login or not
 * @param callback
 * @private
 */
proto._LoginOrNot = Promise.promisify(function(callback){
    var self = this;
    var spanEl = self.driver.findElement({css: '.nickname span'});
    self.driver.sleep(1000);
    spanEl.getText()
        .then(function(txt){
            if(txt != ''){
                callback(null, null);
            } else {
                callback(new webdriver.error.Error(myError.NO_LOGIN.code, myError.NO_LOGIN.msg))
            }
        })
});

/**
 * notify vn agent status is changed
 * @param status ?string=< starting, logging, mislogged, logged, exceptional, aborted, exited>
 */
proto.transition = function(status){
    var self = this;
    self.prevStatus = self.status;
    self.status = status;
    getBroker().then(function(broker){
        var msg = {
            NewStatus: self.status,
            OldStatus: self.prevStatus,
            CreateTime: (new Date()).getTime(),
            AgentId: self.id,
            NodeId: self.managerId
        };
        console.warn(msg);
        broker.agent.agentStatusChange(msg);
        broker.agent.botStatusChange(msg);
    })
};

/**
 * allow agent to login
 * @param callback
 * @returns {*}
 * @private
 */
proto.startWithCookies = function(callback){
    console.log("[flow]: Begin to start with cookies");
    var self = this;
    if(self.j.getCookies(settings.wxIndexUrl).length<=0){
        return callback(new Error('[flow]: Failed to start with cookies, cookies are lost'))
    }
    self.withDriver(null, {cookies: self.j.getCookies(settings.wxIndexUrl)});
    self.withNavigator(self.driver);
    self.driver.sleep(3000);
    self.driver.call(callback, null, null);
};

/**
 * polling watch the bot disconnect or not
 * @private
 */
proto._watchDisconnect = function(){
    var self = this;
    self._disConnectWatcher = setInterval(function(){
        self.driver.call(function(){
            var spanEl = self.driver.findElement({css: '.nickname span'});
            self.driver.sleep(200);
            return spanEl.getText()
        })
        .then(function(txt){
            if(txt == '' && _.arr.in(['logged', 'exceptional'], self.status)){
                clearInterval(self._disConnectWatcher);
                return webdriver.promise.rejected(new webdriver.error.Error(myError.DISCONNECT.code, myError.DISCONNECT.msg));
            }
        })
        .thenCatch(function(e){
            if(e.code === myError.DISCONNECT.code){
                throw e;
            }
            //nothing to do
        })
    }, 5000)
};

/**
 * trigger need login event directly, needn't to get page by driver
 * @private
 */
proto._loginDirectly = function(callback){
    var self = this;
    console.log("[flow]: Begin to login");
    self.transition(STATUS.LOGGING);
    self.driver.sleep(500);
    self.driver.call(function(){
        helper.needLogin(self, function(e){
            if(e){
                return callback(e)
            }
        });
        self.callCsToLogin = setInterval(function(){
            helper.needLogin(self, function(err){
                if(err){
                    return callback(err)
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
                        return callback(null);
                    }
                })
                .thenCatch(function(e){
                    console.error("[system]: Failed to wait for login");
                    return callback(e);
                })
        }, settings.waitForLoginGap);
    })
};

/**
 * allow agent to login
 * @param callback
 * @private
 */
proto._login = function(callback){
    var self = this;
    console.log("[flow]: Begin to login");
    self.transition(STATUS.LOGGING);
    self.withDriver(null, {cookies: self.j.getCookies(settings.wxIndexUrl)});
    self.withNavigator(self.driver);
    self.driver.sleep(500);
    self.driver.call(self._LoginOrNot, self)
        .then(function(){
            //cookies available
            callback(null);
        })
        .thenCatch(function(){
            //cookies become invalid
            console.warn('[flow]: cookie become invalid');
            self._loginDirectly(function(e){
                if(e){
                    console.error("[system]: Failed to login");
                    return callback(e);
                }
                callback(null);
            });
        });
};

/**
 * Extract cookies from web page then return them
 * @param callback function((Error, Array<{Cookies}>))
 */
proto.getCookies = function(callback){
    var self = this;
    getSnapshot.bind(self)(function(err, o){
        if(err){
            console.error(err);
            callback(err)
        }else{
            callback(null, o.j);
        }
    })
};

/**
 * obtain bot's snapshot of status
 * @param callback function(Error, Agent)
 */
proto.getSnapshotAsync = Promise.promisify(getSnapshot);
function getSnapshot(callback){
    var self = this;
    var fields = ['id', 'pid','status', 'prevStatus', 'managerId', 'initialOptions', 'sendTo', 'loggedIn'];
    var options = new webdriver.WebDriver.Options(self.driver);
    options.getCookies()
        .then(function(cookies){
            var o = _.objExclude(self, 'driver', 'callCsToLogin', 'waitForLogin', '_disConnectWatcher')
            _.objPick.apply(null, [o].concat(fields));
            o.j = cookies;
            callback(null, o)
        })
        .thenCatch(function(e){
            callback(e)
        })
}

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

proto.onFirstProfile = function(handler){
    var me = this;
    me.removeAllListeners('first-profile').on('first-profile', function(data){
        handler.call(me, data.err, data.data)
    });
};

proto.onNeedLogin = function(handler){
    var me = this;
    me.removeAllListeners('needLogin').on('needLogin', function(data){
        handler.call(me, data.err, data.data)
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

module.exports = function(worker){
    return new WechatAgent(worker)
};
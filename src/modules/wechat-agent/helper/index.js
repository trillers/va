var waitFor = require('../../util').waitFor;
var request = require('request');
var receiveMessageHandler = require('../funcs/receive-message');
var suggestFriendHandler = require('../funcs/friend-suggest-message');

var getLoginQr = exports.getLoginQr = function (wcBot, callback){
    var self = wcBot;
    console.info("[flow]: enter git login qr");
    waitFor(self.driver, {css: '.qrcode img'}, 50000)
        .then(function(){
            console.info("[flow]: wait ok qr img node ready");
            return self.driver.findElement({css: '.qrcode img'});
        })
        .then(function(img) {
            return img.getAttribute('src')
        })
        .then(function(src){
            return callback(null, src);
        })
        .thenCatch(function(e){
            console.error(e)
            console.error('[system]: Failed to get img attribute when client disconnect');
            return callback(e, null);
        });
                //.then(function(src){
                //    console.info("[flow]: src is " + src);
                //    var formData = {
                //        file: {
                //            value: request({url: src, jar: self.j, encoding: null}),
                //            options: {
                //                filename: 'xxx.jpg'
                //            }
                //        }
                //    };
                //    console.info('[flow]: file system server,s url is ' + fsServer);
                //    request.post({url: fsServer, formData: formData}, function(err, res, body) {
                //        if(err){
                //            console.error('[system]: Failed to upload qr img when client disconnect');
                //            console.error(err);
                //            return callback(err, null);
                //        }
                //        try{
                //            var json = JSON.parse(body);
                //        }catch(e){
                //            console.error("[system]: -Failed to get login qrcode -m JSON parse error");
                //            console.error(body);
                //            return callback(e, null);
                //        }
                //        if(json.err){
                //            return callback(json.err, null);
                //        }
                //        callback(null, json);
                //    });
                //})
        //})
        //.thenCatch(function(e){
        //    console.error('[system]: Failed to find img node when client disconnect');
        //    return callback(e, null);
        //})
};

var needLogin = exports.needLogin = function (bot, callback){
    var self = bot;
    getLoginQr(self, function(err, data){
        if(err){
            console.error('[flow]: Failed to get Qrcode that used to login');
            callback(err, null);
        }else{
            console.info("[flow]: get login qrcode successful the mediaUrl is [ " + data + " ]");
            self.emit('needLogin', {err: null, data:{mediaUrl: data, botid: self.id}});
            return callback(null, null);
        }
    })
};


var pollingDispatcher = exports.pollingDispatcher = function (self,input){
    var handlers = {
        '朋友推荐消息': suggestFriendHandler,
        'Recommend' : suggestFriendHandler,
        'defaultHandler': (function(input){
            self.sendTo = input;
            return receiveMessageHandler;
        })(input)
    };
    return handlers[input] || handlers['defaultHandler'];
};
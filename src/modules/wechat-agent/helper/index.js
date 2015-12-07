var waitFor = require('../../util').waitFor;
var request = require('request');
var receiveMessageHandler = require('../funcs/receive-message');
var suggestFriendHandler = require('../funcs/friend-suggest-message');

exports.getLoginQr = function getLoginQr(wcBot, callback){
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
};

exports.needLogin = function needLogin(wcBot, callback){
    var self = wcBot;
    getLoginQr(self, function(err, data){
        if(err){
            console.error('[flow]: Failed to get Qrcode that used to login');
            callback(err, null);
        }else{
            console.info("[flow]: get login qrcode successful the media_id is [ " + data.media_id + " ]");
            self._transition(STATUS.LOGGING);
            self.emit('needLogin', {err: null, data:{wx_media_id: data.wx_media_id, media_id: data.media_id, botid: self.id}});
            return callback(null, null);
        }
    })
};


exports.pollingDispatcher = function pollingDispatcher(self,input){
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
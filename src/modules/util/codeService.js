var Promise = require('bluebird');
var Service = {};
//var idGen = require('../app/id');
Service.fetch = function(){
    //return 'bu-' + idGen.next('WechatBotUser').toId();
};
Service = Promise.promisifyAll(Service);
module.exports = Service;
var cluster = require('cluster');
var path = require('path');

cluster.setupMaster({
    exec: path.join(__dirname, '../modules/wechat-agent/wechat-agent-builder.js'),
    args: ['--harmony']
});
var workerFactory = {};

workerFactory.getProcess = function(){
    var worker = cluster.fork();
    return worker;
};
module.exports = workerFactory;

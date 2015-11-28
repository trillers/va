var cluster = require('cluster');
var path = require('path');
var numCPUs = require('os').cpus.length;
var wechatManagerFactory = require('../modules/wechat-manager/wechat-manager');
var net = require('net');
var managerSettings = require('../modules/wechat-manager/wechat-manager-settings');
var app = require('./Application')();

app.registerService('rabbitMQ');

//init cluster
cluster.setupMaster({
    exec: path.join(__dirname, '../modules/wechat-agent/wechat-agent-builder.js'),
    args: ['--harmony']
});

//init broker
require('../modules/wechat-broker')(app);

//handle uncaughtException to protect process
process.on('uncaughtException', function(err){ console.error(err); });

app.start(callback);

//app is startup
function callback(){
    var broker = require('../modules/wechat-broker')(app);

    //create a master process, connection never end
    var server = net.createServer(function(socket) {
        console.info('[system]: system is startup');
    });
    server.listen(3000);

    //build wechat manager
    wechatManager = wechatManagerFactory({
        id: 'test',
        payloadNum: numCPUs
    });

    //continue to heartbeat
    setInterval(function(){
        broker.brokerManager.heartbeat({bid: wechatManager.id, status: wechatManager.status});
    }, managerSettings);

    wechatManager.spawnWorker('test');
}


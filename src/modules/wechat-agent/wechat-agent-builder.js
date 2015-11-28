var net = require('net');
var agentFactory = require('./wechat-agent');
var server = net.createServer(function(socket) {});
var worker = null;
var settings = require('./wechat-agent-settings');
var brokerAgent = require('../wechat-broker').brokerAgent;

//connections never end
server.listen(8000);

//def ipc channel
var ipcChannel = {};

ipcChannel['start'] = startHandler;
ipcChannel['stop'] = stopHandler;

process.on('message', function(cmd) {
    ipcChannel[cmd.method].apply(null, [cmd.args])
});

//continue to heartbeat
setInterval(function(){
    brokerAgent.heartbeat({
        status: worker.getStatus(),
        pid: worker.pid,
        agentId: worker.id,
        managerId: worker.managerId
    });
}, settings.heartbeatGap);

//def how to handle event from ipc
function startHandler(workerJson){
    worker = agentFactory(workerJson);
    worker.start();
}

function stopHandler(){

}
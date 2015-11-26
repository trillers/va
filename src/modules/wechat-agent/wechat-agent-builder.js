/**
 * worker process
 */
var net = require('net');
var agentFactory = require('./wechat-agent');
var server = net.createServer(function(socket) {});
var worker = null;
var exChannels = require('vcr').channels;
// connections never end
server.listen(8000);

var ipcChannel = {};

ipcChannel[exChannels.agentHeartBeatResponse] = heartbeatRequestHandler;
ipcChannel['start'] = startHandler;
ipcChannel['start'] = startHandler;

process.on('message', function(cmd) {
    ipcChannel[cmd.method].apply(null, [cmd.args])
});

function heartbeatRequestHandler(){
    process.send({
        method: exChannels.agentHeartBeatResponse,
        args: {
            status: worker.getStatus(),
            pid: worker.pid,
            agentId: worker.id,
            managerId: worker.managerId
        }
    })
}

function startHandler(workerJson){
    worker = agentFactory(workerJson);
    worker.start();
}
function stopHandler(){

}
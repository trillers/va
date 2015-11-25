/**
 * worker process
 */
var net = require('net');
var agentFactory = require('./wechat-agent');
var server = net.createServer(function(socket) {});
var worker = null;
// connections never end
server.listen(8000);

var cmdMap = {
    'start': startHandler,
    'stop': stopHandler,
    'heartbeat:request': heartbeatRequestHandler
};

process.on('message', function(cmd) {
    console.log(cmdMap[cmd.method])
    cmdMap[cmd.method].apply(null, [cmd.args])
});
function heartbeatRequestHandler(){
    process.send({
        method: 'heartbeat:response',
        args: {
            status: worker.getStatus(),
            pid: worker.pid,
            agentId: worker.id
        }
    })
}

function startHandler(workerJson){
    worker = agentFactory(workerJson);
    worker.start();
}
function stopHandler(){

}
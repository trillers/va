/**
 * worker process
 */
var net = require('net');
var agentFactory = require('./wechat-agent');
var server = net.createServer(function(socket) {});
// connections never end
server.listen(8000);

var cmdMap = {
    'start': startHandler,

};

process.on('message', function(cmd) {
    cmdMap[cmd.method].apply(null, [cmd.args])
});
function startHandler(workerJson){
    var worker = agentFactory(workerJson);
    worker.start();
}
function stopHandler(){

}
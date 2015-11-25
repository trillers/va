var cluster = require('cluster');
var vc = require('vc');
/**
 * create a wechat agent manager that maintain a master process to control
 * the workers
 * @constructor
 * @param manager
 * status [enum: 'running', 'stopped', 'abnormalStopped']
 * payloadNum [num]
 */
function WechatManager(manager){
    this.status = manager.status || 'running';
    this.workers = {};
    this.payloadNum = manager.payloadNum;
}

var proto = WechatManager.prototype;

proto.init = function(){
    //compose vc channels
    Object.keys(cluster.workers).forEach(function(id){
        cluster.workers[id].removeAllListeners('message').on('message', function(msg){
           // vc.publish('', {})
        });
    })
};

proto.start = function(id, callback){
    if(this.getWorkerById(id)){
        return callback(new Error('the worker is already started'));
    }
    if(this.getAllWorkers().length >= this.payloadNum){
        return callback(new Error('the manager\'s payload num has reached limit'));
    }
    var worker = cluster.fork();
    this.init();
    this.workers[worker.process.pid] = worker;
    var json = {
        pid: worker.process.pid,
        id: id
    };
    worker.on('online', function(){
        var cmd = {
            method: 'start',
            args: json
        };
        worker.send(cmd);
    });
};

proto.getWorkerById = function(id){
    return this.workers[id] || null;
};

proto.stop = function(id, callback){
    var worker = this.getWorkerById(id);
    if(!worker){
        return callback(new Error('no such worker [id]=' + id));
    }
    worker.stop(callback);
};

proto.restart = function(id, callback){
    var worker = this.getWorkerById(id);
    if(!worker){
        return callback(new Error('no such worker [id]=' + id));
    }
    worker.restart(callback);
};

proto.getWorkerStatus = function(id){
    var worker = this.getWorkerById(id);
    if(worker) {
        return worker.status;
    }
};

proto.isAlive = function(id){
    var worker = this.getWorkerById(id);
    if(!worker){
        throw new Error('no such worker [id]=' + id);
    }
    return worker.getStatus() === 'start';
};

proto.getAllWorkers = function(){
    return this.workers;
};

proto.heartbeat = function(){
    var self = this;
    for(var pid in self.workers){
        self.workers[pid].send({
            method: 'heartbeat:request'
        });
    }
};

module.exports = function(json){
    var manager = {
        payloadNum: json.payloadNum
    };
    return new WechatManager(manager);
};





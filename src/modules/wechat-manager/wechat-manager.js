var cluster = require('cluster');

/**
 * create a wechat agent manager that maintain a master process to control
 * the workers
 * @constructor
 * @param manager
 * status [enum: 'running', 'stopped', 'abnormalStopped']
 * payloadNum [num]
 */
function WechatManager(manager){
    this.id = manager.id;
    this.status = manager.status || 'running';
    this.workers = {};
    this.payloadNum = manager.payloadNum;
}

var proto = WechatManager.prototype;

/**
 * init wechat manager, bind message events on workers
 */
proto.init = function(){
    var self = this;
    Object.keys(cluster.workers).forEach(function(id){
        cluster.workers[id].removeAllListeners('message').on('message', function(cmd){
            //TODO internal channels
            var invChannels = {};
            //message in cluster
            if(cmd.method in invChannels){
                //TODO
            }
            else{
                console.warn('no such method, method\'s name is ' + cmd.method);
            }
        });
    });
};

/**
 * start a process and spawn a worker
 * @param id worker_id(String)
 * @param callback
 * @returns {*}
 */
proto.spawnWorker = function(id, callback){
    var self = this;
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
        id: id,
        managerId: self.id
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

module.exports = function(json){
    var manager = {
        payloadNum: json.payloadNum,
        id: json.id
    };
    return new WechatManager(manager);
};





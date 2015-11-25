var workerFactory = require('../../app/worker-factory');
/**
 * create a wechat agent manager that maintain a master process to control
 * the workers
 * @constructor
 */
function WechatManager(manager){
    this.workers = [];
    this.payloadNum = manager.payloadNum;
}

var proto = WechatManager.prototype;

proto.start = function(id, callback){
    if(this.getWorkerById(id)){
        return callback(new Error('the worker is already started'));
    }
    if(this.getAllWorkers().length >= this.payloadNum){
        return callback(new Error('the manager\'s payload num has reached limit'));
    }
    var worker = workerFactory.getProcess();
    var json = {
        pid: worker.process.pid
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
        payloadNum: json.payloadNum
    };
    return new WechatManager(manager);
};





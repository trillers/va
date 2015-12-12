var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;
var _ = require('../util/myutil');
/**
 * create a wechat agent manager that maintain a master process to control
 * the workers
 * @constructor
 * @param manager
 * status [enum: 'running', 'stopped', 'interrupted']
 * exceptedAgentSum number
 */
function WechatManager(manager){
    this.id = manager.id;
    this.status = manager.status || 'running';
    this.workers = {};
    this.broker = null;
    this.exceptedAgentSum = manager.exceptedAgentSum;
    this.emitter = new EventEmitter();
    this.init();
}

var proto = WechatManager.prototype;

/**
 * init wechat manager, bind message events on workers
 */
proto.init = function(){
    var self = this;
    //bind workers event listener
    Object.keys(cluster.workers).forEach(function(id){
        cluster.workers[id].removeAllListeners('message').on('message', self._cmdHandler.bind(self));
    });
};

/**
 * start a process and spawn a worker
 * @param agent              Agent
 * @param opt_reborn_json    if provided, type of operation will be restart
 * @param opt_cb Function
 * @returns                  {*}
 */
proto.spawnWorker = function(agent, opt_reborn_json, opt_cb){
    var callback = opt_cb || function(){};
    if(typeof opt_reborn_json === 'function'){
        callback = opt_reborn_json;
        opt_reborn_json = null
    }
    var self = this;
    var id = agent.id;
    if(this.getWorkerById(id)){
        console.warn('Failed to start agent, it is already started, [id]=' + id);
        return;
    }
    if(this.getAllWorkers().length >= this.exceptedAgentSum){
        console.error('Failed to start agent, the node\'s payload is already limited');
        return;
    }
    var worker = cluster.fork();
    var entity = {
        pid: worker.process.pid,
        id: id,
        managerId: self.id
    };
    _.mixinLazy(entity, agent);
    worker['AgentId'] = id;
    this.workers[worker.process.pid] = worker;
    this._initWorker(worker, entity, opt_reborn_json || _.objPick(agent, 'intention', 'mode', 'nickname', 'sex', 'region'));
    callback();
};

/**
 * @param worker             ChildProcess
 *                           cp for agent
 * @param entity             Object
 * @param opt                Object<{intent:string, mode:string, Nickname:string, Sex:number, Region:string}>
 *                           addition info
 * @private
 */
proto._initWorker = function(worker, entity, opt){
    var self = this;
    worker.on('message', self._cmdHandler.bind(self));
    worker.on('online', function(){
        var cmd = {
            method: 'start',
            args: {
                workerJson: entity,
                options:{
                    intention: opt.intention || "",
                    mode: opt.mode || "",
                    nickname:opt.nickname || "",
                    sex: opt.sex || "",
                    region: opt.region || ""
                }
            }
        };
        worker.send(cmd);
    });
    worker.on('disconnect', function(pid){
        delete self.workers[pid];
        self.broker.statusChange({
            NodeId: self.id,
            ExceptedAgentSum: self.exceptedAgentSum,
            ActualAgentSum: self.getAllWorkers().length
        })
    });
    worker.on('exit', function(code, signal){
        if( signal ) {
            console.log("worker was killed by signal: "+signal);
        } else if( code !== 0 ) {
            console.log("worker exited with error code: "+code);
        } else {
            console.log("worker exit success!");
        }
        delete self.workers[worker.process.pid];
        self.broker.statusChange({
            NodeId: self.id,
            ExceptedAgentSum: self.exceptedAgentSum,
            ActualAgentSum: self.getAllWorkers().length || 0
        })
    });
};

/**
 * @param id string AgentId
 * @returns {*}
 */
proto.getWorkerById = function(id){
    var result = null;
    if(this.workers && !_.obj.isEmpty(this.workers)){
        _.mapToArr(this.workers).forEach(function(worker){
            worker.AgentId == id && (result = worker)
        });
    }
    return result;
};

/**
 * @param id string AgentId
 * @param callback Function
 */
proto.stop = function(id, callback){
    var worker = this.getWorkerById(id);
    if(!worker){
        console.warn('Failed to stop agent, no such agent is started, [id]=' + id);
    }
    try{
        worker.send({method: 'stop'});
        worker.on('exit', stopHandler);
    }
    catch(e){
        console.warn('Failed to stop agent, agent process is already exit')
    }
    function stopHandler(){
        console.log('Succeed to stop the agent, [id]=' + worker.AgentId);
        worker.removeListener('snapshot', stopHandler);
        callback && callback();
    }
};

/**
 * @param id string AgentId
 */
proto.restart = function(id){
    var self = this;
    var worker = this.getWorkerById(id);
    if(!worker){
        console.warn('Failed to restart agent, no such agent is started, [id]=' + id);
        return;
    }
    worker.send({
        method: 'snapshot'
    });
    self.emitter.on('snapshot', snapshotHandler);
    function snapshotHandler(args){
        console.log('Succeed to snapshot the agent, [id]=' + args.agent.id);
        if(worker.AgentId === args.agent.id){
            self.emitter.removeListener('snapshot', snapshotHandler);
            self.stop(id, function(){
                self.spawnWorker(args.agent, args.opts);
            });
        }
    }
};

/**
 * @param id AgentId
 * @returns string
 */
proto.getWorkerStatus = function(id){
    var worker = this.getWorkerById(id);
    if(worker) {
        return worker.status;
    }
};

/**
 * @returns Object<{ChildProcess|*}>
 */
proto.getAllWorkers = function(){
    return this.workers;
};

/**
 * @param cmd Object<{method:string, args:{*}}>
 * @private
 */
proto._cmdHandler = function(cmd){
    var self = this;
    //TODO internal channels
    var invChannels = {
        snapshot: 'snapshot'
    };
    //message in cluster
    if(cmd.method in invChannels){
        self.emitter.emit(cmd.method, cmd.args);
    }
    else{
        console.warn('no such method, method\'s name is ' + cmd.method);
    }
};


module.exports = function(json){
    var manager = {
        exceptedAgentSum: json.exceptedAgentSum,
        id: json.id
    };
    return new WechatManager(manager);
};





var net = require('net');
var agentFactory = require('./wechat-agent');
var server = net.createServer(function(socket) {});
var worker = {};
var settings = require('./wechat-agent-settings');
var getBroker = require('../wechat-broker');
var MYERROR = require('./settings/myerror');
var CONST = require('vc').enum;
var STATUS = require('./settings/constant').STATUS;
var co = require('co');
var protectorBuilder = require('./wechat-agent-protector');
var _ =require('../util/myutil');

//connections never end
server.listen(8000);

//def ipc channel
var ipcChannel = {};

ipcChannel['start'] = startHandler;
ipcChannel['stop'] = stopHandler;
ipcChannel['snapshot'] = snapshotHandler;

process.on('message', function(cmd) {
    co(function*(){
        yield ipcChannel[cmd.method].apply(null, [cmd.args]);
    })
});
//process protector
process.on('uncaughtException', noop);
function noop(e){console.error(e)}

//def how to handle event from ipc
function* startHandler(args){
    try {
        worker = agentFactory(args.workerJson);
        process.removeListener('uncaughtException', noop);
        process.on('uncaughtException', protectorBuilder(worker));
        var actionsMap = {
            //one way
            'send-txt': {
                name: 'sendText',
                type: 'ow'
            },
            'send-img': {
                name: 'sendImage',
                type: 'ow'
            },
            'polling-list': {
                name: 'walkChatList',
                type: 'ow'
            },
            'sync-contacts': {
                name: 'contactList',
                type: 'ow'
            },
            //request/reply
            'profile-request': {
                name: 'readProfile',
                type: 'rr'
            },
            'sync-groups': {
                name: 'groupList',
                type: 'rr'
            },
            'cookies-request': {
                name: 'getCookies',
                type: 'rr'
            }
        };

        var broker = yield getBroker();

        setInterval(function () {
            broker.brokerAgent.heartbeat({
                CreateTime: (new Date()).getTime(),
                AgentStatus: worker.status,
                PId: worker.pid,
                AgentId: worker.id,
                NodeId: worker.managerId
            });
        }, settings.heartbeatGap);

        worker.onNeedLogin(function (err, data) {
            if (!err) {
                var msg = {
                    CreateTime: (new Date()).getTime(),
                    Action: 'need-login',
                    AgentId: data.botid,
                    MediaUrl: data.mediaUrl
                };
                console.log(msg);
                broker.brokerAgent.actionIn(msg);
            }
        });

        worker.onRemarkContact(function (err, data) {
            if (!err) {
                var msg = {
                    CreateTime: (new Date()).getTime(),
                    Action: 'remark-contact',
                    AgentId: worker.id,
                    Contact: data
                };
                console.info("send vk a first contact event********");
                console.info(msg);
                broker.brokerAgent.actionIn(msg);
            }
        });

        worker.onFirstProfile(function (err, data) {
            if (!err) {
                var msg = {
                    CreateTime: (new Date()).getTime(),
                    Action: 'first-profile',
                    AgentId: worker.id,
                    Profile: data
                };
                console.info("send vk a first profile event********");
                console.info(msg);
                broker.brokerAgent.actionIn(msg);
            }
        });

        worker.onLogin(function (err, data) {
            if (!err) {
                var msg = {
                    CreateTime: (new Date()).getTime(),
                    Action: 'login',
                    AgentId: data.botid
                };
                console.log(msg);
                broker.brokerAgent.actionIn(msg);
            }
        });

        worker.onReceive(function (err, msgArr) {
            if (!err) {
                console.error(err);
                return;
            }
            msgArr.forEach(function (msg) {
                broker.brokerAgent.actionIn(msg);
            })
        });

        worker.start(args.options, function (err) {
            if (err) {
                console.error("[system]: Failed to start worker id=" + args.workerJson.id);
                console.error(err);
                err && err.code && fatalErrFilter(err)
            }
            //TODO begin to polling
            console.log("[system]: agent is logged in, begin to polling id=" + args.workerJson.id);
            broker.brokerAgent.init(worker.id);

            broker.brokerAgent.onActionOut(function (err, data, msg) {
                if(_.arr.in([STATUS.ABORTED, STATUS.EXITED], worker.status)){
                    return console.warn('[system]: control flow is already destroyed');
                }
                var fn = worker[actionsMap[data.Action].name];
                var type = actionsMap[data.Action].type;
                var len = fn.length;
                if (len > 1) {
                    fn.call(worker, data, done)
                } else {
                    fn.call(worker, done)
                }
                function done(err, json) {
                    if (err) {
                        err && err.code && fatalErrFilter(err);
                        //status change
                        worker.transition(STATUS.EXCEPTIONAL);
                    }
                    data.Data = json;
                    if (type === 'rr') {
                        broker.brokerAgent.actionIn(data);
                    }
                    broker.brokerAgent.finish(msg);
                    broker.brokerAgent.actionFeedback({
                        CreateTime: (new Date()).getTime(),
                        Action: data.Action,
                        AgentId: data.AgentId,
                        Took: (new Date()).getTime() - data.CreateTime,
                        Code: 200,
                        Decs: ''
                    });
                }
            }, worker.id);

            broker.brokerAgent.commandFeedback({
                CreateTime: (new Date()).getTime(),
                Command: CONST.NODE.COMMAND.START,
                AgentId: worker.id,
                Took: 0,
                Code: CONST.STATUS_CODE.SUCCESS,
                Desc: ''
            });
        });
    }catch (e){
        console.error(e)
    }
}

function* stopHandler(){
    try{
        yield worker.stop();
        worker.transition(STATUS.EXITED);
        yield new Promise(function(resolve, reject){
            setTimeout(function(){
                process.exit();
                resolve();
            }, 2000)
        })
    }
    catch(e){
        console.log(e.message);
        e && e.code && fatalErrFilter(e);
    }
}

function* snapshotHandler(){
    var agent = yield worker.getSnapshot();
    process.send({
        method: 'snapshot',
        args: {
            agent: agent,
            opts: agent.initialOptions
        }
    })
}

//Helpers
function fatalErrFilter(err) {
    worker.transition(STATUS.ABORTED);
    Object.keys(MYERROR)
        .filter(function(currErr){
            return MYERROR[currErr].level == 3
        })
        .forEach(function(key){
            if(MYERROR[key].code == err.code){
                throw err;
            }
        });
}
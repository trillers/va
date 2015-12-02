var brokerFactory = require('vc');
var settings = require('base-settings');
var amqp = require('amqplib');
var rbqUri = 'amqp://' + settings.rabbitmq.username + ':' + settings.rabbitmq.password + '@' + settings.rabbitmq.host + ':' + settings.rabbitmq.port + '/' + settings.rabbitmq.vhost;

var assert = require('chai').assert;

describe('vm-va', function () {
    describe('#managerHeartbeat', function(){
        var nodeManagerBroker = "";
        var broker = null;
        before(function (done) {
            var open = amqp.connect(rbqUri);
            brokerFactory.create(open, {nm: true})
                .then(function (brokerOrigin) {
                    nodeManagerBroker = brokerOrigin.getNodeManager();
                    broker = brokerOrigin;
                    done();
                })
        });
        it('succeed', function(done){
            nodeManagerBroker.onAgentManagerHeartbeat(function (err, data) {
                console.log(data);
                assert.ok(!err);
                assert.equal(data.NodeId, 'test');
                done()
            });
        });
        after(function(done){
            broker.close();
            done();
        })
    });

    describe('#agentHeartbeat', function(){
        var nodeManagerBroker = "";
        var broker = null;
        before(function (done) {
            var open = amqp.connect(rbqUri);
            brokerFactory.create(open, {nm: true})
                .then(function (brokerOrigin) {
                    nodeManagerBroker = brokerOrigin.getNodeManager();
                    broker = brokerOrigin;
                    nodeManagerBroker.startRequest({
                        NodeId: 'test',
                        AgentId: 'agent1'
                    });
                    done();
                })
        });
        it('succeed', function(done){
            nodeManagerBroker.onAgentHeartbeat(function (err, data) {
                console.log(data);
                assert.ok(!err);
                assert.equal(data.NodeId, 'test');
                assert.equal(data.AgentId, 'agent1');
                done()
            });
        });
        after(function(done){
            broker.close();
            done();
        })
    });

    describe('#statusRequest', function(){
        var nodeManagerBroker = "";
        var broker = null;
        before(function (done) {
            var open = amqp.connect(rbqUri);
            brokerFactory.create(open, {nm: true})
                .then(function (brokerOrigin) {
                    nodeManagerBroker = brokerOrigin.getNodeManager();
                    broker = brokerOrigin;
                    done();
                })
        });
        it('succeed', function(done){
            nodeManagerBroker.onAgentManagerStatusResponse(function (err, data) {
                console.log(data);
                assert.ok(!err);
                assert.equal(data.NodeId, 'test');
                done()
            });
            nodeManagerBroker.agentManagerStatusRequest({
                NodeId: 'test'
            });
        });
        after(function(done){
            broker.close();
            done();
        })
    });

    describe('##startRequest, #statusChange', function(){
        var nodeManagerBroker = "";
        var broker = null;
        before(function (done) {
            var open = amqp.connect(rbqUri);
            brokerFactory.create(open, {nm: true})
                .then(function (brokerOrigin) {
                    nodeManagerBroker = brokerOrigin.getNodeManager();
                    broker = brokerOrigin;
                    done();
                })
        });
        it('succeed', function(done){
            nodeManagerBroker.onAgentStatusChange(function(err, data){
                console.log(data);
                assert.ok(!err);
                assert.equal(data.AgentId, 'agent1');
                assert.equal(data.NewStatus, 'logging');
                done();
            });
            nodeManagerBroker.startRequest({
                NodeId: 'test',
                AgentId: 'agent1'
            });
        })
        after(function(done){
            broker.close();
            done();
        })
    });
    describe('#requestProfile', function(){
        var nodeManagerBroker = "";
        var broker = null;
        before(function (done) {
            var open = amqp.connect(rbqUri);
            brokerFactory.create(open, {nm: true})
                .then(function (brokerOrigin) {
                    nodeManagerBroker = brokerOrigin.getNodeManager();
                    broker = brokerOrigin;
                    done();
                })
        });
        it('succeed', function(done){
            nodeManagerBroker.onProfileResponse(function(err, data){
                console.log(data);
                assert.ok(!err);
                done();
            });
            nodeManagerBroker.profileRequest({
                NodeId: 'test',
                AgentId: 'agent1'
            });
        });
        after(function(done){
            broker.close();
            done();
        })
    });
});
var brokerFactory = require('vc');
var client = {};
var broker = brokerFactory.create(client);

exports.brokerAgent = broker.getAgent();

exports.brokerManager = broker.getManager();

exports.brokerBot = broker.getBot();
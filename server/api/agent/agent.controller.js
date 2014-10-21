'use strict';

var agentService = require('../../service/agent.service.js');

/**
 * Get list of agents
 * GET /agents
 *
 * @param req
 * @param res
 */
exports.index = function (req, res) {
    agentService.findAgents()
        .then(function (agents) {
            return res.json(200, agents);
        }, function (err) {
            return handleError(res, err);
        });
};

/**
 * Get a single agent
 * GET /agents/:id
 *
 * @param req
 * @param res
 */
exports.show = function (req, res) {
    var agentId = req.params.id;
    agentService.findAgentById(agentId)
        .then(function (agent) {
            if (!agent) {
                return res.send(404);
            }
            return res.json(agent);
        }, function (err) {
            return handleError(res, err);
        });
};

/**
 * Creates a new agent in the DB.
 * POST /agents
 *
 * Example:
 * {
 *   "id": "00:0a:95:9d:68:16",
 *   "name": "Agent 1",
 *   "location": "entry way",
 *   "capabilities": ["audio"],
 *   "approvedStatus": "Pending",
 *   "operationalStatus": "Success",
 *   "lastSeenBy": "77876565",
 *   "lastSeen": "2014-10-06T15:56:43.793Z",
 *   "registered": "2014-10-01T15:56:43.793Z
 * }
 *
 * @param req
 * @param res
 */
exports.create = function (req, res) {
    var agent = req.body;

    agentService.findAgentByCustomId(agent.id)
    .then(function (agentfound) {
        if (!agentfound){
            console.log("agent unfound, creating");
            agentService.createAgent(agent).then(function (agent) {
                res.json(201, agent);
            }).catch(function (err) {
                console.log("error creating unfound" + error);
//                handleError(res, err);
                res.json(400, {
                    message: "unable to create new agent",
                    error: err
                })
            });
        }else {
            agentfound.location = agent.location;
            agentfound.name = agent.name;
            agentfound.id = agent.id;
            agentService.updateAgent(agentfound)
                .then(function (agent) {
                    res.json(200, agent);
                }).catch(function (err) {
                    res.json(400, {
                        message: "unable to update found agent",
                        error: err
                    })
                })
        }
    }).catch(function(error){
        console.log("fail")
    })
};

/**
 * Updates an existing agent in the DB.
 * PUT /agents/:id
 *
 * @param req
 * @param res
 */
exports.update = function (req, res) {
    var agent = req.body;
    agentService.updateAgent(agent)
        .then(function (agent) {
            if (!agent) {
                return res.send(404);
            }
            return res.json(200, agent);
        }, function (err) {
            return handleError(res, err);
        });
};

/**
 * Deletes an agent from the DB.
 * DELETE /agents/:id
 *
 * @param req
 * @param res
 */
exports.destroy = function (req, res) {
    var agentId = req.params.id;
    agentService.deleteAgent(agentId)
        .then(function () {
            return res.send(204);
        }, function (err) {
            return handleError(res, err);
        });
};

function handleError(res, err) {
    return res.send(500, err);
}
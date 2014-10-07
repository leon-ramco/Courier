'use strict';

var Agent = require('../../models/agent.model.js');
var config = require('../../config/environment');
var logger = require('../../utils/logger.js');
var beaconEventService = require('../../service/beacon-event.service.js');
var beaconDetectionService = require('../../service/beacon-detection.service.js');


/**
 * POST /api/beaconevents
 *
 * {
        agentId: "540756a9a36b267c0a5965dd",
        detections: [
            {
                time: 1412610581244, // ms since epoch
                uuid: "1000000000000000",
                major: 1,
                minor: 1,
                tx: -65,
                rssi: -75,
                distance: 1.6
            }
        ]
    }

    Sends list of saved beacon detections as response body.

    [
        {
            "_id" : "5431902254596fdb1742756e",
            "time" : 1412610581244 // ms
            "uuid" : "1000000000000000",
            "major" : 1,
            "minor" : 1,
            "tx" : -65,
            "rssi" : -75,
            "distance" : 1.6,
            "agentId" : "5431902254596fdb1742756d"
        },
        ...
    ]

 */
exports.create = function (req, res) {

    var beaconEvent = req.body;

    // logging
    var logLine = JSON.stringify(beaconEvent);
    console.log(logLine);
    if (config.log.beaconDetections === true) {
        //[Lindsay Thurmond:10/2/14] TODO: log as individual beacon detections instead?
        logger.detections(logLine);
    }

    //[Lindsay Thurmond:10/5/14] TODO: update to use promises instead

    // if the agent is specified, update with latest detection information
    beaconEventService.updateAgentWithMostRecentPing(beaconEvent, function(err, agent) {
        if (err || !agent) {
            logger.log('error', err);
        }
    });

    var detections = beaconEventService.convertEventToDetections(beaconEvent);

    beaconDetectionService.createDetections(detections, function(err, savedDetections) {
        if (err) {
            return res.send(500, err);
        }
        if (!savedDetections) {
            return res.send(404);
        }
        console.log(savedDetections);
        return res.json(200, savedDetections);
    }, true);

}
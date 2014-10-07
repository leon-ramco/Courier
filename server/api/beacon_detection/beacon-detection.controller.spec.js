'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var beaconDetectionService = require('../../service/beacon-detection.service.js');
var when = require('when');

var sampleDetections = [
    {
        time: Date.now(),
        uuid: '787654ffrgy',
        major: 1,
        minor: 1,
        tx: -65,
        rssi: -75,
        distance: 3.7,
        agentId: '98asd7fa9s8d7fa'
    },
    {
        time: Date.now(),
        uuid: '787654ffrgy',
        major: 1,
        minor: 1,
        tx: -61,
        rssi: -72,
        distance: 3.1,
        agentId: '98sd7f9asd87po'
    },
    {
        time: Date.now(),
        uuid: 'aufoiasufasiduf7',
        major: 1,
        minor: 1,
        tx: -68,
        rssi: -75,
        distance: 2.9,
        agentId: '98sd7f9asd87po'
    }
];

//[Lindsay Thurmond:10/7/14] TODO: cleanup promises
function createSampleBeaconDetection() {
    var beaconDetections = when.defer();
    beaconDetectionService.createDetections(sampleDetections, function (err, newDetections) {
        beaconDetections.resolve(newDetections);
    }, true);
    return beaconDetections.promise;
}

describe('Test /api/beacondetections API', function () {

    // make sure seed data is done loading
    beforeEach(function (done) {
        app.mongoReadyPromise.then(function () {
            done();
        });
    });

    beforeEach(function (done) {
        if (sampleDetections[0]._id) {
            done();
        } else {
            // clear all detections from db, then populate with sample data above
            beaconDetectionService.getDeleteAllDetectionsPromise()
                .then(createSampleBeaconDetection()
                    .then(function (newDetections) {
                        sampleDetections = newDetections;
                        done();
                    })
            );
        }
    });

    var AUTHORIZED_USERNAME = 'test@test.com';
    var AUTHORIZED_PASSWORD = 'test';

    var token;

    var beaconDetection = {
        time: Date.now(),
        uuid: '0000000',
        major: 11111,
        minor: 22222,
        tx: 3,
        rssi: 1,
        distance: 1.2
    };

    // ACCEPT BEACON DETECTION

    it('POST /api/beacondetections -> should respond with 401 unauthorized', function (done) {
        request(app)
            .post('/api/beacondetections')
            .send(beaconDetection)
            .expect(401, done);
    });

    it('GET /api/tokens -> should get a token for an authorized user', function (done) {
        request(app)
            .get('/api/tokens')
            .set('username', AUTHORIZED_USERNAME)
            .set('password', AUTHORIZED_PASSWORD)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.instanceof(Object);
                token = res.body.token;
                done();
            });
    });

    it('POST /api/beacondetections -> should create a single beacon detection', function (done) {
        request(app)
            .post('/api/beacondetections')
            .send(beaconDetection)
            .set('x-access-token', token)
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.body.should.be.instanceof(Object);
                res.body.should.have.property('_id');
                beaconDetection = res.body;
                done();
            });
    });

    // GET ALL DETECTIONS

    it('GET /api/beacondetections -> should respond with 401 unauthorized', function (done) {
        request(app)
            .get('/api/beacondetections')
            .expect(401, done);
    });

    it('GET /api/beacondetections -> should respond with JSON array of beacon detections', function (done) {
        request(app)
            .get('/api/beacondetections')
            .set('x-access-token', token)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                var detections = res.body;
                detections.should.be.instanceof(Array);
                detections.length.should.be.above(0);
                done();
            });
    });

    // GET FILTERED DETECTIONS

    it('GET /api/beacondetections?agentId=[value] -> should respond with array of detections filtered by agent Id', function (done) {
        request(app)
            .get('/api/beacondetections?agentId=' + sampleDetections[1].agentId)
            .set('x-access-token', token)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                var detections = res.body;
                detections.should.be.instanceof(Array);
                detections.should.have.lengthOf(2);
                detections[0].should.have.property('agentId', sampleDetections[1].agentId);
                done();
            });
    });

    it('GET /api/beacondetections?uuid=[value] -> should respond with array of detections filtered by uuid', function (done) {
        request(app)
            .get('/api/beacondetections?uuid=' + sampleDetections[1].uuid)
            .set('x-access-token', token)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                var detections = res.body;
                detections.should.be.instanceof(Array);
                detections.should.have.lengthOf(2);
                detections[0].should.have.property('uuid', sampleDetections[1].uuid);
                done();
            });
    });

    it('GET /api/beacondetections?uuid=[value] -> should respond with array of detections filtered by uuid', function (done) {
        request(app)
            .get('/api/beacondetections?uuid=' + sampleDetections[1].uuid + '&agentId=' + sampleDetections[1].agentId)
            .set('x-access-token', token)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) return done(err);
                var detections = res.body;
                detections.should.be.instanceof(Array);
                detections.should.have.lengthOf(1);
                detections[0].should.have.property('uuid', sampleDetections[1].uuid);
                detections[0].should.have.property('agentId', sampleDetections[1].agentId);
                done();
            });
    });

});
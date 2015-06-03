var assert= require('assert'),
    request = require('supertest'),
    app = require('../app');

describe('api', function() {

    describe('GET /analytics/charges', function() {
        it('return 200', function(done) {
            this.timeout(60000);
            request(app).get('/analytics/charges').expect(200, done);
        });
        it('return total sales', function(done) {
            this.timeout(60000);
            request(app).get('/analytics/charges?ops[]={"operation": "sum", "property": "amount"}').expect(200, done);
        });
        it('return number of transactions', function(done) {
            this.timeout(60000);
            request(app).get('/analytics/charges?ops[]={"operation": "count"}').expect(200, function(err, res) {
                if (err) return done(err);
                done();
            });
        });
        it('return average amount', function(done) {
            this.timeout(60000);
            request(app).get('/analytics/charges?ops[]={"operation": "avg", "property": "amount"}').expect(200, function(err, res) {
                if (err) return done(err);
                done();
            });
        });
        it('return chargebacks', function(done) {
            this.timeout(60000);
            request(app).get('/analytics/charges?ops[]={"operation": "count", "filters": [{"property": "status", "operator": "eq", "value": "chargeback"}]}').expect(200, function(err, res) {
                if (err) return done(err);
                done();
            });
        });
        it('return sales grouped by status', function(done) {
            this.timeout(60000);
            request(app).get('/analytics/charges?ops[]={"operation": "list", "groupBy": "status", "interval": "daily", "timeframe": "this_1_month"}').expect(200, function(err, res) {
                if (err) return done(err);
                done();
            });
        });
    });

});

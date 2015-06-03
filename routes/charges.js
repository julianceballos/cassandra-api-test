var express = require('express'),
    router = express.Router(),
    _ = require('underscore');

var operators = {
    'eq': '=',
    'gt': '>',
    'lt': '<',
    'gte': '=>',
    'lte': '<=',
    'ne': '!='
};

var buildQuery = function(op, opts) {
    var p = (opts.targetProperty || '*');
    if (op == 'count' && !opts.groupBy) {
        p = 'count(' + (opts.targetProperty || '*') + ')';
    }
    var q = 'select ' + p + ' from ' + opts.eventCollection;

    for (var i = 0; i < opts.filters.length; i++) {
        var opt = opts.filters[i];
        if (i == 0) {
            q += ' where ' + opt.property + ' ' + operators[opt.operator] + ' \'' + opt.value + '\'';
        } else {
            q += ' and ' + opt.property + ' ' + operators[opt.operator] + ' \'' + opt.value + '\'';
        }
    };

    //NOT SUPPORTED: q += opts.groupBy ? ' group by ' + opts.groupBy : '';

    q += ';';

    return q;
    
};

var Query = function(operation, params) {
    var _this = this;
    _this.operation = operation;
    _this.params = params;
    _this.execute = function(next) {
        var cassandra = require('cassandra-driver'),
            client = new cassandra.Client({ contactPoints: ['127.0.0.2', '127.0.0.3'], keyspace: 'dev'});

        var query = buildQuery(_this.operation, _this.params);
        client.execute(query, {prepare: true}, function(err, result) {
            if (_this.operation == 'sum') {
                var sum = _.reduce(result.rows, function(memo, item) {
                    return memo + parseFloat(item[_this.params.targetProperty]);
                }, 0);
                return next(err, sum);
            } else if (_this.operation == 'count') {
                if (_this.params.groupBy && _this.params.groupBy != '') {
                    var groups = _.groupBy(result.rows, function(item) {
                        console.log(item);
                        return item[_this.params.groupBy];
                    });
                    result = _.map(groups, function(list, key) {
                        var hash = {
                            result: list.length
                        };
                        hash[_this.params.groupBy] = key;
                        return hash;
                    });
                    console.log(result);
                    return next(err, result);
                } else {
                    return next(err, parseInt(result.rows[0].count));
                }
            } else if (_this.operation == 'average') {
                var sum = _.reduce(result.rows, function(memo, item) {
                    return memo + parseFloat(item[_this.params.targetProperty]);
                }, 0);
                return next(err, sum / result.rows.length);
            } else {
                if (_this.params.groupBy && _this.params.groupBy != '') {
                    var groups = _.groupBy(result.rows, function(item) {
                        return item[_this.params.groupBy];
                    });
                    result = _.map(groups, function(list, key) {
                        var hash = {
                            result: list
                        };
                        hash[_this.params.groupBy] = key;
                        return hash;
                    });
                    return next(err, {result: result});
                } else {
                    return next(err, result.rows);
                }
            }
        });
    }
    return _this;
};

var runQueries = function(queries, next) {
    var async = require('async');

    var results = [],
        error = null;

    var q = async.queue(function(task, fn) {
        task.execute(fn);
    });
    q.drain = function() {
        next(error, results);
    };
    q.push(queries, function(err, result) {
        if (err) {
            error = err;
        } else {
            if (queries.length == 1) {
                results = {
                    result: result
                };
            } else {
                results.push({
                    result: result
                });
            }
        }
    });
};

var ops = {
    sum: function(opts) {
        var options = {
            eventCollection: "charges",
            targetProperty: opts.property || '',
            groupBy: opts.groupBy || '',
            filters: opts.filters || []
        }
        return new Query('sum', options);
    },
    count: function(opts) {
        var options = {
            eventCollection: "charges",
            targetProperty: opts.property || '',
            groupBy: opts.groupBy || '',
            filters: opts.filters || []
        }
        return new Query('count', options);
    },
    avg: function(opts) {
        var options = {
            eventCollection: "charges",
            targetProperty: opts.property || '',
            groupBy: opts.groupBy || '',
            filters: opts.filters || []
        }
        return new Query('average', options);
    },
    list: function(opts) {
        var options = {
            eventCollection: "charges",
            targetProperty: opts.property || '',
            groupBy: opts.groupBy || '',
            filters: opts.filters || []
        }
        return new Query('list', options);
    }
};

router.get('/', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    var queries = [];
    if (req.query.ops) {
        for (var i = 0; i < req.query.ops.length; i++) {
            var data = JSON.parse(req.query.ops[i]);
            queries.push(ops[data.operation](data));
        }
    } else {
        queries.push(ops['list']({}));
    }

    runQueries(queries, function(err, result) {
        if (err) {
            return res.status(400).json({ message: 'Error running query' });
        } else {
            return res.json(result);
        }
    });

});

module.exports = router;

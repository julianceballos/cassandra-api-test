var cassandra = require('cassandra-driver'),
    client = new cassandra.Client({ contactPoints: ['127.0.0.2', '127.0.0.3'], keyspace: 'dev'});

var getRandomRange = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var randomStatus = function() {
    var status = ['paid', 'chargeback'];
    return status[getRandomRange(0, status.length - 1)];
};

var populate = function(counter) {
    var input = 
        "INSERT INTO charges(id, livemode, created_at, status, currency, description, reference_id, failure_code, failure_message, object, amount, payment_method, details)" +
        "VALUES ('523dd8f6aef87843860000" + counter + "'," +
            "false," +
            parseInt(1379784950 + counter * 60 * 60 * 24) + "," +
            "'" + randomStatus() + "'," +
            "'MXN'," +
            "'Stogies'," +
            "'9839-wolf_pack'," +
            "null," +
            "null," +
            "'charge'," +
            "20000," +
            "{" +
                "'payment_method': {" +
                    "object: 'card_payment'," +
                    "name: 'Thomas Logan'," +
                    "exp_month: '12'," +
                    "exp_year: '15'," +
                    "auth_code: '813038'," +
                    "last4: '1111'," +
                    "brand: 'visa'" +
                "}" +
            "}," +
            "{" +
                "'details': {" +
                    "name: 'Wolverine'," +
                    "phone: '403-342-0642'," +
                    "email: 'logan@x-men.org'," +
                    "date_of_birth: '1980-09-24'" +
                "}" +
            "}" +
        ");";
    client.execute(input, {prepare: true}, function(err, result) {
        console.log(err, result);
    });
}

for (var i = 0; i < 1000; i++) {
    populate(i);
}

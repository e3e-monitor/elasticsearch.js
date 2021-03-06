(function () {
module("Backend ElasticSearch - Wrapper");

var emptyQuery = function() {
  return {
    size: 100,
    from: 0,
    q: ''
  };
}

test("queryNormalize", function() { 
  var backend = new ES.Table();

  var in_ = emptyQuery();

  var out = backend._normalizeQuery(in_);
  var exp = {
    constant_score: {
      query: {
        match_all: {}
      }
    }
  };
  deepEqual(out, exp);

  var in_ = emptyQuery();
  var out = backend._normalizeQuery(in_);
  deepEqual(out, exp);

  var in_ = emptyQuery();
  in_.q = 'abc'
  var out = backend._normalizeQuery(in_);
  equal(out.constant_score.query.query_string.query, 'abc');

  // filters only
  var in_ = emptyQuery();
  in_.filters = [
    {
      type: 'term',
      field: 'xyz',
      term: 'XXX'
    }
  ]
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            term: {
              xyz: 'XXX'
            }
          }
        ]
      }
    }
  }
  deepEqual(out, exp);

  // filter and query string
  var in_ = emptyQuery();
  in_.q = 'abc'
  in_.filters = [
    {
      type: 'term',
      field: 'xyz',
      term: 'XXX'
    }
  ]
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            term: {
              xyz: "XXX"
            }
          }
        ]
      },
      query: {
        query_string: {
          query: "abc"
        }
      }
    }
  }
  deepEqual(out, exp);

  var in_ = emptyQuery();
  in_.filters = [
    {
      type: 'geo_distance',
      field: 'xyz',
      distance: 10,
      unit: 'km',
      point: {
        lon: 0,
        lat: 0
      }
    }
  ];
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            geo_distance: {
              distance: 10,
              unit: "km",
              xyz: {
                lat: 0,
                lon: 0
              }
            }
          }
        ]
      }
    }
  }
  deepEqual(out, exp);

  var in_ = emptyQuery();
  in_.filters = [
    {
      type: 'range',
      field: 'dt',
      from: '2013-08-19T00:00:00-07:00',
      to: '2013-08-19T08:00:00-07:00',
      include_lower: true,
      include_upper: false
    }
  ];
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            range: {
              dt : {
                from: '2013-08-19T00:00:00-07:00',
                to: '2013-08-19T08:00:00-07:00',
                include_lower: true,
                include_upper: false
              }
            }
          }
        ]
      }
    }
  };
  deepEqual(out, exp);

  var in_ = emptyQuery();
  in_.filters = [
    {
      type: 'terms',
      field: 'xyz',
      terms: [ 'one', 'two', 'three' ]
    }
  ];
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            terms: {
              xyz : [
                'one', 'two', 'three'
              ]
            }
          }
        ]
      }
    }
  };
  deepEqual(out, exp);

  var in_ = emptyQuery();
  in_.filters = [
    {
      type: 'type',
      value: 'message'
    }
  ];
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            type: {
              value: 'message'
            }
          }
        ]
      }
    }
  };
  deepEqual(out, exp);

  // exists
  var in_ = emptyQuery();
  in_.filters = [
    {
      type: 'exists',
      field: 'xyz'
    }
  ];
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            exists: {
              field: 'xyz'
            }
          }
        ]
      }
    }
  };
  deepEqual(out, exp);

  // missing
  var in_ = emptyQuery();
  in_.filters = [
    {
      type: 'missing',
      field: 'xyz'
    }
  ];
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            missing: {
              field: 'xyz'
            }
          }
        ]
      }
    }
  };
  deepEqual(out, exp);

  // not
  var in_ = emptyQuery();
  in_.filters = [
    {
      not: true,
      type: 'term',
      field: 'xyz',
      term: 'one'
    }
  ];
  var out = backend._normalizeQuery(in_);
  var exp = {
    filtered: {
      filter: {
        and: [
          {
            'not' : {
              term: {
                xyz: 'one'
              }
            }
          }
        ]
      }
    }
  };
  deepEqual(out, exp);

  // ids query 
  var in_ = emptyQuery();
  in_.ids = [ 1, 2, 3, 4 ];
  var out = backend._normalizeQuery(in_);
  var exp = {
    constant_score: {
      query : {
        ids : {
          values : [ 1, 2, 3, 4 ]
        }
      }
    }
  }
  deepEqual(out, exp);
}
);

var mapping_data = {
  "note": {
    "properties": {
      "_created": {
        "format": "dateOptionalTime", 
        "type": "date"
      }, 
      "_last_modified": {
        "format": "dateOptionalTime", 
        "type": "date"
      }, 
      "end": {
        "type": "string"
      }, 
      "owner": {
        "type": "string"
      }, 
      "start": {
        "type": "string"
      }, 
      "title": {
        "type": "string"
      }
    }
  }
};

var sample_data = {
  "_shards": {
    "failed": 0, 
    "successful": 5, 
    "total": 5
  }, 
  "hits": {
    "hits": [
      {
        "_id": "u3rpLyuFS3yLNXrtxWkMwg", 
        "_index": "hypernotes", 
        "_score": 1.0, 
        "_source": {
          "_created": "2012-02-24T17:53:57.286Z", 
          "_last_modified": "2012-02-24T17:53:57.286Z", 
          "owner": "tester", 
          "title": "Note 1"
        }, 
        "_type": "note"
      }, 
      {
        "_id": "n7JMkFOHSASJCVTXgcpqkA", 
        "_index": "hypernotes", 
        "_score": 1.0, 
        "_source": {
          "_created": "2012-02-24T17:53:57.290Z", 
          "_last_modified": "2012-02-24T17:53:57.290Z", 
          "owner": "tester", 
          "title": "Note 3"
        }, 
        "_type": "note"
      }, 
      {
        "_id": "g7UMA55gTJijvsB3dFitzw", 
        "_index": "hypernotes", 
        "_score": 1.0, 
        "_source": {
          "_created": "2012-02-24T17:53:57.289Z", 
          "_last_modified": "2012-02-24T17:53:57.289Z", 
          "owner": "tester", 
          "title": "Note 2"
        }, 
        "_type": "note"
      }
    ], 
    "max_score": 1.0, 
    "total": 3
  }, 
  "timed_out": false, 
  "took": 2
};

test("query", function() { 
  var backend = new ES.Table('https://localhost:9200/my-es-db/my-es-type');

  var stub = sinon.stub(jQuery, 'ajax', function(options) {
    if (options.url.indexOf('_mapping') != -1) {
      return {
        done: function(callback) {
          callback(mapping_data);
          return this;
        },
        fail: function() {
          return this;
        }
      }
    } else {
      return {
        done: function(callback) {
          callback(sample_data);
          return this;
        },
        fail: function() {
        }
      }
    }
  });

  backend.mapping().done(function(data) {
    var fields = _.keys(data.note.properties);
    deepEqual(['_created', '_last_modified', 'end', 'owner', 'start', 'title'], fields);
  });

  backend.query().done(function(queryResult) {
    equal(3, queryResult.hits.total);
    equal(3, queryResult.hits.hits.length);
    equal('Note 1', queryResult.hits.hits[0]._source['title']);
  });

  jQuery.ajax.restore();
});


// DISABLED - this test requires ElasticSearch to be running locally
// test("write", function() { 
//   var url = 'http://localhost:9200/recline-test/es-write';
//   var backend = new ES.Table(url);
//   stop();
// 
//   var id = parseInt(Math.random()*100000000).toString();
//   var rec = {
//     id: id,
//     title: 'my title'
//   };
//   var jqxhr = backend.upsert(rec);
//   jqxhr.done(function(data) {
//     ok(data.ok);
//     equal(data._id, id);
//     equal(data._type, 'es-write');
//     equal(data._version, 1);
//     
//     // update
//     rec.title = 'new title';
//     var jqxhr = backend.upsert(rec);
//     jqxhr.done(function(data) {
//       equal(data._version, 2);
// 
//       // delete
//       var jqxhr = backend.remove(rec.id);
//       jqxhr.done(function(data) {
//         ok(data.ok);
//         rec = null;
// 
//         // try to get ...
//         var jqxhr = backend.get(id);
//         jqxhr.done(function(data) {
//           // should not be here
//           ok(false, 'Should have got 404');
//         }).error(function(error) {
//           equal(error.status, 404);
//           start();
//         });
//       });
//     });
//   }).fail(function(error) {
//     console.log(error);
//     ok(false, 'Basic request failed - is ElasticSearch running locally on port 9200 (required for this test!)');
//     start();
//   });
// });


// ==================================================

module("Backend ElasticSearch - Recline");

test("query", function() { 
  var dataset = {
    url: 'https://localhost:9200/my-es-db/my-es-type',
    backend: 'elasticsearch'
  };

  var stub = sinon.stub(jQuery, 'ajax', function(options) {
    if (options.url.indexOf('_mapping') != -1) {
      return {
        done: function(callback) {
          callback(mapping_data);
          return this;
        },
        fail: function() {
          return this;
        }
      }
    } else {
      return {
        done: function(callback) {
          callback(sample_data);
          return this;
        },
        fail: function() {
        }
      };
    }
  });

  recline.Backend.ElasticSearch.fetch(dataset).done(function(dataset) {
    deepEqual(['_created', '_last_modified', 'end', 'owner', 'start', 'title'], _.pluck(dataset.fields, 'id'));
  });

  recline.Backend.ElasticSearch.query({}, dataset).then(function(recList) {
    equal(3, recList.total);
    equal('Note 1', recList.hits[0].title);
  });
  jQuery.ajax.restore();
});

// DISABLED - this test requires ElasticSearch to be running locally
// test("write", function() { 
//   var dataset = new recline.Model.Dataset({
//     url: 'http://localhost:9200/recline-test/es-write',
//     backend: 'elasticsearch'
//   });
// 
//   stop();
// 
//   var id = parseInt(Math.random()*100000000).toString();
//   var rec = new recline.Model.Record({
//     id: id,
//     title: 'my title'
//   });
//   dataset.records.add(rec);
//   // have to do this explicitly as we not really supporting adding new items atm
//   dataset._changes.creates.push(rec.toJSON());
//   var jqxhr = dataset.save();
//   jqxhr.done(function(data) {
//     ok(data.ok);
//     equal(data._id, id);
//     equal(data._type, 'es-write');
//     equal(data._version, 1);
//     
//     // update
//     rec.set({title: 'new title'});
//     // again set up by hand ...
//     dataset._changes.creates = [];
//     dataset._changes.updates.push(rec.toJSON());
//     var jqxhr = dataset.save();
//     jqxhr.done(function(data) {
//       equal(data._version, 2);
// 
//       // delete
//       dataset._changes.updates = 0;
//       dataset._changes.deletes.push(rec.toJSON());
//       var jqxhr = dataset.save();
//       jqxhr.done(function(data) {
//         ok(data.ok);
//         rec = null;
// 
//         // try to get ...
//         var es = new ES.Table(dataset.get('url'));
//         var jqxhr = es.get(id);
//         jqxhr.done(function(data) {
//           // should not be here
//           ok(false, 'Should have got 404');
//         }).error(function(error) {
//           equal(error.status, 404);
//           start();
//         });
//       });
//     });
//   }).fail(function(error) {
//     console.log(error);
//     ok(false, 'Basic request failed - is ElasticSearch running locally on port 9200 (required for this test!)');
//     start();
//   });
// });

})();

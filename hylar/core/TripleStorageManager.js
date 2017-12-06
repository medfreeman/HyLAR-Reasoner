/**
 * Created by pc on 20/11/2015.
 */

var ParsingInterface = require('./ParsingInterface');
var Prefixes = require('./Prefixes');

//var rdfstore = require('rdfstore');
var rdflib = require('rdflib');
var q = require('q');

/**
 * Interface used for triple storage.
 * Relies on antonio garrote's rdfstore.js
 */

function TripleStorageManager() {
    //
}

    /**
     * Initializes the triplestore.
     * Register owl, rdfs and rdfs prefixes.
     * @returns {*}
     */
TripleStorageManager.prototype.init = function() {
    var deferred = q.defer();
    this.storage = rdflib.graph();
    deferred.resolve();
    return deferred.promise;
};

    /**
     * Suitable function to load rdf/xml ontologies
     * using rdf-ext parser.
     * @param data
     * @returns {*|Promise}
     */
TripleStorageManager.prototype.loadRdfXml = function(data) {
        var that = this;
        return ParsingInterface.rdfXmlToTurtle(data)
        .then(function(ttl) {
            return that.load(ttl, 'text/turtle');
        }, function(error) {
            console.error(error);
            throw error;
        });
};

/**
 * Launches a query against the triplestore.
 * @param query
 * @returns {*}
 */
TripleStorageManager.prototype.query = function(query) {
    var deferred = q.defer(),
        parsedQuery = ParsingInterface.parseSPARQL(query),
        query = ParsingInterface.serializeSPARQL(parsedQuery),
        r = [], formattedQuery;

    if (parsedQuery.type && parsedQuery.type == "update") {
        formattedQuery = rdflib.sparqlUpdateParser(query, this.storage, 'http://default.com');
        this.storage.applyPatch(formattedQuery, this.storage.sym('http://default.com'),
            function(err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(true);
                }
            }
        );
    } else {

        formattedQuery = rdflib.SPARQLToQuery(query, true, this.storage);
        this.storage.query(formattedQuery,
            function(el) {
                r.push(el)
            },
            function(err) {
                deferred.reject(err);
            },
            function(done) {
                deferred.resolve(r);
            }
        );
    }


    return deferred.promise;
};

/**
 * Loads an ontology in the store.
 * @param data Raw ontology (str)
 * @param format Ontology mimetype
 * @returns {*}
 */
TripleStorageManager.prototype.load = function(data, format) {
    var deferred = q.defer();
    rdflib.parse(data, this.storage, 'http://www.default.com', format,
        function(done) {
            deferred.resolve(done);
        });
    return deferred.promise;
};

TripleStorageManager.prototype.getAll = function() {
    return this.storage.statementsMatching(undefined, undefined, undefined);
};

/**
 * Empties the entire store.
 * @returns {*}
 */
TripleStorageManager.prototype.clear = function()  {
    return this.query('DELETE { ?a ?b ?c . } WHERE { ?a ?b ?c . }');
};

/**
 * Launches an insert query against
 * the triplestore.
 * @param ttl Triples to insert, in turtle.
 * @returns {*}
 */
TripleStorageManager.prototype.insert = function(ttl, graph) {
    var query;
    if (graph === undefined) {
        query = 'INSERT DATA { ' + ttl + ' }';
    } else {
        query = 'INSERT DATA { GRAPH <' + graph + '> { ' + ttl + ' } }'
    }
    return this.query(query);
};

/**
 * Launches a delete query against
 * the triplestore.
 * @param ttl Triples to insert, in turtle.
 * @returns {*}
 */
TripleStorageManager.prototype.delete = function(ttl, graph) {
    var query;
    if (graph === undefined) {
        query = 'DELETE DATA { ' + ttl + ' }';
    } else {
        query = 'DELETE DATA { GRAPH <' + graph + '> { ' + ttl + ' } }'
    }
    return this.query(query);
};

/**
 * Returns the content of the store,
 * for export purposes.
 * @returns {*}
 */
TripleStorageManager.prototype.getContent = function() {
    return this.query('CONSTRUCT { ?a ?b ?c } WHERE { ?a ?b ?c }');
};

/**
 * Loads content in the store,
 * for import purposes.
 * @param ttl Triples to import, in turtle.
 * @returns {*|Promise}
 */
TripleStorageManager.prototype.createStoreWith = function(ttl) {
    return this.clear().then(function() {
        return this.insert(ttl)
    });
};

TripleStorageManager.prototype.regenerateSideStore = function() {
    var deferred = q.defer(),
        that = this;

    /*new rdfstore.create(function(err, store) {
        that.sideStore = store;
        deferred.resolve();
    });
    return deferred.promise;*/
};

TripleStorageManager.prototype.loadIntoSideStore = function(ttl, graph) {
    var deferred = q.defer(),
        query = 'INSERT DATA { ' + ttl + ' }';

    if (graph) {
        query = 'INSERT DATA { GRAPH <' + graph + '> { ' + ttl + ' } }'
    }

    try {
        this.sideStore.execute(query,
            function (err, r) {
                deferred.resolve(r);
            });
    } catch(e) {
        deferred.reject(e + "\n@" + this.constructor.name);
        throw e;
    }

    return deferred.promise;
};

TripleStorageManager.prototype.querySideStore = function(query) {
    var deferred = q.defer();
    this.sideStore.execute(query,
        function(err, r) {
            deferred.resolve(r);
        });
    return deferred.promise;
};

module.exports = TripleStorageManager;
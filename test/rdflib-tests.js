var should = require('should'),
    fs = require('fs'),
    $rdf = require('rdflib');

var graph = $rdf.graph();

var showRes = function(res) {
    console.log(res.length);
};

describe('RDFLib tests', function () {
    it('should load an ontology', function () {
        var ontoStr = fs.readFileSync('./test/ontologies/fipa.ttl');
        $rdf.parse(ontoStr, graph, "http://sites.google.com/site/smartappliancesproject/ontologies/fipa", 'text/turtle');
    });

    it('should process SPARQL', function () {
        var sparql = 'SELECT * WHERE { ?s ?p ?o . }',
            q = $rdf.SPARQLToQuery(sparql, null, graph);
        
        graph.query(q, function(result) {
            1;
        });
         
    });
});

var should = require('should'),
    fs = require('fs'),
    $rdf = require('rdflib');

var graph = $rdf.graph();

var showRes = function(res) {
    console.log(res.length);
};

describe('RDFLib tests', function () {
    it('should load an ontology', function () {
        var ontoStr = fs.readFileSync('./test/ontologies/fipa.jsonld');
        $rdf.parse(ontoStr, graph, "http://example.com/test", 'application/ld+json');
    });

    it('should process SPARQL', function () {
        var sparql = 'SELECT * WHERE { ?s ?p ?o . }',
            q = $rdf.SPARQLToQuery(sparql, null, graph);
        
        graph.query(q, function(result) {
            1;
        });
         
    });
});

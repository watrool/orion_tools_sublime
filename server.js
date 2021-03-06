/*eslint-env node */
var scriptResolver = require("./scriptResolver.js");
var orionJSLib = require("./orionJavaScript.min.js");
var orionJS = new orionJSLib(new scriptResolver(), false);
var orionSearchClient = require("./orionSearchClient.js");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");

var data = "";
app.use(bodyParser.json());
//The ouput of bodyParser.urlencoded is wrong and cannot be parsed as a JSON object
//Current make-up for this is using the verify function to intercept the buf and parse it 
//to the global variable data.
app.use(bodyParser.urlencoded({extended:false, /**
 * @callback
 */
verify: function(req, res, buf, encoding){ 
	var body = buf.toString(encoding);
	req.body = body;
	var bodyObj = JSON.parse(body);
	data = bodyObj;
	// fs.writeFileSync("server-log.txt", );
}}));

app.set("port", process.env.PORT || 0);
// var fs = require("fs");
var defaults = {
	"accessor-pairs" : 1,
	"curly" : 1,
	"eqeqeq": 1,
	"missing-doc" : 0, 
	"missing-nls" : 0,
	"new-parens" : 1,
	"no-caller": 1,
	"no-comma-dangle" : 1, 
	"no-cond-assign" : 2,
	"no-console" : 0, 
	"no-constant-condition" : 2,
	"no-control-regex" : 2,
	"no-debugger" : 1,
	"no-dupe-keys" : 2,
	"no-duplicate-case": 2,
	"no-else-return" : 1,
	"no-empty-block" : 1,
	"no-empty-character-class" : 2,
	"no-empty-label" : 2,
	"no-eq-null" : 1,
	"no-eval" : 0,
	"no-extra-boolean-cast" : 2,
	"no-extra-parens" : 1,
	"no-extra-semi": 1,
	"no-fallthrough" : 2, 
	"no-implied-eval" : 0,
	"no-invalid-regexp": 2,
	"no-irregular-whitespace" : 0,
	"no-iterator": 2, 
	"no-jslint" : 1, 
	"no-mixed-spaces-and-tabs" : 0,
	"no-negated-in-lhs" : 2,
	"no-new-array": 1,
	"no-new-func" : 1,
	"no-new-object" : 1,
	"no-new-wrappers" : 1,
	"no-obj-calls" : 2,
	"no-proto" : 2, 
	"no-redeclare" : 1,
	"no-regex-spaces" : 2,
	"no-reserved-keys" : 2,
	"no-self-compare" : 2,
	"no-self-assign" : 2,
	"no-shadow" : 1,
	"no-shadow-global" : 1,
	"no-sparse-arrays" : 1, 
	"no-throw-literal" : 1,
	"no-undef" : 2,
	"no-undef-init" : 1,
	"no-unreachable" : 2, 
	"no-unused-params" : 1,
	"no-unused-vars" : 1,
	"no-use-before-define" : 1,
	"no-with" : 1,
	"radix" : 1,
	"semi" : 1,
	"type-checked-consistent-return" : 0,
	"unnecessary-nls" : 1,
	"use-isnan" : 2,
	"valid-typeof" : 2
};

app.post("/", /* @callback */ function(req, res){
	var files = data.files;
	var response = null;
	for (var i = files.length - 1; i >= 0; i--) {
		var file = files[i];
		var text = file.text;
		var name = file.name;
		var type = file.type;
		orionJS.Tern.lint(name, defaults, null, [{type: type, name: name, text: text}], function(result, err){
			if(!err){
				response = result;
			}
		});
	}
	res.set({
		"content-type" : "application/json;charset=utf-8"
	});
	res.send(JSON.stringify(response));
});

app.post("/quickFixes", /* @callback */ function(req, res){
	var id = data.id;
	res.send(JSON.stringify(orionJS.quickFixes.retrieveFix(id)(data)));
	data = '';
});

app.post("/References", /* @callback */ function(req, res){
	var searchLoc = data.root;
	var originStr = data.originStr;
	var file = [{
		"text" : data.file,
		"name" : data.path,
		"type" : "full"
	}];
	var offset = data.offset;
	orionJS.Tern.type(file, offset, function(response, err){
		orionSearchClient.search(searchLoc, originStr, function(err, result){ 
			var total = 0;
			result.forEach(function(file){
				total += file.positions;
			});
		});
	});
});

process.stdin.on("end", function() { process.exit(); });

var listener = app.listen(app.get("port"), function(){
	console.log("Listening on port " + listener.address().port);
	process.on("SIGINT", function() { process.exit(); });
	process.on("SIGTERM", function() { process.exit(); });
});
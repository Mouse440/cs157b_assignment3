/*
	CMPE172 Assignment 3 
*/
var Transform = require('stream').Transform;
var inherits = require("util").inherits;
var program = require("commander");
var fs = require('fs');

// For Node 0.8 users 
if (!Transform) {
 Transform = require('readable-stream/transform');
}

//pattern match constructor
function PatternMatch(pattern) {

	this.pattern = pattern;	 //pattern to match
	this._lastLineData = ''; //last line data store
	this.result = [];												//result store
	this.done = false;

	//Switching on object mode so when stream reads sensordata it emits single pattern match.
 	Transform.call(
		this, {
		 	objectMode: true
		}
	);
}

//Extend the Transform class.
inherits(PatternMatch, Transform);

//implementing _transform
PatternMatch.prototype._transform = function (chunk, encoding, getNextChunk){
	var data = chunk.toString();

	//if there is data 
    if (this._lastLineData) 	
    	data = this._lastLineData + data; //prepend the data to the beginning of new chunk
 	
    var lines = data.split(this.pattern);	//split the input by strings
    this._lastLineData = lines.splice(lines.length-1,1)[0]; // grab the last element of array and get the value
 	
 	lines.forEach( this.push.bind(this) );
 	this.done = false;	//set done to false;

    getNextChunk();
}
//flushing data at the end of stream
PatternMatch.prototype._flush = function (flushCompleted)	{
	if(this._lastLineData) {
		this.push(this._lastLineData); 		  //push the last line data to the result
	}
	this.done = true;						  //set done to true
	this._lastLineData = false;				  //clean the variable
	flushCompleted();
}

//parse input argument
program.option('-p, --pattern <pattern>', 'Input Pattern such as . ,').parse(process.argv);

if (program.pattern) { 						   //a pattern is present
	var patt = program.pattern;
	var inputStream = fs.createReadStream( "input-sensor.txt" );	//create a stream of input-sensor.txt file
	var patternMatch = new PatternMatch(patt);
	var patternStream = inputStream.pipe( patternMatch );

	patternMatch.on('readable', function () {	//read the input
	    var line;
	    while (null !== (line = this.read())) {
	        this.result.push(line.trim());	    //push line into result store
	    }

	    if(this.done) {
			console.log(this.result);		    //show result
	    }
	});
} else {
	console.log('You have not entered any pattern. Try again with -p, --pattern <pattern>');
}
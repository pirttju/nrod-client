/*

Importer for logged VSTP messages

Usage:
node vstpimport.js DIRECTORY

all gz files in that directory will import

*/

var config = require("./config");
var vstpfeed = require("./consumers/vstpfeed");
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");
var readline = require("readline");
var async = require("async");

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " DIRECTORY");
    process.exit(-1);
}
 
var dirName = path.resolve(process.argv[2]);
var filesList;

fs.readdir(dirName, function(err, files) {
    filesList = files.filter(function(e) {
        return path.extname(e).toLowerCase() === '.gz'
    });
    
    async.eachSeries(filesList,
    (fileName, next) => {
        console.log(fileName);
        readLogFile(fileName, function() {
            next();
        });
    }, (err) => {
        if (err) {
            console.log(err);
        }
        
        process.exit(0);
    });
});

var readLogFile = function (fileName, callback) {
    var lineReader = readline.createInterface({
        input: fs.createReadStream(fileName).pipe(zlib.createGunzip())
    });
    
    lineReader.on("line", (line) => {
        str = line.replace(new RegExp('}{', 'g'), '}\n{')
        lines = str.split('\n');
        
        processLogLines(lines, function() {
            callback();
        });
    });
};

var processLogLines = function(lines, callback) {
    async.eachSeries(lines,
    (message, next) => {
        vstpfeed.processMessage(message, function(err) {
            if (err) {
                console.log(err);
            }
            
            next();
        });
    }, (err) => {
        if (err) {
            console.log(err);
        }
        
        callback();
    });
};

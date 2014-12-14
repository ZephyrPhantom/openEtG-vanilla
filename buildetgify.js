#!/usr/bin/node
var args = ["--detect-globals=false"];
for(var i=2; i<process.argv.length-1; i++){
	args.push("-r", "./" + process.argv[i].slice(0, -3));
}
if (process.argv[process.argv.length-1] == "etgify.js") args.push("-r", "engine.io-client")
args.push("-o", process.argv[process.argv.length-1]);
function printErr(err){
	if (err){
		console.log(err.message);
	}
}
if (process.platform === "win32"){
	require("child_process").exec("browserify "+args.join(" "), printErr);
}else{
	require("child_process").execFile("browserify", args, printErr);
}
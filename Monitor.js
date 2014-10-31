var respawn = require('respawn');

var proc = respawn(['node', 'app.js'], {
    env: {ENV_VAR:'test'}, // set env vars
    cwd: '.',              // set cwd
    maxRestarts:10,        // how many restarts are allowed within 60s  
    sleep:1000,            // time to sleep between restarts
});

proc.on('spawn', function () {
  console.info('>> application monitor started...');
});

proc.on('exit', function (code, signal) {
  console.error('>> process exited, code: ' + code + ' signal: ' + signal);
});

proc.on('stdout', function (data) {
  console.log(data.toString());
});

proc.on('stderr', function (data) {
  console.error('>> process error '+ data.toString());
});

proc.start();
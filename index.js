#!/usr/bin/env node

var commander = require('commander');
var pkg = require('./package.json');
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var io = require('socket.io-client');


require('./src/deploy');
require('./src/new');
require('./src/clean');

// version
commander.version(pkg.version);

// Setup all the commands
commander.parse(process.argv);
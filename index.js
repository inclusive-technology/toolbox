var commander = require('commander');
var pkg = require('./package.json');

require('./src/deploy');
require('./src/new');

// version
commander.version(pkg.version);

// Setup all the commands
commander.parse(process.argv);
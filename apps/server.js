const http = require('http');
const app = require('./app');
const port = 3000;
const debug = require('debug')('app-one-usermanagement:server');
const server = http.createServer(app);

console.log('port:', port);
app.set('port', port);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    console.error(error);
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
        default:
            throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
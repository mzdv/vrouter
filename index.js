let net = require('net');

let PORTS = {
    INCOMING: 4000,
    OUTGOING: 5000,
    CONTROL: 6000
};

let HOST = '127.0.0.1';

let MESSAGES = {
    HELLO: 'HELLO',
    R2R: 'R2R',
    CONTINUE: 'CONTINUE',
    END: 'END',
    CONTROL: {
        FLUSH: 'FLUSH',
        POWEROFF: 'POWEROFF',
        DENYALL: 'DENYALL',
        ALLOWALL: 'ALLOWALL'
    }
};

let DATA_EMPTY = 'EMPTY';

let localAddressCounter = 0;

let localAddresses = {
    subnet: 0,
    r2r: 0
};

let backupAddresses = {};

let mutateData = function (data) {
    return data + 'mutated';
    /* This is an example of data mutation
       in real life, this would be a rule engine
        that would manipulate data to an input
        provided by the network administrator,
        such as data duplication, redirection
        and holding of data. To keep it simple,
        this just adds the '_mutated' string to it. */
};

let routingTable = {
    subnet: [],
    r2r: []
};

let incomingServer =
    net.createServer((socket) => {
        socket.on('data', (data) => {
            let parsedMessage = data.split('|');
            let remoteAddress = socket.remoteAddress;

            switch (parsedMessage[0]) {
                case MESSAGES.HELLO:
                    if (routingTable.subnet.indexOf(remoteAddress) === -1) {
                        routingTable.subnet.push({
                            remoteAddress: localAddresses.subnet++
                        });
                    }
                    socket.end('Registered as ${localAddresses.subnet - 1}');
                    break;
                case MESSAGES.R2R:
                    if (routingTable.r2r.indexOf(remoteAddress) === -1) {
                        routingTable.r2r.push({
                            remoteAddress: localAddresses.r2r++
                        });
                    }
                    break;
                case MESSAGES.CONTINUE:
                    let splitContent = parsedMessage[1].split(':');
                    if (splitContent.length > 1) {
                        let client = net.connect(
                            {
                                port: PORTS.OUTGOING,
                                host: HOST
                            }, () => {
                                client.end('${socket.remoteAddress}/${splitContent[0]}:${mutateData(data.toString())}');
                            });
                    } else if (parsedMessage[1] === 'EMPTY') {
                        socket.write('Got EMPTY, ignoring...');
                    }
                    break;
                case MESSAGES.END:
                    let indices = {
                        subnet: routingTable.subnet.indexOf(remoteAddress),
                        r2r: routingTable.r2r.indexOf(remoteAddress)
                    }
                    if (indices.subnet > -1) {
                        routingTable.subnet.splice(indices.subnet, 1);
                    } else if (indices.r2r > -1) {
                        routingTable.subnet.splice(indices.r2r, 1);
                    }

                    socket.end('Removed from routing tables.');
                    break;
            }
        });
    }).listen(PORTS.INCOMING, HOST);

let outgoingServer =
    net.createServer((socket) => {
        socket.on('data', (data) => {
            let configuration = data.toString().split('/')[0];
            let splitContent = configuration[1].split(':');

            if (splitContent.length > 1) {
                let routePath = routingTable.subnet.filter((routingEntry) => {
                    if (routingEntry.key === splitContent[0]) {
                        return routingEntry;
                    }
                });

                if (routePath.length === 0) {
                    routePath = routingTable.r2r.filter((routingEntry) => {
                        if (routingEntry.key === splitContent[0]) {
                            return routingEntry;
                        }
                    });
                }
            } else {
                socket.end('No route found.');
                let client = net.connect(
                    {
                        port: PORTS.CONTROL,
                        host: HOST
                    }, () => {
                        client.end('${configuration[0]}/${splitContent[0]}:${data.toString()}');
                    });
            }
        });
    }).listen(PORTS.OUTGOING, HOST);

let controlServer =
    net.createServer((socket) => {
        socket.on('data', (data) => {
            var dataCommand = data.toString();

            switch (dataCommand) {
                case MESSAGES.CONTROL.FLUSH:
                    localAddresses.r2r = {};
                    localAddresses.subnet = {};
                    socket.end('Routing tables flushed.');
                    break;
                case MESSAGES.CONTROL.POWEROFF:
                    socket.end('Good bye.');
                    process.exit();
                    break;
                case MESSAGES.CONTROL.DENYALL:
                    backupAddresses = localAddresses;   // deleting routing tables
                    localAddresses.r2r = {};            // thus denying
                    localAddresses.subnet = {};
                    socket.end('Denying all traffic.');
                    break;
                case MESSAGES.CONTROL.ALLOWALL:
                    localAddresses = backupAddresses;   // restoring routing tables
                    socket.end('Allowing all traffic.');
                    break;
                default:
                    let failedData = dataCommand.split('/');

                    let client = net.connect(
                        {
                            port: PORTS.CONTROL,
                            host: failedData[0]
                        }, () => {
                            client.end('ENORT:${failedData[0]}:${failedData[1]}');
                        });
                    break;
            }

        });
    }).listen(PORTS.CONTROL, HOST);
let net = require('net');

let PORTS = {
    INCOMING: 4000,
    OUTGOING: 5000,
    CONTROL: 6000
};

let LOCALHOST = '127.0.0.1';

let MESSAGES = {
    HELLO: 'HELLO',
    R2R: 'R2R',
    CONTINUE: 'CONTINUE',
    END: 'END'
};

let DATA_EMPTY = 'EMPTY';

let localAddressCounter = 0;

let localAddresses = {
    subnet: 0,
    r2r: 0
};

let mutateData = function (data) {
    return 0;
};

let passMessage = function (data) {
    return 0;
};

let routingTable = {
    subnet: [],
    r2r: []
};

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
                // TODO: Refactor
                // passMessage(mutateData(parsedMessage[1]));
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
}).listen(PORTS.INCOMING, LOCALHOST);

net.createServer((socket) => {
    socket.on('data', (data) => {
        // Not implemented
    });
}).listen(PORTS.OUTGOING, LOCALHOST);

net.createServer((socket) => {
    socket.on('data', (data) => {
        // Not implemented
    });
}).listen(PORTS.CONTROL, LOCALHOST);
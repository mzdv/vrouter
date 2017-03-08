import net from net;

let PORTS = {
    INCOMING: 4000,
    OUTGOING: 5000,
    CONTROL: 6000
};

let LOCALHOST = '127.0.0.1';
let MESSAGES = {
    HELLO: 'HELLO',
    CONTINUE: 'CONTINUE',
    END: 'END'
};

let mutateData = function (data) {
    return;
};

let passMessage = function (data) {
    return;
};

let routingTable = {
    subnet: [],
    r2r: []
};

net.createServer((socket) => {
    socket.on('data', (data) => {

        let parsedMessage = data.split('|');
        switch (parsedMessage[0]) {
            case MESSAGES.HELLO:
                // TODO: check if the IP exists
                // if IP is not in the routingTable, add it
                break;
            case MESSAGES.CONTINUE:
                passMessage(mutateData(parsedMessage[1]));
                break;
            case MESSAGES.END:
                // TODO: remove IP from routingTable
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
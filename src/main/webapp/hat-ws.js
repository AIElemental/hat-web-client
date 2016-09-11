var socket;
var connected = false;
var onMessageHandlers = [];

function connect(){
    try {        
        var host = backend;
        if (!host || host === '') {
            host = 'ws://46.101.133.65:8888/ws';
        }
        log('Connecting to web socket at ' + host);
        socket = new WebSocket(host);

        log('Socket Status: ' + socket.readyState);

        socket.onopen = function(){
            log('Socket Status: ' + socket.readyState+' (open)');
                connected = true;
        }

        socket.onmessage = function(msg){
            log('Received: '+msg.data);
            for (var i = 0; i < onMessageHandlers.length; i++) {
                onMessageHandlers[i]();
            }
        }

        socket.onclose = function(){
            log('Socket Status: ' + socket.readyState+' (Closed)');
                connected = false;
        }            

    } catch(exception){
            log('Error ' + exception);
            post_message('Socket connect error ' + exception);
    }
}

function ws_send(json_data) {
    ws_send(json_data, 2);
}

function ws_send(json_data, tries) {
    tries--;
    if (tries < 0) {
        log('Failed to send ' + json_data + '. Socket not ready');
        return;
    }
    var wsocket = getSocket();
    if (wsocket.readyState == 1) {
        wsocket.send(JSON.stringify(json_data));
    } else {
        setTimeout(function () {
            ws_send(json_data, tries);
        }, 500);
    }
}

function getSocket() {
    if (connected) {
        return socket;
    } else {
        connect();
        return socket;
    }
}

function ws_add_handler(func) {
    onMessageHandlers.push(func);
}

function ws_request_create_room(room_name, room_pass, player_name, words, turn_time, callback, errorCb){    
    var data = '{\
"action": "create_room",\
"data":{\
    "room_name":"'+room_name+'",\
    "room_pass":"'+room_pass+'",\
    "player_name":"'+player_name+'",\
    "word_count":'+words+',\
    "turn_time":'+turn_time+'\
}\
';
    log(data);
    getSocket().send(data);
}

function socket_test() {
    var socket;
    try {        
        var host = 'ws://46.101.133.65:8888/ws/';
        log('Test Connecting to web socket at ' + host);
        socket = new WebSocket(host);

        log('Test Socket Status: ' + socket.readyState);

        socket.onopen = function(){
                log('Test Socket Status: ' + socket.readyState+' (open)');
        }

        socket.onmessage = function(msg){
                log('Test Received: '+msg.data);
        }

        socket.onclose = function(){
                log('Test Socket Status: ' + socket.readyState+' (Closed)');
        }            

    } catch(exception){
            log('Test Error ' + exception);
            post_message('Test Socket connect error ' + exception);
    }
    socket.send('["test"]');
    log('Test Socket Status: ' + socket.readyState);
}
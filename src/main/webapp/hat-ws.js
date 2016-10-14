var socket;
var connected = false;
var onMessageHandlers = [];

function connect() {
    try {
        var host = backend;
        if (!host || host === '' || host === 'undefined') {
            host = 'ws://46.101.133.65:8888/ws';
        }
        log('Connecting to web socket at ' + host);
        socket = new WebSocket(host);

        log('Socket Status: ' + socket.readyState);

        socket.onopen = function () {
            log('Socket Status: ' + socket.readyState + ' (open)');
            connected = true;
        };

        socket.onmessage = function (msg) {
            log('Received: ' + msg.data);
            for (var i = 0; i < onMessageHandlers.length; i++) {
                onMessageHandlers[i](msg.data);
            }
        };

        socket.onclose = function () {
            log('Socket Status: ' + socket.readyState + ' (Closed)');
            connected = false;
        }

    } catch (exception) {
        log('Error ' + exception);
        post_message('Socket connect error ' + exception);
    }
}

function ws_send(json_data) {
    ws_send_tries(json_data, 2);
}

function ws_send_tries(json_data, tries) {
    tries--;
    if (tries < 0) {
        log('Failed to send ' + json_data + '. Socket not ready');
        return;
    }
    var wsocket = getSocket();
    if (wsocket.readyState == 1) {
        var json_str = JSON.stringify(json_data);
        wsocket.send(json_str);
        log("Sent " + json_str);
    } else {
        setTimeout(function () {
            ws_send_tries(json_data, tries);
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

function closeSocket() {
    if (connected) {
        socket.close();
    }
}

function ws_add_handler(func) {
    onMessageHandlers.push(func);
}

function ws_request_get_room_list(player_name) {
    var data =
    {
        "player_name": player_name,
        "action": "get_room_list",
        "data": {}
    };
    ws_send(data);
}


function ws_request_create_room(room_name, room_pass, player_name, words, turn_time) {
    var data =
    {
        "player_name": player_name,
        "action": "enter_room",
        "data": {
            "room_name": room_name,
            "room_pass": room_pass,
            "words": parseInt(words),
            "turn_time": parseInt(turn_time)
        }
    };
    ws_send(data);
}

function ws_request_enter_room(room_name, room_pass, player_name, words, turn_time) {
    ws_request_create_room(room_name, room_pass, player_name, words, turn_time);
}

function ws_request_reconnect_room(room_name, room_pass, player_name, words, turn_time) {
    var data =
    {
        "player_name": player_name,
        "action": "reconnect",
        "data": {
            "room_name": room_name,
            "room_pass": room_pass,
            "words": parseInt(words),
            "turn_time": parseInt(turn_time)
        }
    };
    ws_send(data);
}

function ws_request_start_game(room_name, room_pass, player_name) {
    var data =
    {
        "player_name": player_name,
        "action": "start_game",
        "data": {
            "room_name": room_name,
            "room_pass": room_pass
        }
    };
    ws_send(data);
}

function ws_request_commit_words(room_name, room_pass, player_name, words) {
    var data =
    {
        "player_name": player_name,
        "action": "commit_words",
        "data": {
            "room_name": room_name,
            "room_pass": room_pass,
            "words": words
        }
    };
    ws_send(data);
}

function ws_request_commit_turn(room_name, room_pass, player_name, words, turn_num) {
    var data =
    {
        "player_name": player_name,
        "action": "commit_turn",
        "data": {
            "room_name": room_name,
            "room_pass": room_pass,
            "words": words,
            "turn_num": turn_num
        }
    };
    ws_send(data);
}

function ws_request_set_name(player_name) {
    var data =
    {
        "action": "set_name",
        "data" : {
            "player_name": player_name
        }
    };
    ws_send(data);
}

function ws_request_word_info(word, time_to_guess, is_last) {
    log("word " + word + " in " + time_to_guess);
    var data =
    {
        "action":"commit_answer",
        "data" : {
            //"word": word,
            "time": time_to_guess,
            "last": is_last
        }
    };
    ws_send(data);
}


function socket_test() {
    var socket;
    try {
        var host = 'ws://46.101.133.65:8888/ws/';
        log('Test Connecting to web socket at ' + host);
        socket = new WebSocket(host);

        log('Test Socket Status: ' + socket.readyState);

        socket.onopen = function () {
            log('Test Socket Status: ' + socket.readyState + ' (open)');
        };

        socket.onmessage = function (msg) {
            log('Test Received: ' + msg.data);
        };

        socket.onclose = function () {
            log('Test Socket Status: ' + socket.readyState + ' (Closed)');
        }

    } catch (exception) {
        log('Test Error ' + exception);
        post_message('Test Socket connect error ' + exception);
    }
    socket.send('["test"]');
    log('Test Socket Status: ' + socket.readyState);
}
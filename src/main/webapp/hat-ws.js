var socket;
function connect(){
    try {        
        var host = backend;
        socket = new WebSocket(host);

        log('Socket Status: ' + socket.readyState);

        socket.onopen = function(){
                log('Socket Status: ' + socket.readyState+' (open)');
        }

        socket.onmessage = function(msg){
                log('Received: '+msg.data);
        }

        socket.onclose = function(){
                log('Socket Status: ' + socket.readyState+' (Closed)');
        }            

    } catch(exception){
            log('Error ' + exception);
    }
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
    socket.send(data);
}
function request_create_room(room_name, room_pass, player_name, words, turn_time, callback, errorCb){
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
var jqxhr = $.post(backend, data)
  .done(function(result) {
    log("create_room done:" + result);
    callback(result);
  })
  .fail(function(result) {
    log("create_room error:" + result);
    errorCb(result);
  })
  .always(function() {
    if (true) return;
    alert( "finished" );
});
}
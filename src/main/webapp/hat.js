/* Hat code */
/* Config vars */
var const_game_ping = 3000;
var const_cooloff_after_turn = 2000;

/* State vars */
var backend = '';

var state_state = "no_room";
var state_room_name = '';
var state_room_pass = '';
var state_words_per_player = 20;
var state_turn_time_sec = 20;
var state_player_name = '';
var state_turn_name = '';
var state_turn_num = 0;

var turn_active = false;
var state_words_done = [];
var state_words_for_turn = [];

var const_ui_state_no_room = 0;
var const_ui_state_in_room = 1;
var const_ui_state_word_gen = 2;
var const_ui_state_turn_other = 3;
var const_ui_state_turn_me = 4;
var const_ui_state_endgame = 5;

/* Common functions */
function getDateTime() {
    var now     = new Date(); 
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(hour.toString().length == 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        second = '0'+second;
    }   
    var dateTime = hour+':'+minute+':'+second;   
    return dateTime;
}

function log(message) {
    message = getDateTime() + ' ' + message;
    console.log(message);
    $("#log").prepend('<div>' + message + '</div>');    
}

function get_or_default(obj, default_obj) {
    if (obj == undefined || obj === '') {
        return default_obj;
    } else {
        return obj;
    }
}

function debug_state() {
    var debug_state = $("#debug_state");
    debug_state.html("");
    debug_state.append("<span style='display:block;'>state_state=" + state_state + "</span>");
    debug_state.append("<span style='display:block;'>state_room_name=" + state_room_name + "</span>");
    debug_state.append("<span style='display:block;'>state_room_pass=" + state_room_pass + "</span>");
    debug_state.append("<span style='display:block;'>state_words_per_player=" + state_words_per_player + "</span>");
    debug_state.append("<span style='display:block;'>state_turn_time_sec=" + state_turn_time_sec + "</span>");
    debug_state.append("<span style='display:block;'>state_player_name=" + state_player_name + "</span>");
    debug_state.append("<span style='display:block;'>state_turn_name=" + state_turn_name + "</span>");
    debug_state.append("<span style='display:block;'>state_turn_num=" + state_turn_num + "</span>");
}

var timerId;
function activateTimer(time) {
    var start = new Date;    
    timerId = setInterval(function() {
        get_turn_timer().text(Math.round((time - (new Date - start) / 1000)) + " Seconds");
    }, 171);
}
function stopTimer() {
    clearInterval(timerId);    
}

function post_message(message) {
    message = getDateTime() + ' ' + message;
    log('post_message: ' + message);
    $("#infobox").addClass("button warning block-shadow-warning text-shadow").text(message).show();
}

/* State change functions */
function set_state(state) {
    log("state_state: " + state_state + "->" + state);
    state_state = state;
    Cookies.set('ht_state', state, {expires: 7});
    debug_state();
}

function set_player_name(player_name) {
    log("state_player_name: " + state_player_name + "->" + player_name);
    state_player_name = player_name;
    Cookies.set('ht_player_name', player_name, {expires: 7});
    debug_state();
}

function set_room_name(room_name) {
    log("state_room_name: " + state_room_name + "->" + room_name);
    state_room_name = room_name;
    $('#ui_room_name').text(state_room_name + ' wpp:' + state_words_per_player + ' spt' + state_turn_time_sec);
    Cookies.set('ht_room_name', room_name, {expires: 7});
    debug_state();
}

function set_room_password(room_pass) {
    log("state_room_pass: " + state_room_pass + "->" + room_pass);
    state_room_pass = room_pass;
    Cookies.set('ht_room_pass', room_pass, {expires: 7});
    debug_state();
}

function set_words_per_player(words) {
    log("state_words_per_player: " + state_words_per_player + "->" + words);
    state_words_per_player = words;
    Cookies.set('ht_wpp', words, {expires: 7});
    debug_state();
}

function set_turn_time_sec(secs) {
    log("state_turn_time_sec: " + state_turn_time_sec + "->" + secs);
    state_turn_time_sec = secs;
    Cookies.set('ht_tts', secs, {expires: 7});
    debug_state();
}

function set_turn_name(turn_name) {
    log("state_turn_name: " + state_turn_name + "->" + turn_name);
    state_turn_name = turn_name;
    Cookies.set('ht_tplayer', state_turn_name, {expires: 7});
    debug_state();
}

function set_backend(url_string) {
    log('backend at ' + url_string);
    backend = url_string;
    Cookies.set('ht_wsbe', url_string, {expires: 7});
    debug_state();
}

/* Room management functions */
function room_enter(room_name, room_pass, player_name, word_per_player, seconds_per_turn) {
    log('Entering room_name=' + room_name + ' pass=' + room_pass + ' player=' + player_name + ' word=' + word_per_player + ' sec=' + seconds_per_turn);    
    
    set_room_name(room_name);
    set_room_password(room_pass);
    set_player_name(player_name);
    set_words_per_player(word_per_player);
    set_turn_time_sec(seconds_per_turn);
    
    set_ui_layout(const_ui_state_in_room);
}

function room_create(room_name, room_pass, player_name, words_pers, sec_turn) {
    log('Create room' + room_name + ' ' + room_pass + ' ' + player_name + ' ' + words_pers + ' ' + sec_turn);
    
    //store for usability
    set_room_name(room_name);
    set_room_password(room_pass);
    set_player_name(player_name);
    set_words_per_player(words_pers);
    set_turn_time_sec(sec_turn);
    
    ws_request_create_room(room_name, room_pass, player_name, words_pers, sec_turn);
}

function room_find() {
    log('Find rooms');
    ws_request_get_room_list(state_player_name);
}

function set_found_rooms(room_names) {
    var option = '';
    if (room_names.length == 0) {
        option = '<option value="blank">No rooms found</option>';
    } else {
        for (var i = 0; i < room_names.length; i++) {
            option += '<option value="'+ room_names[i] + '">' + room_names[i] + '</option>';
        }
    }
    var room_select = $('#room_select');
    room_select.html(option);
    if (room_names.length > 0) {
        room_select.val(room_names[0]);
    }
    room_select.change();
}

function room_try_enter(room_name, room_pass, player_name, words_per_player, turn_time_sec) {
    set_room_name(room_name);
    set_player_name(player_name);
    set_words_per_player(words_per_player);
    set_turn_time_sec(turn_time_sec);
    log('Trying to enter room_name=' + room_name + ' room_pass=' + room_pass + ' player_name=' + player_name);  
    ws_request_enter_room(room_name, room_pass, player_name, state_words_per_player, state_turn_time_sec);
}

function room_try_reconnect(room_name, room_pass, player_name) {
    log('Reconnecting: room_name=' + room_name + ' room_pass=' + room_pass + ' player_name=' + player_name);  
    ws_request_reconnect_room(room_name, room_pass, player_name, "-1", "-1");
}

function room_set_players(jquery_div_container, players) {
    var players_html = '';
    for (var i = 0; i < players.length; ++i) {
        players_html += '<span class="ui_player_name">' + players[i] + '</span>';
    }    
    jquery_div_container.html(players_html);
}

function room_set_players_words_pending(jquery_div_container, players, players_pending) {
    for (var i = 0; i < players.length; ++i) {
        var playerTag = players[i];
        if (players_pending.indexOf(players[i]) > -1) {
            playerTag += " (...)";
        } else {
            playerTag += " (Ready)";
        }
        players[i] = playerTag;
    }    
    room_set_players(jquery_div_container, players);
}

function room_set_players_turn(jquery_div_container, players, turn_player, scores) {
    for (var i = 0; i < players.length; ++i) {
        var playerTag = players[i] + ' ' + scores[i] + ' words ';
        if (players[i] === turn_player) {
            playerTag += " (Turn)";
        }
        players[i] = playerTag;
    }    
    room_set_players(jquery_div_container, players);
}

function room_set_players_situp(jquery_div_container, players) {
    var players_html = '';
    var radius = 50;
    for (var i = 0; i < players.length; ++i) {
        var x = radius + radius * Math.cos(i*2*Math.PI/players.length);
        var y = radius + radius * Math.sin(i*2*Math.PI/players.length);
        var style = 'style="left:'+x+'px;top:'+y+'px;"';
        log(style);
        players_html += '<span class="situp" ' + style + '>' + players[i] + '</span>';
    }
    jquery_div_container.html(players_html);
}

function request_room_players() {
    return ['Artem', 'Egor', 'Artem S', 'Den'];
}
function room_reload_players(jquery_div_container) {
    log('Reloading players');
    var players = request_room_players();
    var players_html = '';
    for (var i = 0; i < players.length; ++i) {
        players_html += '<span class="ui_player_name">' + players[i] + '</span>';
    }    
    jquery_div_container.html(players_html);
}

/* Game functions */
function enter_new_game() {
    log('Entering new game');
    set_ui_layout(const_ui_state_word_gen);
    /* store game state info into cookie */
}

function hatgame_start_new_game() {    
    ws_request_start_game(state_room_name, state_room_pass, state_player_name);
}

/* Word generation functions */
function hatgame_submit_words(jqueryElement) {
    log(jqueryElement.val());
    var linesRaw = jqueryElement.val().split("\n");
    var lines = [];
    for (var i = 0; i < linesRaw.length; ++i) {
        var line = linesRaw[i].trim();
        if (line != undefined && line.length > 0) {
            lines.push(line);
        }
    }    
    if (lines.length < state_words_per_player) {
        post_message("Please enter " + state_words_per_player + " words. You currently have " + lines.length + " words.");
        return;
    }
    for (var i = 0; i < lines.length; ++i) {
        lines[i] = lines[i].trim();
    }
    ws_request_commit_words(state_room_name, state_room_pass, state_player_name, lines);
    post_message("Words sent");
}

function enter_turn_my() {
    get_turn_timer().text(state_turn_time_sec + " Seconds");
    $('#done_words_holder').html('');
    state_words_done = [];
    set_ui_layout(const_ui_state_turn_me);
}
function enter_turn_other() {
    set_ui_layout(const_ui_state_turn_other);
}
function enter_turn_stage() {
    if (state_turn_name === state_player_name) {
        enter_turn_my();
    } else {
        enter_turn_other();
    }
}

function fetch_next_word() {
    if (state_words_for_turn.length > 0) {
        get_word().text(state_words_for_turn.shift());
    } else {
        stopTimer();
        if (turn_active) {
            turn_active = false;
            hatgame_end_turn();
        }
    }
}
/**
 * Receive first word, and start timer countdown.
 * Sets callback on timeout, to clean up UI and send turn results to server
 */
function hatgame_start_turn() {
    log('Start my turn');    
    turn_active = true;
    activateTimer(state_turn_time_sec);
    setTimeout(function() {    
        stopTimer();
        if (turn_active) {
            turn_active = false;
            hatgame_end_turn();
        }
    }, state_turn_time_sec * 1000);
    get_turn_me_pre().hide();
    get_turn_me_active().show();
    fetch_next_word();
}

function hatgame_next_word() {
    var cur_word = get_word().text();
    state_words_done.push(cur_word);
    log(state_words_done);
    $('#done_words_holder').append(' <span class="word_tile">' + cur_word + '</span>');
    fetch_next_word();
}

function hatgame_end_turn() {
    /* send turn results */
    get_turn_me_active().hide();
    //state_turn_num++;
    ws_request_commit_turn(state_room_name, state_room_pass, state_player_name, state_words_done, state_turn_num);    
}

function enter_gameend() {
    set_ui_layout(const_ui_state_endgame);
}

function start_screen() {
    set_ui_layout(const_ui_state_no_room);
}


function no_room_to_in_room() {
    room_enter(state_room_name, state_room_pass, state_player_name, state_words_per_player, state_turn_time_sec);
}
function no_room_to_word_generation() {
    enter_new_game();
}
function no_room_to_hatgame() {
    enter_turn_stage();
}
function in_room_to_in_room() {
    //player list is updated by itself
}
function in_room_to_word_generation() {
    enter_new_game();
}
function word_generation_to_word_generation() {
    //player list is updated by itself
}
function word_generation_to_hatgame() {
    enter_turn_stage();
}
function hatgame_to_hatgame() {
    enter_turn_stage();
}
function hatgame_to_endgame() {
    enter_gameend();
}
function endgame_to_no_room() {
    start_screen();
}

var transitions = {
    "no_room" : {
        "in_room" : no_room_to_in_room,
        "word_generation" : no_room_to_word_generation,
        "hatgame" : no_room_to_hatgame
    },
    "in_room" : {
        "in_room" : in_room_to_in_room,
        "word_generation" : in_room_to_word_generation
    },
    "word_generation" : {
        "word_generation" : word_generation_to_word_generation,
        "hatgame" : word_generation_to_hatgame
    },
    "hatgame" : {
        "hatgame" : hatgame_to_hatgame,
        "endgame" : hatgame_to_endgame        
    },
    "endgame" : {
        "no_room" : endgame_to_no_room
    }    
}
function transitionTo(state) {
    var possible_transitions = transitions[state_state];
    if (possible_transitions != undefined) {
        var transition_func = possible_transitions[state];
        if (transition_func != undefined) {
            log("Found transition " + state_state + "->" + state);
            set_state(state);
            transition_func();
            return;
        }
    }
    log("No transition " + state_state + "->" + state);
}

function handle_ws_rooms(data) {
    var json = JSON.parse(data);
    if (json["action"] === "room_list") {
        log('handle_ws_rooms');
        var room_info = json["data"];
        var room_names = [];
        $.each(room_info, function(room_name, room_info) {
            room_names.push(room_name);
        });
        set_found_rooms(room_names);
        debug_state();
    }
}

function handle_ws_in_room(data) {
    var json = JSON.parse(data);    
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "in_room") {
        log('handle_ws_in_room');
        var players = json["data"]["players"];
        room_set_players($('#players_list'), players);
        
        set_room_name(json["room_name"]);
        set_words_per_player(json["data"]["words"]);
        set_turn_time_sec(json["data"]["turn_time"]);
        
        transitionTo(state);
        debug_state();
    }    
}

function handle_ws_word_generation(data) {
    var json = JSON.parse(data);    
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "word_generation") {
        log('handle_ws_word_generation');
        var players = json["data"]["players"];
        var words_players = json["data"]["words_pending_from"];
        room_set_players_words_pending($('#players_list'), players, words_players);
        
        transitionTo(state);
        debug_state();
    }
}

function handle_ws_hatgame(data) {
    var json = JSON.parse(data);
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "hatgame") {
        log('handle_ws_hatgame');
        var players = json["data"]["players"];
        var turn_player = json["data"]["turn_player"];
        var scores = json["data"]["scores"];
        var words_remaining = json["data"]["words_remaining"];
        room_set_players_turn($('#players_list'), players, turn_player, scores);
        room_set_players_situp($('#situp'), json["data"]["situp"]);
        state_words_for_turn = json["data"]["turn_words"];
        set_turn_name(turn_player);
        
        transitionTo(state);
        debug_state();
    }
}

function handle_ws_endgame(data) {
    var json = JSON.parse(data);
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "endgame") {
        log('handle_ws_endgame');
        var players = json["data"]["players"];
        var turn_player = json["data"]["turn_player"];
        var scores = json["data"]["scores"];
        room_set_players($('#players_list'), players);
        room_set_players_situp($('#situp'), json["data"]["situp"]);        
        transitionTo(state);
        debug_state();
    }
}

/* UI configs */
function set_ui_state_pre_room() {
    log('set pre_room layout');    
    $('#room_find').addClass('leftfloat ribbed-grayLight').show();
    $('#room_create_enter').addClass('maintab').show();
    $('#room_info').hide();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').hide();
    $('#game_aftermath').hide();
    
    $('#room_name').val(Cookies.get('ht_room_name'));
    $('#room_pass').val(Cookies.get('ht_room_pass'));
    $('#player_name').val(Cookies.get('ht_player_name'));
    $('#hatgame_word_per_player').val(Cookies.get('ht_wpp'));
    $('#hatgame_seconds_per_turn').val(Cookies.get('ht_tts'));
}
function set_ui_state_in_room() {
    log('set in_room layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').addClass('maintab').show();
    $('#game_word_enter').hide();
    $('#game_turn').hide();
    $('#game_aftermath').hide();
}
function set_ui_state_word_gen() {
    log('set word_gen layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').hide();
    $('#game_word_enter').addClass('maintab').show();
    $('#game_turn').hide();
    $('#game_aftermath').hide();
}
function set_ui_state_turn_other() {
    log('set turn_other layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').show();
    $('#hatgame_turn_other').addClass('maintab').show();
    $('#hatgame_turn_me').hide();
    $('#game_aftermath').hide();
}
function set_ui_state_turn_me() {
    log('set turn_my layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').show();
    $('#hatgame_turn_other').hide();
    $('#hatgame_turn_me').addClass('maintab').show();
    get_turn_me_pre().show();
    get_turn_me_active().hide();
    $('#game_aftermath').hide();
}
function set_ui_state_endgame() {
    log('set endgame layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').hide();
    $('#game_aftermath').addClass('maintab').show();
}

function set_ui_layout(layout) {
    log('set layout to ' + layout);
    switch (layout) {
        case const_ui_state_no_room:
            set_ui_state_pre_room();
            break;
        case const_ui_state_in_room:
            set_ui_state_in_room();
            break;
        case const_ui_state_word_gen:
            set_ui_state_word_gen();
            break;
        case const_ui_state_turn_other:
            set_ui_state_turn_other();
            break;
        case const_ui_state_turn_me:
            set_ui_state_turn_me();
            break;
        case const_ui_state_endgame:
            set_ui_state_endgame();
            break;
        default:
            log('UNKNOWN LAYOUT ' + layout);
    }
}

function reset() {
    transitionTo("no_room");
}

function init() {
    //var startingLayout = const_ui_state_word_gen;
    var startingLayout = const_ui_state_no_room;
    set_ui_layout(startingLayout);
    $('#infobox').hide();
    
    set_state('no_room');
    set_room_name(get_or_default(Cookies.get('ht_room_name'), 'hatroom'));
    set_room_password(get_or_default(Cookies.get('ht_room_pass'), 'hatpass'));
    set_words_per_player(get_or_default(Cookies.get('ht_wpp'), '20'));
    set_turn_time_sec(get_or_default(Cookies.get('ht_tts'), '20'));
    set_player_name(get_or_default(Cookies.get('ht_player_name'), 'hatplayer'));
    set_turn_name('');
    
    backend = $('#backend').val();
    if (!backend || backend === '') {
        set_backend(Cookies.get('ht_wsbe'));
        $('#backend').val(backend);
    }
    
    ws_add_handler(handle_ws_rooms);
    ws_add_handler(handle_ws_in_room);
    ws_add_handler(handle_ws_word_generation);
    ws_add_handler(handle_ws_hatgame);
    ws_add_handler(handle_ws_endgame);    
    connect();
}

$(document).ready(function () {
    log("Page loaded");
    init();
    log("State intialized");
});
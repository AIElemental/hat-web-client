/* Hat code */
/* Config vars */
var const_game_ping = 3000;
var const_cooloff_after_turn = 2000;

/* State vars */
var backend = '';

var state_room_name = '';
var state_room_pass = '';
var state_words_per_player = 20;
var state_turn_time_sec = 20;
var state_player_name = '';
var state_turn_name = '';

var turn_active = false;
var state_checking_turn = false;
var words_done = [];
var words_for_turn = [];

var const_ui_state_pre_room = 0;
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
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }   
    var dateTime = hour+':'+minute+':'+second;   
    return dateTime;
}

function log(message) {
    message = getDateTime() + ' ' + message;
    console.log(message);
    $("#log").append('<div>' + message + '</div>');    
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

function scrollTo(jqueryElement) {
    $("body").scrollTop(jqueryElement.offset().top);
}

function post_message(message) {
    message = getDateTime() + ' ' + message;
    log('post_message: ' + message);
    $("#infobox").addClass("button warning block-shadow-warning text-shadow").text(message).show();
}

/* State change functions */
function set_player_name(player_name) {
    /* TODO: save into cookie */
    state_player_name = player_name;
    Cookies.set('ht_player_name', player_name, {expires: 7});
}

function set_room_name(room_name) {
    state_room_name = room_name;
    $('#ui_room_name').text(room_name);
    Cookies.set('ht_room_name', room_name, {expires: 7});
}

function set_room_password(room_pass) {
    state_room_pass = room_pass;
    Cookies.set('ht_room_pass', room_pass, {expires: 7});
}

function set_words_per_player(words) {
    state_words_per_player = words;
    Cookies.set('ht_wpp', words, {expires: 7});
}

function set_turn_time_sec(secs) {
    state_turn_time_sec = secs;
    Cookies.set('ht_tts', secs, {expires: 7});
}

function set_backend(url_string) {
    log('backend at ' + url_string);
    backend = url_string;
    Cookies.set('ht_wsbe', url_string, {expires: 7});
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
    
    hatgame_check_new_game_schedule();
    playerReloaderOn();
}

function room_create(room_name, room_pass, player_name, words_pers, sec_turn) {
    log('Create room' + room_name + ' ' + room_pass + ' ' + player_name + ' ' + words_pers + ' ' + sec_turn);
    
    //store for usability
    set_room_name(room_name);
    set_room_password(room_pass);
    set_player_name(player_name);
    set_words_per_player(words_pers);
    set_turn_time_sec(sec_turn);
    
    ws_request_create_room(room_name, room_pass, player_name, words_pers, sec_turn, function (result) {
        room_enter(room_name, room_pass, player_name, words_pers, sec_turn);
    }, function (result) {
        post_message('Failed to create room. continuing anyway');
        room_enter(room_name, room_pass, player_name, words_pers, sec_turn);
    });
    return;
}

function room_find() {
    log('Find rooms');
    var room_names1 = [];
    var room_names2 = ['Test room 1', 'Test room 2'];
    var room_names3 = ['Test room 1', 'Test room 2', 'Test room 3'];    
    var room_names;
    var choice = Math.floor((Math.random() * 3) + 1); 
    if (choice == 1) room_names = room_names1;
    else if (choice == 2) room_names = room_names2;
    else if (choice == 3) room_names = room_names3;
    
    var option = '';
    if (room_names.length == 0) {
        option = '<option value="blank">No rooms found</option>';
    } else {
        for (var i = 0; i < room_names.length; i++) {
            option += '<option value="'+ room_names[i] + '">' + room_names[i] + '</option>';
        }
    }
    $('#room_select').html(option);    
    if (room_names.length > 0) {
        $('#room_select').val(room_names[0]);
    }
    $('#room_select').change();
    $('#btn-reload-rooms').removeClass('loading-cube');
    return;
}

function room_try_enter(room_name, room_pass, player_name) {
    log('Trying to enter room_name=' + room_name + ' room_pass=' + room_pass + ' player_name=' + player_name);  
    ws_request_enter_room(room_name, room_pass, player_name, "-1", "-1");
    var entered = true;
    var word_per_player = 99;
    var seconds_per_turn = 66;
    if (entered) {
        room_enter(room_name, room_pass, player_name, word_per_player, seconds_per_turn);
    } else {
        post_message('Failed to enter room' + room_name);
    }
    return;
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
        if (playerTag === turn_player) {
            playerTag += " (Turn)";
        }
        players[i] = playerTag;
    }    
    room_set_players(jquery_div_container, players);
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

var playerReloaderId;
function playerReloaderOn() {
    if (true) return; /* disabled */
    room_reload_players($('#players_list'));
    log('Player reloader on');
    playerReloaderId = setInterval(function () {
        room_reload_players($('#players_list'));
    }, const_game_ping);
}
function playerReloaderOff() {
    log('Player reloader off');
    clearInterval(playerReloaderId);
}

/* Game functions */
function enter_new_game() {
    log('Entering new game');
    clearInterval(checkerId);
    playerReloaderOff();
    set_ui_layout(const_ui_state_word_gen);
    /* store game state info into cookie */
}

function hatgame_start_new_game(room_name, word_per_player, seconds_per_turn) {
    log('hatgame_start_new_game(room_name='+room_name+', word_per_player='+word_per_player+', seconds_per_turn='+seconds_per_turn+')');
    ws_request_start_game(state_room_name, state_room_pass, state_player_name);
    if (true) return;
    var success = true;
    if (success) {
        enter_new_game();
    }
}

function hatgame_check_new_game() {    
    log('Check for active game');
    var gameStarted = false;
    if (gameStarted) {
        enter_new_game();
    }        
}
var checkerId;
function hatgame_check_new_game_schedule() {
    checkerId = setInterval(function () {
        hatgame_check_new_game();
    }, const_game_ping);
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
    if (lines.length != state_words_per_player) {
        post_message("Please enter " + state_words_per_player + " words. You currently have " + lines.length + " words.");
        return;
    }
    for (var i = 0; i < lines.length; ++i) {
        lines[i] = lines[i].trim();
    }
    ws_request_commit_words(state_room_name, state_room_pass, state_player_name, words);
    if (true) return;
    var success = true;
    if (success) {
        enter_turn_stage();
        state_turn_name = state_player_name;
        scrollTo($('#game_turn'));
    }
}

/* Step functions */
function hatgame_check_my_turn() {
    var myTurn = true;
    words_for_turn = ['Alice','Bob','Charlie','Diamond','Elizabeth','Fiona'];
    if (myTurn) {
        state_checking_turn = false;
        enter_turn_my();
    }
}

var check_my_turn_on_id;
function check_my_turn_on() {
    log('my turn checker on');
    check_my_turn_on_id = setInterval(function () {
        hatgame_check_my_turn();
    }, const_game_ping);
}
function check_my_turn_off() {
    clearInterval(check_my_turn_on_id);
}

function enter_turn_my() {
    check_my_turn_off();
    get_turn_timer().text(state_turn_time_sec + " Seconds");
    $('#done_words_holder').html('');
    words_done = [];
    set_ui_layout(const_ui_state_turn_me);
}
function enter_turn_other() {
    check_my_turn_on();
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
    if (words_for_turn.length > 0) {
        get_word().text(words_for_turn.shift());
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
    words_done += [cur_word];
    log(words_done);
    $('#done_words_holder').append(' <span class="word_tile">' + cur_word + '</span>');
    fetch_next_word();
    /* save current word to done */
    /* display next word */
}

function hatgame_end_turn() {
    /* send turn results */
    get_turn_me_active().hide();
    var gameend = false;
    if (gameend) {
        enter_gameend();
    } else {
        setTimeout(function () {
            enter_turn_other();
        }, const_cooloff_after_turn);
    }
}

function enter_gameend() {
    set_ui_layout(const_ui_state_endgame);
}

function handle_ws_in_room(data) {
    var json = JSON.parse(data);    
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "in_room") {
        var players = json["data"]["players"];
        room_set_players($('#players_list'), players);        
    }
}

function handle_ws_word_generation(data) {
    var json = JSON.parse(data);    
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "word_generation") {
        var players = json["data"]["players"];
        var words_players = json["data"]["words_pending_from"];
        room_set_players_words_pending($('#players_list'), players, words_players);
        
        enter_new_game();
    }
}

function handle_ws_hatgame(data) {
    var json = JSON.parse(data);
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "hatgame") {
        var players = json["data"]["players"];
        var turn_player = json["data"]["turn_player"];
        var scores = json["data"]["scores"];
        var words_remaining = json["data"]["words_remaining"];
        room_set_players_turn($('#players_list'), players, turn_player, scores);
        room_set_players_situp($('#???'), json["data"]["situp"]);
        
        var state_turn_name = turn_player;
        enter_turn_stage();
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
        case const_ui_state_pre_room:
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
    set_ui_layout(const_ui_state_pre_room);
}

function init() {
    //var startingLayout = const_ui_state_word_gen;
    var startingLayout = const_ui_state_pre_room;
    set_ui_layout(startingLayout);
    $('#infobox').hide();
    
    set_player_name(Cookies.get('ht_player_name'));
    set_room_name(Cookies.get('ht_room_name'));
    set_room_password(Cookies.get('ht_room_pass'));
    set_words_per_player(Cookies.get('ht_wpp'));
    set_turn_time_sec(Cookies.get('ht_tts'));
    
    backend = $('#backend').val();
    if (!backend || backend === '') {
        set_backend(Cookies.get('ht_wsbe'));
        $('#backend').val(backend);
    }
    
    ws_add_handler(handle_ws_in_room);
    ws_add_handler(handle_ws_word_generation);
    connect();
}

$(document).ready(function () {
    log("Page loaded");
    init();
    log("State intialized");
});
/* Hat code */
/* State vars */
var state_turn_time_sec = 20;
var state_player_name;
var state_turn_name;
var state_checking_turn = false;

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
function activateTimer(jqueryElement) {
    var start = new Date;    
    timerId = setInterval(function() {
        jqueryElement.text((new Date - start) / 1000 + " Seconds");
    }, 171);
}
function stopTimer() {
    clearInterval(timerId);
}

function scrollTo(jqueryElement) {
    $("body").scrollTop(jqueryElement.offset().top);
}

/* Room management functions */
function room_create() {
    var room_name = $("#room_name").val();
    var room_pass = $("#room_pass").val();
    var player_name = $("#player_name").val();
    var words_pers = $("#hatgame_word_per_player").val();
    var sec_turn = $("#hatgame_seconds_per_turn").val();
    log('Create room' + room_name + ' ' + room_pass + ' ' + player_name + ' ' + words_pers + ' ' + sec_turn);
    return;
}

function room_find() {
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
    return;
}

function room_enter() {
    var room_name = document.getElementById("room_name").value;
    var room_pass = document.getElementById("room_pass").value;
    var player_name = document.getElementById("player_name").value;
    log('Enter room' + room_name + ' ' + room_pass + ' ' + player_name);
    
    scrollTo($('#room_inroom'));
    return;
}

function request_room_players() {
    return ['Artem', 'Egor', 'Artem S', 'Den'];
}
function room_reload_players(jquery_div_container) {
    var players = request_room_players();
    var players_html = '';
    for (var i = 0; i < players.length; ++i) {
        players_html += '<span class="player">' + players[i] + '</span>';
    }    
    jquery_div_container.html(players_html);
}

/* Game functions */
function hatgame_start_new_game(room_name, word_per_player, seconds_per_turn) {
    log('hatgame_start_new_game(room_name='+room_name+', word_per_player='+word_per_player+', seconds_per_turn='+seconds_per_turn+')');
    var success = true;
    if (success) {
        scrollTo($('#game_word_enter'));
    }
}

function hatgame_check_new_game() {    
    
}

/* Word generation functions */
function hatgame_submit_words(jqueryElement) {
    log(jqueryElement.val());
    var success = true;
    if (success) {
        scrollTo($('#game_turn'));
    }
}

/* Step functions */
function hatgame_check_my_turn() {
    var myTurn = true;
    if (myTurn) {
        state_checking_turn = false;
        $('#hatgame_turn_other').hide();
        $('#hatgame_turn_me').show();
    }
}

/**
 * Receive first word, and start timer countdown.
 * Sets callback on timeout, to clean up UI and send turn results to server
 */
function hatgame_start_turn() {
    log('Start my turn');
    activateTimer($('#turn_timer'));
    setTimeout(function() {    
        stopTimer();
    }, state_turn_time_sec * 1000);
}

function hatgame_next_word() {

}

function hatgame_end_turn() {
    /* send turn results */
    state_checking_turn = true;
}
/* UI configs */
function set_ui_state_pre_room() {
    log('set pre_room layout');    
    $('#room_find').addClass('leftfloat').show();
    $('#room_create_enter').addClass('maintab').show();
    $('#room_info').hide();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').hide();
    $('#game_aftermath').hide();
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

function setUIlayout(layout) {
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

function init() {
    var startingLayout = const_ui_state_pre_room;
    setUIlayout(startingLayout);
}

$(document).ready(function () {
    log("Page loaded");
    init();
    log("State intialized");
});
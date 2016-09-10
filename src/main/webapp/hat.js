/* Hat code */
/* Common functions */
function log(message) {
    $("#log").append('<div>' + message + '</div>');
}

/* Room management functions */
function room_create() {
    var room_name = document.getElementById("room_name").value;
    var room_pass = document.getElementById("room_pass").value;
    var player_name = document.getElementById("player_name").value;
    alert('Create room' + room_name + ' ' + room_pass + ' ' + player_name);
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
    alert('Enter room' + room_name + ' ' + room_pass + ' ' + player_name);
    return;
}
/* Game functions */
function hatgame_start_new_game(room_name, word_per_player, seconds_per_turn) {
    log('hatgame_start_new_game('+room_name+', '+word_per_player+', '+seconds_per_turn+')');
}

function hatgame_check_new_game() {
    
}

/* Word generation functions */
/* Step functions */

/* UI configs */

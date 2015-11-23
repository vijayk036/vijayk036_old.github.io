/*
 * Please see the included README.md file for license terms and conditions.
 */


// This file is a suggested starting place for your code.
// It is completely optional and not required.
// Note the reference that includes it in the index.html file.


/*jslint browser:true, devel:true, white:true, vars:true */
/*global $:false, intel:false app:false, dev:false, cordova:false */



// This file contains your event handlers, the center of your application.
// NOTE: see app.initEvents() in init-app.js for event handler initialization code.

// function myEventHandler() {
//     "use strict" ;
// // ...event handler code here...
// }


// ...additional event handlers here...
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// Documentation - www.RTCMultiConnection.org

var connection = new RTCMultiConnection();

connection.session = {
    audio: true,
    video: true
};

var roomsList = document.getElementById('rooms-list'),
    sessions = {};
connection.onNewSession = function (session) {
    if (sessions[session.sessionid]) return;
    sessions[session.sessionid] = session;

    var tr = document.createElement('tr');
    tr.innerHTML = '<td><strong>' + session.extra['session-name'] + '</strong> is an active session.</td>' +
        '<td><button class="join">Join</button></td>';
    roomsList.insertBefore(tr, roomsList.firstChild);

    tr.querySelector('.join').setAttribute('data-sessionid', session.sessionid);
    tr.querySelector('.join').onclick = function () {
        this.disabled = true;

        session = sessions[this.getAttribute('data-sessionid')];
        if (!session) alert('No room to join.');

        connection.join(session);
    };
};

var videosContainer = document.getElementById('videos-container') || document.body;
connection.onstream = function (e) {
    var buttons = ['mute-audio', 'mute-video', 'record-audio', 'record-video', 'full-screen', 'volume-slider', 'stop'];

    if (connection.session.audio && !connection.session.video) {
        buttons = ['mute-audio', 'full-screen', 'stop'];
    }

    var mediaElement = getMediaElement(e.mediaElement, {
        width: (videosContainer.clientWidth / 2) - 50,
        title: e.userid,
        buttons: buttons,
        onMuted: function (type) {
            connection.streams[e.streamid].mute({
                audio: type == 'audio',
                video: type == 'video'
            });
        },
        onUnMuted: function (type) {
            connection.streams[e.streamid].unmute({
                audio: type == 'audio',
                video: type == 'video'
            });
        },
        onRecordingStarted: function (type) {
            // www.RTCMultiConnection.org/docs/startRecording/
            connection.streams[e.streamid].startRecording({
                audio: type == 'audio',
                video: type == 'video'
            });
        },
        onRecordingStopped: function (type) {
            // www.RTCMultiConnection.org/docs/stopRecording/
            connection.streams[e.streamid].stopRecording(function (blob) {
                if (blob.audio) connection.saveToDisk(blob.audio);
                else if (blob.video) connection.saveToDisk(blob.video);
                else connection.saveToDisk(blob);
            }, type);
        },
        onStopped: function () {
            connection.peers[e.userid].drop();
        }
    });

    videosContainer.insertBefore(mediaElement, videosContainer.firstChild);

    if (e.type == 'local') {
        mediaElement.media.muted = true;
        mediaElement.media.volume = 0;
    }
};

connection.onstreamended = function (e) {
    if (e.mediaElement.parentNode && e.mediaElement.parentNode.parentNode && e.mediaElement.parentNode.parentNode.parentNode) {
        e.mediaElement.parentNode.parentNode.parentNode.removeChild(e.mediaElement.parentNode.parentNode);
    }
};

var setupNewSession = document.getElementById('setup-new-session');

setupNewSession.onclick = function () {
    setupNewSession.disabled = true;

    var direction = document.getElementById('direction').value;
    var _session = document.getElementById('session').value;
    var splittedSession = _session.split('+');

    var session = {};
    for (var i = 0; i < splittedSession.length; i++) {
        session[splittedSession[i]] = true;
    }

    var maxParticipantsAllowed = 256;

    if (direction == 'one-to-one') maxParticipantsAllowed = 1;
    if (direction == 'one-to-many') session.broadcast = true;
    if (direction == 'one-way') session.oneway = true;

    var sessionName = document.getElementById('session-name').value;
    connection.extra = {
        'session-name': sessionName || 'Anonymous'
    };

    connection.session = session;
    connection.maxParticipantsAllowed = maxParticipantsAllowed;

    if (!!document.querySelector('#fakeDataChannels').checked) {
        // http://www.rtcmulticonnection.org/docs/fakeDataChannels/
        connection.fakeDataChannels = true;
    }

    connection.sessionid = sessionName || 'Anonymous';
    connection.open();
};

connection.onmessage = function (e) {
    appendDIV(e.data);

    console.debug(e.userid, 'posted', e.data);
    console.log('latency:', e.latency, 'ms');
};

connection.onclose = function (e) {
    appendDIV('Data connection is closed between you and ' + e.userid);
};

connection.onleave = function (e) {
    appendDIV(e.userid + ' left the session.');
};

// on data connection gets open
connection.onopen = function () {
    if (document.getElementById('chat-input')) document.getElementById('chat-input').disabled = false;
    if (document.getElementById('file')) document.getElementById('file').disabled = false;
    if (document.getElementById('open-new-session')) document.getElementById('open-new-session').disabled = true;
};

var progressHelper = {};

connection.autoSaveToDisk = false;

connection.onFileProgress = function (chunk) {
    var helper = progressHelper[chunk.uuid];
    helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
    updateLabel(helper.progress, helper.label);
};
connection.onFileStart = function (file) {
    var div = document.createElement('div');
    div.title = file.name;
    div.innerHTML = '<label>0%</label> <progress></progress>';
    appendDIV(div, fileProgress);
    progressHelper[file.uuid] = {
        div: div,
        progress: div.querySelector('progress'),
        label: div.querySelector('label')
    };
    progressHelper[file.uuid].progress.max = file.maxChunks;
};

connection.onFileEnd = function (file) {
    progressHelper[file.uuid].div.innerHTML = '<a href="' + file.url + '" target="_blank" download="' + file.name + '">' + file.name + '</a>';
};

function updateLabel(progress, label) {
    if (progress.position == -1) return;
    var position = +progress.position.toFixed(2).split('.')[1] || 100;
    label.innerHTML = position + '%';
}

function appendDIV(div, parent) {
    if (typeof div === 'string') {
        var content = div;
        div = document.createElement('div');
        div.innerHTML = content;
    }

    if (!parent) chatOutput.insertBefore(div, chatOutput.firstChild);
    else fileProgress.insertBefore(div, fileProgress.firstChild);

    div.tabIndex = 0;
    div.focus();
}

document.getElementById('file').onchange = function () {
    connection.send(this.files[0]);
};

var chatOutput = document.getElementById('chat-output'),
    fileProgress = document.getElementById('file-progress');

var chatInput = document.getElementById('chat-input');
chatInput.onkeypress = function (e) {
    if (e.keyCode !== 13 || !this.value) return;
    appendDIV(this.value);

    // sending text message
    connection.send(this.value);

    this.value = '';
};

connection.connect();
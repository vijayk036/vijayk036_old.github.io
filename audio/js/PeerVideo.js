
// Compatibility shim
//navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;


//alert(navigator.getUserMedia);
// PeerJS object
var peercall = null;

//var peercall = new Peer({ debug: 3, host: '192.163.203.79', port: 9999, path: '' });
//alert(peercall.id);
//peercall.on('open', function () {
//    alert(peercall.id);
//    $('#my-id').text(peercall.id);
//});

//// Receiving a call
//peercall.on('call', function (call) {
//    // Answer the call automatically (instead of prompting user) for demo purposes
//    call.answer(window.localStream);
//    step3(call);
//});
//peercall.on('error', function (err) {
//    alert(err.message);
//    // Return to step 2 if error occurs
//    step2();
//});
// Click handlers setup
$(function () {
    $('#set-id').click(function () {

// This object will take in an array of XirSys STUN / TURN servers
// and override the original config object


if(typeof customConfig== "undefined"){
    var customConfig;
// Call XirSys ICE servers
$.ajax({
  url: "https://service.xirsys.com/ice",
  data: {
    ident: "vijay",
    secret: "983e4fa4-913f-11e5-8545-7b765b532a90",
    domain: "www.applitter.com",
    application: "default",
    room: "default",
    secure: 1
  },
  success: function (data, status) {
    // data.d is where the iceServers object lives
    customConfig = data.d;
    console.log(customConfig);
  },
  async: false
});
}
       // peercall = new Peer($('#set-callid').val(), { debug: 3, host: '192.163.203.79', port: 9999,config:customConfig});
       //
 peercall = new Peer($('#set-callid').val(), { debug: 3, host: '192.163.203.79', port: 8000,config: customConfig});
//peercall = new Peer({ key: '9a51f317-225f-48e9-b9f7-fc73f256788c',debug: 3,config: customConfig});
        peercall.on('open', function () {
            alert(peercall.id);
            $('#my-id').text(peercall.id);
        });

  navigator.getUserMedia({ audio: true, video: false }, function (stream) {
    // Set your video displays
    //console.log(stream);
    //console.log((URL || webkitURL || mozURL).createObjectURL(stream));



    //$('#my-video').prop('src', URL.createObjectURL(stream));
    //$('#my-video').prop('src', stream);

    window.localStream = stream;
}, function () { $('#step1-error').show(); });

        // Receiving a call
        peercall.on('call', function (call) {
            // Answer the call automatically (instead of prompting user) for demo purposes
            alert('on call');
            console.log(call);
            call.answer(window.localStream);
            step3(call);
        });
        peercall.on('error', function (err) {
            alert('on error ----' + err.message);
            // Return to step 2 if error occurs
            step2();
        });

    });

    $('#make-call').click(function () {
        // Initiate a call!

        var call = peercall.call($('#callto-id').val(), window.localStream);

        step3(call);
    });

    $('#end-call').click(function () {
        window.existingCall.close();
        step2();
    });

    // Retry if getUserMedia fails
    $('#step1-retry').click(function () {
        $('#step1-error').hide();
        step1();
    });

    // Get things started
    step1();
});

function step1() {
    // Get audio/video stream
    console.log('step1');
    console.log(navigator.getUserMedia);
        step2();
}

function step2() {
    console.log('step2');
    $('#step1, #step3').hide();
    $('#step2').show();
}

function step3(call) {
    console.log('step3');
    console.log(call);
    // Hang up on an existing call if present
    if (window.existingCall) {
        window.existingCall.close();
    }

    // Wait for stream on the call, then set peer video display
    call.on('stream', function (stream) {
        //$('#their-video').prop('src', (URL || webkitURL || mozURL).createObjectURL(stream));

          var audio = $('<audio autoplay />').appendTo('body');
    audio[0].src = (URL || webkitURL || mozURL).createObjectURL(stream);
    });

    // UI stuff
    window.existingCall = call;
    $('#their-id').text(call.peer);
    call.on('close', step2);
    $('#step1, #step2').hide();
    $('#step3').show();
}
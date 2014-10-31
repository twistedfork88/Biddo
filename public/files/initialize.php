<?php

// This a copy taken 2008-08-21 from http://siphon9.net/loune/f/ntlm.php.txt to make sure the code is not lost.
// For more information see:
// http://blogs.msdn.com/cellfish/archive/2008/08/26/getting-the-logged-on-windows-user-in-your-apache-server.aspx

// NTLM specs http://davenport.sourceforge.net/ntlm.html

$headers = apache_request_headers();
$remote =  $_SERVER["PHP_AUTH_USER"];
    print $remote;

if (!isset($headers['Authorization'])){
	header('HTTP/1.1 401 Unauthorized');
	header('WWW-Authenticate: NTLM');
	exit;
}

$auth = $headers['Authorization'];
$user = "";

if (substr($auth,0,5) == 'NTLM ') {
	$msg = base64_decode(substr($auth, 5));
	if (substr($msg, 0, 8) != "NTLMSSP\x00")
		die('error header not recognised');

	if ($msg[8] == "\x01") {
		$msg2 = "NTLMSSP\x00\x02"."\x00\x00\x00\x00". // target name len/alloc
			"\x00\x00\x00\x00". // target name offset
			"\x01\x02\x81\x01". // flags
			"\x00\x00\x00\x00\x00\x00\x00\x00". // challenge
			"\x00\x00\x00\x00\x00\x00\x00\x00". // context
			"\x00\x00\x00\x00\x30\x00\x00\x00"; // target info len/alloc/offset

		header('HTTP/1.1 401 Unauthorized');
		header('WWW-Authenticate: NTLM '.trim(base64_encode($msg2)));
		exit;
	}
	else if ($msg[8] == "\x03") {
		function get_msg_str($msg, $start, $unicode = true) {
			$len = (ord($msg[$start+1]) * 256) + ord($msg[$start]);
			$off = (ord($msg[$start+5]) * 256) + ord($msg[$start+4]);
			if ($unicode)
				return str_replace("\0", '', substr($msg, $off, $len));
			else
				return substr($msg, $off, $len);
		}
		$user = get_msg_str($msg, 36);
		$domain = get_msg_str($msg, 28);
		$workstation = get_msg_str($msg, 44);

		//print "You are $user from $workstation.$domain";
	}
}
else{
    $remote = $_SERVER['REMOTE_USER'];
    print $remote;
}

?>

<!DOCTYPE html>
<html>
    <!-- MEMO: update me with `git checkout gh-pages && git merge master && git push origin gh-pages` -->
    <head>
        <meta charset="utf-8">
        <title>SAP Biddo</title>
        
        <link href='//fonts.googleapis.com/css?family=Open+Sans:300' rel='stylesheet' type='text/css'>
        <link href='//fonts.googleapis.com/css?family=Montserrat:700' rel='stylesheet' type='text/css'>  
        
        <link rel="shortcut icon" href="https://cdn2.iconfinder.com/data/icons/money-finance/512/auction-hammer-512.png">
        
        <style type="text/css">
            body{
                background: #f1f1f1;
                font-family: "Montserrat", sans-serif;
            }
            
            .container{
                margin: 3rem auto;
                width: 70%;
                text-align: center;
            }
            
            .container .boxes{
                margin: auto;
                width: 300px;
                height: 300px;
            }
            
            .boxes div{
                width: 150px;
                height: 150px;
                float: left;
                background-color: #03a9f4;
                opacity: 0;
            }
            
            .boxes div:first-child{
                opacity: 1;
            }
            
            h1{
                font-size: 7rem;
                line-height: 6rem;
            }
            
        </style>
        
    </head>
    <body>
        <div class="container">
            <div class="boxes">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <h1>initializing...</h1>
        </div>
        <script src="./files/js/jquery-1.10.2.min.js"></script>
        <script>
            var child = [1, 2, 4, 3];
            var colors = ['#03a9f4', '#01579b', '#ff5722', '#009688'];
            var count = 0;
            var colcount = 1;
            setInterval(function(){
                $('.boxes div:nth-child('+child[count]+')').animate({opacity:0}, 200);
                ++count;
                if(count === 4)count = 0;
                $('.boxes div:nth-child('+child[count]+')').animate({opacity:1}, 200);
            }, 150);
            
            setInterval(function(){
                console.log('changind color...')
                $('.boxes div').css('background-color', colors[colcount++]);
                if(colcount === 4)colcount = 0;
            }, 1500);
            
            setTimeout(function(){
                $('h1').fadeOut('fast', function(){
                    $(this).text('determining your identity... '+<?php $user; ?>);
                    $(this).fadeIn('fast');
                    setTimeout(function(){
                        window.location.href='/index'
                    }, 3000)
                });
                
            }, 5000)
     
        </script>
    </body>
</html>
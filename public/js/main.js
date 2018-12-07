var serverUrl = "http://localhost:3000"

/* Generates Unique Id*/
function uniqueId() {
	var i = new Date().getTime();
	i = i & 0xffff; 
	return i;
}

function createUser(){
	var data = new Object();
	data._id = "org.couchdb.user:" + $('#reg_username')[0].value;
	data.name = $('#reg_username')[0].value;
	data.type = "user";
	data.roles = [];
	data.password = $('#reg_password')[0].value;
	data.userId = uniqueId();
	data.email = $('#email')[0].value;
	data.displayname = $('#fname')[0].value;
	data.department = $('#department')[0].value;
	data.reputation = 0;

	if(data.name != "" && data.password != "" && data.email != "" && data.displayname != "" && data.department != "") {
	    var request = $.ajax({
			url: serverUrl + "/createUser",
			method: "POST",
			data: JSON.stringify(data),
			headers:{
				"Content-type":"application/x-www-form-urlencoded",
				"Content-length":data.length,
				"Connection":"close"
			}
		});

		request.done(function(status) {
			console.log("user created successfully %o", status);
			$('.register-form')[0].reset();
			if(status.isUserCreated){
				$("#successPlaceholder").removeClass("hide");
				$("#errorPlaceholder").addClass("hide");
			}		
			else {
				if(status.isDuplicateUser)
					$('#errorPlaceholder .errorText').html("Username is already in use. Choose a different one!");
				$("#errorPlaceholder").removeClass("hide");
				$("#successPlaceholder").addClass("hide");
			}
				
		});	 
		request.fail(function( jqXHR, textStatus ) {
		  console.log("user creation failed" + textStatus );
		  $('#errorPlaceholder').removeClass("hide");
		});
	}
	else {
		$('#errorPlaceholder .errorText').html("All fields are mandatory. Please fill all the fields to proceed.");
		$("#errorPlaceholder").removeClass("hide");
		$("#successPlaceholder").addClass("hide");
	}
	
};


var authenticateUser = function(){
    var data = new Object();
    data.username = $('#username')[0].value;
    data.password = $('#password')[0].value;

    if(data.username != "" && data.password != ""){
    	var request = $.ajax({
    		url : serverUrl + "/authenticateUser",
	    	method: "POST",
	    	data : JSON.stringify(data),
	    	headers:{
				"Content-type":"application/x-www-form-urlencoded",
				"Content-length":data.length,
				"Connection":"close"
			}
    	});
	    request.done(function(status) {
			console.log("logged in successfully %o", status.currentUser);
			if(status.isAuthenticated){
				if($.inArray("professor", status.currentUser.roles) != -1)
					localStorage.setItem("isProfessor", true);
				else
					localStorage.setItem("isProfessor", false);
				localStorage.setItem("loggedInUser", JSON.stringify(status.currentUser));
				// window.location.href = "/static/design/home.html";
				window.location.href = "/static/design/myProfile.html";
			}
			else {
				$('#errorPlaceholder').removeClass("hide");
			}
		});	 
		request.fail(function( jqXHR, textStatus ) {
		  console.log( "login failed: " + textStatus );
		});
    }
    else{
    	$('#errorPlaceholder .errorText').html("All fields are mandatory. Please fill all the fields to proceed.");
		$("#errorPlaceholder").removeClass("hide");
		$("#successPlaceholder").addClass("hide");
    }
    
};

var goToLeaderBoard = function(){
	window.location.href = "/static/design/leaderBoard.html";
}

var goToProfile = function(){
	window.location.href = "/static/design/myProfile.html";
}

var validateSession = function(){
	if(localStorage.getItem("loggedInUser") == "" || localStorage.getItem("loggedInUser") == null){
		window.location.href = "/static/design/login.html"	
	}
}

var clearSession = function(){
	localStorage.clear();
	window.location.href = "/static/design/login.html"
}
// var serverUrl = "http://localhost:3000"
var serverUrl = "wolfie-forum.herokuapp.com"

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
			if(status.isAuthenticated){
				console.log("logged in successfully %o", status.currentUser);
				if($.inArray("professor", status.currentUser.roles) != -1)
					localStorage.setItem("isProfessor", true);
				else
					localStorage.setItem("isProfessor", false);
				localStorage.setItem("loggedInUser", JSON.stringify(status.currentUser));
				window.location.href = "/static/design/home.html";
				$('.login-form')[0].reset();
			}
			else {
				console.log("inside fail")
    			$('#errorholder .errorText').html("Login failed!");
				$('#errorholder').removeClass("hide");
			}
		});	 
		request.fail(function( jqXHR, textStatus ) {
		  console.log( "login failed: " + textStatus );
		});
    }
    else{
		$('#errorholder .errorText').html("username/password is incorrect.");
		$('#errorholder').removeClass("hide");
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

var postQuestion = function(){
	var data = new Object();
	data.title = $("#title")[0].value;
	data.category = $('#categoryDropdown')[0].value;
	data.tags = $("#questionTags").selectivity('data');
	data.type = "question";
	data.question = CKEDITOR.instances.questionDesc.getData();
	data.userId = JSON.parse(localStorage.getItem("loggedInUser")).userId;
	data.user = JSON.parse(localStorage.getItem("loggedInUser")).name;
	data.displayname = JSON.parse(localStorage.getItem("loggedInUser")).displayname;
	data.timeStamp = new Date();
	data.questionId = uniqueId();
	console.log("data----",JSON.stringify(data))
	if(data.title != "" && data.tags != "" && data.category != "" && data.question != ""){
		var request = $.ajax({
			url : serverUrl + "/postQuestion",
			method: "POST",
			data : JSON.stringify(data), 
			headers:{
				"Content-type":"application/x-www-form-urlencoded",
				"Content-length":data.length,
				"Connection":"close"
			}
		});

		request.done(function(status){
			console.log("question posted %o", status);
			CKEDITOR.instances.questionDesc.setData("");
			$("#questionForm")[0].reset();
			$("#questionTags").selectivity('clear');
			$("#successPlaceholder").removeClass("hide");
			window.scrollTo(100,0);
		});

		request.fail(function(status){
			console.log("question post failed %o", status);
		});
	}
	else {
		$('#errorPlaceholder .errorText').html("All fields are mandatory. Please fill all the fields to proceed.");
		$("#errorPlaceholder").removeClass("hide");
		$("#successPlaceholder").addClass("hide");
	}
	
}

var loadQuestionsTable = function(){

	var request = $.ajax ({
		url: serverUrl + "/getAllQuestions",
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		var questions = [];
		for (var i=0; i< data.length; i++){
			var questionArr = [];
			var questionId = data[i].value.questionId;
			questionArr.push(questionId);
			questionArr.push(constructQuestionData(data[i].value));
			questions.push(questionArr);
		}

		$('#questionsTableWrapper').empty();
		$('#questionsTableWrapper').append("<table class=\"display\" width=\"100%\" id=\"questionsDTable\"></table>");
		$('#questionsDTable').DataTable({
	    	"bLengthChange": false,
	    	"pageLength": 10,
	        data: questions, 
	        columns: [
	        	{ title : "QuestionId"}
	        ],
	        "columnDefs": [
		        {
			        "targets": [ 0 ],
			        "visible": false,
			        "searchable": false
		    	},
		        { 
			        "targets": [ 1 ],
			        "render": function (data, type, row) {
			    	    return data;
			    	}
	            }
	        ]
	    });

	    $("#loader")[0].style.display = "none";
	});
}

var constructQuestionData = function(data){
	// construct tags markup 
	var tagStr = "";
	if(data.tags != "" && data.tags != null){
		for(var i=0; i< data.tags.length;i++){
			tagStr += '<a href="#" class="post-tag js-gps-track" title="" rel="tag">'+ data.tags[i].text + '</a>';
		}
	}

	// calculate time difference 
	var timeStamp = getTimeDiff(new Date(data.timeStamp));

	var displayname = data.displayname;
	if(displayname == undefined || displayname == null || displayname == "")
		displayname = data.user;

	// question markup for dataTable
	var questionStr = '<div class="left pr20">' +
		                    '<div class="quesTitle"><a class="link clblue" onclick=openQuestionView(' + data.questionId +')>' + data.title +'</a></div>'+
		                    '<div class="post-taglist">' + tagStr + '</div>' + 
		                    '</div>'+
			    			'<div class="right action-links">' + 
			    			'<div class="post-signature owner" style="display:inline-block">' + 
		                    '<div class="user-info ">' + 
		                    '<div class="user-action-time">' + 
		                    'asked <span title="2016-02-22 14:02:45Z" class="relativetime">'+ timeStamp + '</span>' + 
		                    '</div>' + 
		                    '<div class="user-gravatar32">' + 
		                    '<a href="#"><div class="gravatar-wrapper-32"><img src="https://www.gravatar.com/avatar/335a9ae9364e36c131fb599feaf0e540?s=32&amp;d=identicon&amp;r=PG&amp;f=1" alt="" width="32" height="32"></div></a>' +
		                    '</div>' +
		                    '<div class="user-details">' + 
		                    '<a href="#">'+ displayname +'</a>' +  
		                    '</div>' + 
		                    '</div></div>'
							'</div>';
	return questionStr;
}

var constructAnswerData = function(data){

	// calculate time difference 
	var timeStamp = getTimeDiff(new Date(data.timeStamp));

	// question markup for dataTable
	var validateStr = "";
	if(data.isValidated)
		validateStr = '<a class="star-on" title="validated byProf. '+ data.validatedBy +'"></a>';
	else if(localStorage.getItem("isProfessor") == "true"){
			validateStr = '<a userId="'+ data.user + '" id="'+ data.answerId +'" class="star-off" title="Click here to validate this answer" onclick=validateAnswer('+ data.answerId +')></a>';
	}

	var displayname = data.displayname;
	if(displayname == undefined || displayname == null || displayname == "")
		displayname = data.user;
		
	var voteStr = '<div class="vote">'+
	              '<a userId="'+ data.user + '" id="'+ data.answerId +'" class="vote-up-off" onclick=updateAnswerVote('+ data.answerId + ',' + true + ')>up vote</a>'+
	              '<span id="votes'+ data.answerId+'" class="vote-count-post ">'+ data.votes +'</span>'+
	              '<a userId="'+ data.user + '" id="'+ data.answerId +'" class="vote-down-off" onclick=updateAnswerVote('+ data.answerId  + ',' + false +')>down vote</a>'+
	               validateStr + '</div>';

	if(data.userId == JSON.parse(localStorage.getItem("loggedInUser")).userId)
		voteStr = '<div class="vote">'+
	              '<a userId="'+ data.user + '" id="'+ data.answerId +'" class="vote-up-off">up vote</a>'+
	              '<span id="votes'+ data.answerId+'" class="vote-count-post ">'+ data.votes +'</span>'+
	              '<a userId="'+ data.user + '" id="'+ data.answerId +'" class="vote-down-off">down vote</a>'+
	               validateStr + '</div>';

	var answerStr = '<div class="left pr20 answerBlock">' + voteStr +

		                    '<div class="answerText">' + data.answer +'</div>'+
		                    '</div>'+
			    			'<div class="right action-links">' + 
			    			'<div class="post-signature-answer owner" style="display:inline-block">' + 
		                    '<div class="user-info ">' + 
		                    '<div class="user-action-time">' + 
		                    'answered <span title="2016-02-22 14:02:45Z" class="relativetime">'+ timeStamp + '</span>' + 
		                    '</div>' + 
		                    '<div class="user-gravatar32">' + 
		                    '<a href="#"><div class="gravatar-wrapper-32"><img src="https://www.gravatar.com/avatar/335a9ae9364e36c131fb599feaf0e540?s=32&amp;d=identicon&amp;r=PG&amp;f=1" alt="" width="32" height="32"></div></a>' +
		                    '</div>' +
		                    '<div class="user-details">' + 
		                    '<a href="#">'+ displayname +'</a>' +  
		                    '</div>' + 
		                    '</div></div>'
							'</div>';
	return answerStr;
}


function getTimeDiff(datetime){

	var olderDate = new Date(datetime);
	var currentDate = new Date();
  	var diff = currentDate - olderDate;	
  	var secDiff = Math.floor(diff / 1e3);
  	var minDiff = Math.floor(diff / 60e3);
  	var hourDiff = Math.floor(diff/(3600 * 1000));
  	var dayDiff = Math.floor(diff/(1000 * 24 * 3600));

    if (dayDiff > 0)
    	dateStr = dayDiff + " days ago";
    else if (hourDiff > 0)
    	dateStr = hourDiff + " hours ago";
    else if(minDiff > 0)
    	dateStr = minDiff + " minutes ago";
    else 
    	dateStr = secDiff + " seconds ago";
    return dateStr;
}

function openQuestionView(questionId){
	console.log("sadasds----",questionId)
	localStorage.setItem("currentQuestionId", questionId);
	window.location.href = "/static/design/questionView.html"
}

var loadQuestionData = function(){
	console.log("into load",localStorage.getItem("currentQuestionId"))
	var request = $.ajax ({
		url: serverUrl + "/getQuestionData?questionId="+localStorage.getItem("currentQuestionId"),
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		console.log("current question", data);
		$("#questionTitle").text(data.value.title);
		$("#questionDesc").html(jQuery.parseHTML(data.value.question));

		localStorage.setItem("currentQueCat", data.value.category);
		
		var tagStr = "";
		if(data.value.tags != undefined || data.value.tags != null || data.value.tags != ""){
			for(var i=0; i< data.value.tags.length;i++){
				tagStr += '<a href="#" class="post-tag js-gps-track" title="" rel="tag">'+ data.value.tags[i].text + '</a>';
			}
		}
		
		var displayname = data.value.displayname;
		if(displayname == undefined || displayname == null || displayname == "")
			displayname = data.value.user;

		$("#questionTags").html(tagStr);
		$("#timeStamp").text(getTimeDiff(new Date(data.value.timeStamp)));
		$("#userName").text(displayname);

	});	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log("getting tags failed" + textStatus);
	});
}


var postAnswer = function(){
	var data = new Object();
	data.type = "answer";
	data.answer = CKEDITOR.instances.questionAnswer.getData();
	data.userId = JSON.parse(localStorage.getItem("loggedInUser")).userId;;
	data.user = JSON.parse(localStorage.getItem("loggedInUser")).name;
	data.displayname = JSON.parse(localStorage.getItem("loggedInUser")).displayname;
	data.timeStamp = new Date();
	data.questionId = parseInt(localStorage.getItem("currentQuestionId"));
	data.answerId = uniqueId();
	data.votes = 0;
	data.isValidated = false;
	data.validatedBy = "";
	data.category = localStorage.getItem("currentQueCat");
	console.log(JSON.stringify(data))
	if(data.answer != ""){
		var request = $.ajax({
			url : serverUrl + "/postAnswer",
			method: "POST",
			data : JSON.stringify(data), 
			headers:{
				"Content-type":"application/x-www-form-urlencoded",
				"Content-length":data.length,
				"Connection":"close"
			}
		});

		request.done(function(status){
			console.log("answer posted %o", status);
			CKEDITOR.instances.questionAnswer.setData("");	
			$("#successPlaceholder").removeClass("hide");
			window.scrollTo(100,0);
			loadAnswersTable();
		});

		request.fail(function(status){
			console.log("answer post failed %o", status);
			$("#errorPlaceholder").removeClass("hide");
			window.scrollTo(100,0);
		});
	}
	else {
		$('#errorPlaceholder .errorText').html("Please fill the answer field to proceed.");
		$("#errorPlaceholder").removeClass("hide");
		$("#successPlaceholder").addClass("hide");
	}

}

var loadAnswersTable = function(){
	var request = $.ajax ({
		url: serverUrl + "/getQuestionAnswers?questionId="+localStorage.getItem("currentQuestionId"),
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		var answers = [];
		console.log("p---",JSON.stringify(data[0]));
		for (var i=0; i< data.length; i++){
			var answerArr = [];
			answerArr.push(data[i].value.answerId);
			answerArr.push(constructAnswerData(data[i].value));
			answers.push(answerArr);
		}

		$('#answersTableWrapper').empty()
		if(answers.length>0){
			$('#answersTableWrapper').append("<table class=\"display\" width=\"100%\" id=\"answersDTable\"></table>");
			$('#answersDTable').DataTable({
		    	"bLengthChange": false,
		    	"pageLength": 10,
		        data: answers, 
		        columns: [
		        	{ title : "answerId"}
		        ],
		        "columnDefs": [
			        {
				        "targets": [ 0 ],
				        "visible": false,
				        "searchable": false
			    	},
			        { 
				        "targets": [ 1 ],
				        "render": function (data, type, row) {
				    	    return data;
				    	}
		            }
		        ]
		    });
		}
	});
}

var updateAnswerVote = function(answerId, isIncVote){
	console.log("hello %o" , answerId, isIncVote);
	var userId = $('#' + answerId).attr('userid');
	var request = $.ajax ({
		url: serverUrl + "/updateAnswerVotes?answerId=" + answerId + "&isIncVote=" + isIncVote + "&userId="  + userId,
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		$("#votes"+answerId).text(data.updatedVoteCount);
	});
}

var validateAnswer = function(answerId){
	console.log("%o", answerId, $("#" + answerId));
	var userId = $('#' + answerId).attr('userid');
	var profName = JSON.parse(localStorage.getItem("loggedInUser")).displayname;
	var request = $.ajax ({
		url: serverUrl + "/validateAnswer?answerId=" + answerId + "&validatedBy=" + profName + "&userId="  + userId,
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		console.log("%o", data);
		loadAnswersTable();
	});
}

var loadUserProfile = function(){
	console.log("loadingUserProfile");
	var username = JSON.parse(localStorage.getItem("loggedInUser"));
	$('#userProfileWrapper').empty()
	$('#userProfileWrapper').append("<table class=\"display\" width=\"100%\" id=\"profileInfoTable\"></table>");
	$('#profileInfoTable').DataTable({
    	"bLengthChange": false,
    	"pageLength": 10,
        "ajax":serverUrl+ "/loadUserProfile?loggedInUserId="+JSON.parse(localStorage.getItem("loggedInUser")).userId,
        	    
   "columns":[
 {   data : "userid"},
   {   data :"doctype"},
   {   data : "category"},
   {   data : "count"},
],
       "columnDefs": [
	      {
        "targets": [ 0 ],	
        "visible": false,
        "searchable": false
   	}]


})
}


var loadRecentQuestionsTable = function(){
	var request = $.ajax ({
		url: serverUrl + "/recentQuestions?loggedInUserId="+JSON.parse(localStorage.getItem("loggedInUser")).userId,
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		var questions = [];
		// console.log(JSON.stringify(data))
		for (var i=0; i< data.length; i++){
			var questionArr = [];
			var questionId = data[i].value.questionId;
			questionArr.push(questionId);
			questionArr.push(constructQuestionData(data[i].value));
			questions.push(questionArr);
		}

		console.log("questions array %o", questions);
		$('#userRecentQuestionsWrapper').empty()

			$('#userRecentQuestionsWrapper').append("<table class=\"display\" width=\"100%\" id=\"recentQuestionsTable\"></table>");
			$('#recentQuestionsTable').DataTable({
		    	"bLengthChange": false,
		    	"pageLength": 3,
		        data: questions, 
		        "aaSorting": [],
		        columns: [
		        	{ title : "QuestionId"}
		        ],
		        "columnDefs": [
			        {
				        "targets": [ 0 ],
				        "visible": false,
				        "searchable": false
			    	},
			        { 
				        "targets": [ 1 ],
				        "render": function (data, type, row) {
				    	    return data;
				    	}
		            }
		        ]
		    });
	});
}



var loadRecentAnswersTable = function(){
	var request = $.ajax ({
		url: serverUrl + "/getQuestionIdsForRecentAnswers?loggedInUserId="+JSON.parse(localStorage.getItem("loggedInUser")).userId,
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function (data) {
		// console.log("questions %o", data);
		var questions = [];
		for (var i=0; i< data.length; i++){
			var questionArr = [];
			var questionId = data[i].value.questionId;
			questionArr.push(questionId);
			questionArr.push(constructQuestionData(data[i].value));
			questions.push(questionArr);
		}

		// console.log("questions array %o", questions);
		$('#userRecentAnswersWrapper').empty()
		// if(questions.length>0){
		$('#userRecentAnswersWrapper').append("<table class=\"display\" width=\"100%\" id=\"recentAnswersTable\"></table>");
		$('#recentAnswersTable').DataTable({
	    	"bLengthChange": false,
	    	"pageLength": 3,
	        data: questions, 
	        "aaSorting": [],
	        columns: [
	        	{ title : "QuestionId"}
	        ],
	        "columnDefs": [
		        {
			        "targets": [ 0 ],
			        "visible": false,
			        "searchable": false
		    	},
		        { 
			        "targets": [ 1 ],
			        "render": function (data, type, row) {
			    	    return data;
			    	}
	            }
	        ]
	    });
	// }
	});
}

var loadLeaderBoard = function(){
	console.log("loading leaderBoard");
	var username = JSON.parse(localStorage.getItem("loggedInUser"));
	
	var request = $.ajax ({
		url: serverUrl + "/leaderBoard",
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function (status) {
		console.log(status);
		$('#leaderBoardWrapper').empty()
		$('#leaderBoardWrapper').append("<table class=\"display\" width=\"100%\" id=\"leaderBoardTable\"></table>");
		$('#leaderBoardTable').DataTable({
	    	"bLengthChange": false,
	    	"pageLength": 10,
	        "aaSorting":[],
	        responsive: true,
	        fixedHeader: true,
	        data:status,
	       	columns: [
	       	      {title : "Rank", "width": "30%"}, 
		          {title : "Wolfie", "width": "35%"}, 
		          {title: "Reputation", "width": "35%"}
		     ],   
		    //"columns":[{"data":"user"},{"data":"reputation"}],
		    "columnDefs": [{
				targets: '_all', visible: true 
   			}], 
   			"order": [[ 0, 'asc' ]]
		});
		$("#loader")[0].style.display = "none";
	});
}

function initializeSelectivityForQuestionTags(){

	var request = $.ajax ({
		url: serverUrl + "/getAllTags",
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		var items = [];
		for(i=0;i<data.length;i++){
			var item = {
				id: data[i].key, 
				text: data[i].value.tagName
			};
			// console.log("ir----",item)
			items.push(item);
		}
		// console.log("inside neede---",items)
		$('#questionTags').selectivity({
			items: items,
			multiple: true,
		   	placeholder: 'Tags',
		   	createTokenItem: function(token){
		   	 	$('.selectivity-multiple-input').val("");
		   	 	var itemArray = $('#questionTags').selectivity('data');
		   	 	// When there are no categories in the system
		   	 	if(itemArray == ""){
		   	 		$('#questionTagsForm #tags').val(token);
	   	 			var tagId = addTag(token);
			   	 	var pluginItem = {
						id: tagId,
						text: token
					};
					// Refresh the selectivty since new session category has been added to the system
					initializeSelectivityForQuestionTags();
					return pluginItem;
		   	 	}
		   	 	// Session categories are available : Some are already selected
		   	 	else{
		   	 		// Get the item text values from itemArray
		   	 		var itemTexts = [];
		   	 		for(i in itemArray){
		   	 			itemTexts.push(itemArray[i].text);
		   	 		}
		   	 		// Check if the token is already selected/avaialble in the system
		   	 		if(itemTexts.indexOf(token)!=-1){
		   	 			// Don't add, clear the input field
		   	 			return null;
		   	 		} else {
		   	 			// Add it to JCR
		   	 			$('#questionTagsForm #tags').val(token);
		   	 			var tagId = addTag(token);
				   	 	var pluginItem = {
							id: tagId,
							text: token
						};
						// Refresh the selectivty since new session category has been added to the system
						initializeSelectivityForQuestionTags();
						return pluginItem;
		   	 		}
		   	 	}
		   	 	
		   	}
		});
	});	
}

function getTags() {
	var request = $.ajax ({
		url: serverUrl + "/getAllTags",
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
	    return data;
	});	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log("getting tags failed" + textStatus);
	});
}

function addTag(tagName) {
  	var tagId = uniqueId();
  	var data = new Object();
  	data.tagId = tagId;
  	data.type = "tag";
  	data.tagName = tagName;

  	var request = $.ajax({
		url: serverUrl + "/createTag",
		method: "POST",
		data: JSON.stringify(data),
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Content-length":data.length,
			"Connection":"close"
		}
	});
	request.done(function(status) {
		console.log("tag created successfully %o", status);
	});	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log("tag creation failed" + textStatus);
	});
	return tagId;
}
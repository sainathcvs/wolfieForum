const express = require('express');
var Request = require('request')
var app = express();

// nano config 
// var nano = require('nano')('http://127.0.0.1:5984/');
var nano = require('nano')('https://couchdb-a714c9.smileupps.com/');
var user = nano.db.use('_users');
var wolfie = nano.db.use("wolfie");

app.use('/static',express.static(__dirname + '/public'));

port = process.env.PORT || 3000
app.listen(port, function(){
  console.log("Server listening on port 3000!");
});

//constants
var questionPoints = 1;
var answerPoints = 5;
var profValidationPoints = 10;
var upvotePoints = 2;
var downvotePoints = -2;

app.get('/', (req, res) => {
	res.redirect('/static/design/login.html')
});


// create new user
app.post('/createUser', function (req, res) {
   if (req.method == 'POST') {
      
      var jsonString = '';
      req.on('data', function (data) {
          jsonString += data;
      });
      
      req.on('end', function () {
        postParam = JSON.parse(jsonString);
        console.log("postParam" + postParam);

        user.insert(postParam, function(err, body) {
          var msg = new Object();
          // users table insert successfull 
          if (!err){
            delete postParam.password;
            wolfie.insert(postParam, function(err1, body1) {
              // wolfie table insert successfull 
              if(!err1){
                msg.isUserCreated = true;
                msg.isDuplicateUser = false;
                res.send(msg);
              }
              else {
                console.log(err1);
                msg.isUserCreated = false;
                if(err1.statusCode == 409)
                  msg.isDuplicateUser = true;
                res.send(msg);
              }
            });
          }
          else { 
            console.log(err);
            msg.isUserCreated = false;
            if(err.statusCode == 409)
              msg.isDuplicateUser = true;
            res.send(msg);
          }
        });
      });
    }
});

// authenticate user credentials
app.post('/authenticateUser', function(req,res){
  var jsonString = '';
  req.on('data', function (data) {
      jsonString += data;
  });

  req.on('end', function () {
    postParam = JSON.parse(jsonString);
    console.log('post params: ' + postParam.username, postParam.password);
    nano.auth(postParam.username, postParam.password, function (err, body, headers) {
      var response = new Object();
      if (err) {
        console.log("authentication failed");
        response.isAuthenticated = false;
        res.send(response);
      }
      else if (headers && headers['set-cookie']) {
        wolfie.view('wolfieDesignDoc', 'userView', { key: postParam.username }, function(err, body) {
        if (!err) {
        	console.log(JSON.stringify(body))
          console.log(body.rows[0].value.name);
          response.isAuthenticated = true;
          response.currentUser = body.rows[0].value;
          console.log("response---",JSON.stringify(response))
          res.send(response);
        }
        else {
          console.log(err);
        }
        });         
      }
    });
  });
});

var updateUserReputation = function (userId, points) {
  console.log("updateUserReputation %o", userId , points );
  wolfie.view('wolfieDesignDoc', 'userView', { key: userId }, function(err, body) {
    if (!err) {
      console.log("%o", body);
      var user = body.rows[0].value;
      user.reputation += points;
      wolfie.insert(user, function(egetAllTagsrr, body){
        console.log("user reputation update status %o", err, body);
      });
    }
    else {
      console.log(err);
    }
  });
}

// post a new question 
app.post("/postQuestion", function(req,res){
  var jsonString = '';
      req.on('data', function (data) {
          jsonString += data;
      });      
      req.on('end', function () {
        postParam = JSON.parse(jsonString);
        wolfie.insert(postParam, function(err, body){
          updateUserReputation(postParam.user, questionPoints);
          var response = new Object();
          response.isQuestionCreated = true;
          res.send(response);
        });
      });
});


// post a new question 
app.post("/postAnswer", function(req,res){
  var jsonString = '';
      req.on('data', function (data) {
          jsonString += data;
      });      
      console.log("pp---",JSON.stringify(jsonString))
      req.on('end', function () {
      	console.log("inside postAnswer----")
        postParam = JSON.parse(jsonString);
        wolfie.insert(postParam, function(err, body){
          updateUserReputation(postParam.user, answerPoints);
          var response = new Object();
          response.isAnswerPosted = true;
          res.send(response);
        });
      });
});

app.get("/updateAnswerVotes", function(req, res){
  console.log("query params: " + req.query.answerId, req.query.isIncVote)
  wolfie.view('wolfieDesignDoc', 'answerDataView', { key: parseInt(req.query.answerId) }, function(err, body) {
    if (!err) {
      console.log("%o", body);
      var answer = body.rows[0].value;
      if(req.query.isIncVote == "true"){
        updateUserReputation(req.query.userId, upvotePoints);
        answer.votes = answer.votes + 1;
      }
       
      else {
        updateUserReputation(req.query.userId, downvotePoints);
        answer.votes = answer.votes - 1;
      }
        
      wolfie.insert(answer, function(err1, body1){
        console.log("%o", err1, body1);
        var response = {"updatedVoteCount" : answer.votes}
        res.send(response);
      });
    }
    else {
      console.log(err);
    }
  });
});


// get data for a particular question
app.get("/getQuestionData", function(req, res){
  wolfie.view('wolfieDesignDoc', 'questionDataView', { key: parseInt(req.query.questionId) }, function(err, body) {
    if (!err) {
      res.send(body.rows[0]);
    }
    else {
      console.log(err);
    }
  });
});

// get all questions
app.get("/getAllQuestions", function(req, res){
  wolfie.view('wolfieDesignDoc', 'questionView', function(err, body) {
    if (!err) {
      res.send(body.rows);
    }
    else {
      console.log(err);
    }
  });
});

// get all answers of a question 
app.get("/getQuestionAnswers", function(req, res){
  wolfie.view('wolfieDesignDoc', 'answerView', { key: parseInt(req.query.questionId) }, function(err, body) {
    if (!err) {
      res.send(body.rows);
    }
    else {
      console.log(err);
    }
  });
});

//get most recent questions asked by logged in user
app.get('/recentQuestions', function(req,res){
  console.log("recentQuestions from couchdb  for user", req.query.loggedInUserId);
  nano.session(function(err, session) {
    if (err) { 
      return console.log('Looks like we dont have your session');
    }

  var loggedInUserId=parseInt(req.query.loggedInUserId);
  var params = {"startkey":[loggedInUserId, {}], "endkey":[loggedInUserId],"descending":true};
  wolfie.view('wolfieDesignDoc','recentQuestions',{"startkey":loggedInUserId, "endkey":loggedInUserId,"descending":true}, function(err, body) {
        if (err) { 
              console.log("recentQuestions failed");
            res.end("recentQuestions failed. " + err + "\n"); 
          } 
        else {
            // console.log("response %o" , body.rows);
            res.send(body.rows);
    }
  })
  });
});

//get most recent questions answered by logged in user
app.get('/getQuestionIdsForRecentAnswers', function(req,res){
  console.log("getQuestionIdsForRecentAnswers from couchdb  for user", req.query.loggedInUserId);
  nano.session(function(err, session) {
    if (err) {
      return console.log('Looks like we dont have your session');
    }

 
  //var loggedInUserId=user1;
  var loggedInUserId=parseInt(req.query.loggedInUserId);
  var params = {"startkey":[loggedInUserId,{}], "endkey":[loggedInUserId],"descending":true};
  wolfie.view('wolfieDesignDoc','getQuestionIdsForRecentAnswers',{"startkey":loggedInUserId, "endkey":loggedInUserId,"descending":true},function(err, body) {
	if (err) { 
	  console.log("getQuestionIdsForRecentAnswers failed");
	  res.end("getQuestionIdsForRecentAnswers failed. " + err + "\n"); 
	} 
	else {
        // console.log(body.rows);

        questionIdsForRecentAnswers = [];
        for(var i=0; i<body.rows.length; i++){
          if (questionIdsForRecentAnswers.indexOf(body.rows[i].value) == -1) 
            questionIdsForRecentAnswers.push(parseInt(body.rows[i].value));
        }


        // console.log("fetching questions now  ", questionIdsForRecentAnswers);
        // console.log("startkey",questionIdsForRecentAnswers[0]," ",questionIdsForRecentAnswers[questionIdsForRecentAnswers.length-1]);
        date=[];
        var params = {"keys":questionIdsForRecentAnswers}; 
       
        wolfie.view('wolfieDesignDoc','getQuestionsFromIds',{"keys":questionIdsForRecentAnswers},function(err, body) {
        
          if (err) { 
              console.log("getQuestionsFromIds failed");
              res.end("getQuestionsFromIds failed. " + err + "\n"); 
            } 
          else {
              // console.log(body.rows);
              res.send(body.rows);
              }

        })
	}
  })
  });
});


//leaderboard
app.get('/leaderboard', function(req,res){
  console.log("leaderboard from couchdb  for user", req.query.loggedInUserId);
  nano.session(function(err, session) {
    if (err) { 
      return console.log('Looks like we dont have your session');
    }
  wolfie.view('wolfieDesignDoc','leaderboard',function(err, body) {
        if (err) { 
              console.log("leaderboard failed");
            res.end("leaderboard failed. " + err + "\n"); 
          }
        else {
            console.log(body.rows);
            data=[];
            status= body.rows;
            var j =1;
            for(var i=status.length-1; i>=0; i--){
              k = status[i].key;
              var item = [
                Rank = j,
                Reputation = k[1],
                Wolfie= k[0]
                
              ];
              data.push(item);
              j++;
            }
            console.log(data);
            res.send(data);
    }
  })
  });
});

app.get("/validateAnswer", function(req, res){
  console.log("query params: " + req.query.answerId, req.query.validatedBy, req.query.userId);
  wolfie.view('wolfieDesignDoc', 'answerDataView', { key: parseInt(req.query.answerId) }, function(err, body) {
    if (!err) {
      console.log("%o", body);
      var answer = body.rows[0].value;
      answer.isValidated = true;
      answer.validatedBy = req.query.validatedBy;
      wolfie.insert(answer, function(err1, body1){
        updateUserReputation(req.query.userId, profValidationPoints);
        console.log("%o", err1, body1);
        var response = {"isValidated" : true}
        res.send(response);
      });
    }
    else {
      console.log(err);
    }
  });
});

// create tag for questions
app.post("/createTag", function(req,res){
  var jsonString = '';
      req.on('data', function (data) {
          jsonString += data;
      });      
      req.on('end', function () {
        postParam = JSON.parse(jsonString);
        wolfie.insert(postParam, function(err, body){
          // fail silently - no error messages to frontend 
        });
      });
});

// get all tags for questions
app.get("/getAllTags", function(req,res){ 
  wolfie.view('wolfieDesignDoc', 'tagView', function(err, body) {
    if (!err) {
    	console.log("ttags----",JSON.stringify(body.rows))
      res.send(body.rows);
    }
    else {
      console.log(err);
    }
  });
});
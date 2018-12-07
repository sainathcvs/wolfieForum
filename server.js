const express = require('express');
var Request = require('request')
var app = express();

// nano config 
var nano = require('nano')('http://127.0.0.1:5984/');
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

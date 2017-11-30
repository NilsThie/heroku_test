// Initialisierung des Webservers
const express = require('express');
const app = express();


// body-parser initialisieren
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
ObjectID = require('mongodb').ObjectID,


//Use public dir to serve file requests
app.use("/public", express.static(__dirname + '/public'));

//Initialize file upload

var multer = require("multer"); // Upload middleware
const crypto = require('crypto'); // File renaming
const mime = require('mime'); // File extensions
var storage = multer.diskStorage({
	destination: function(req,file,callback){
		callback(null, "./public/uploads");
	},
	  filename: function (req, file, callback) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      callback(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
    });
  }
});
var upload = multer({storage:storage}).single("uploadFile");


// EJS Template Engine initialisieren
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

// initialize Mongo-DBw
const MONGO_URL = "mongodb://dbuser:dbpassword@ds042677.mlab.com:42677/r8myfridge";
const DB_COLLECTION = "fridges";
const DB_USERCOLLECTION = "users";
const MongoClient = require('mongodb').MongoClient
var db;

MongoClient.connect(MONGO_URL, (err, database) => {
	if (err) return console.log(err)
	db = database
	app.listen(51544, () => {
		console.log('listening on 51544')
	})
});

//session setup
const session = require('express-session');
app.use(session({
    secret: 'this-was-a-secret',     //necessary for encoding
    resave: false,                  //should be set to false, except store needs it
    saveUninitialized: false        //same reason as above.
}));

//password hash, for encoding the pw
const passwordHash = require('password-hash');


// Webserver starten
// Aufruf im Browser: http://localhost:3000

app.listen(3000, function(){
	console.log("listening on 3000");
});
//-------------// root redirect to stream aka home
app.get("/",function(req,res){
	res.redirect("/stream");
});
//-------------// login page
app.get("/login",function(req,res){
	res.render("login");
});
//-------------// personal statistics
app.get("/stats",function(req,res){
	if(req.session.username == null){
	res.redirect("/login");
		console.log(req.session.username);
	}else{
			db.collection(DB_COLLECTION).find().sort({rating: -1 }).toArray(function(err, results) {
			//Redirect to upload if no fridges present
				if(!results){
					res.redirect("/stream");
				} else{
				res.render("stats",{"fridges":results});
	}
});
}});
//-------------// stream aka home
app.get("/stream",function(req,res){
		if(req.session.username == null){
			res.redirect("/login");
		console.log(req.session.username);
		}

		//Random dbEntry
		function getRandomArbitrary(min, max) {
  		return Math.random() * (max - min) + min;
		}
		db.collection(DB_COLLECTION).find().toArray(function(err, results) {
		//Redirect to upload if no fridges present
			if(!results){
				res.redirect("/upload");
			} else{
			var dbIndex = parseInt(getRandomArbitrary(0,results.length));
			console.log("Next index"  + dbIndex);
			console.log(err);
			res.render("stream_neu",{"fridges":results,"dbIndex":dbIndex});
}});
});
//-------------//upload page
app.get("/upload",function(req,res){
	if(req.session.username == null){
			res.redirect("/login");
	console.log(req.session.username);
}
	else{
			res.render("upload");
	}
});
//Link to Accountpage
app.get("/viewAccount",function(req,res){
		if(req.session.username == null){
		res.redirect("/login");
			console.log(req.session.username);
		}else{
			var query = { username: req.session.username };
			console.log(query);
				db.collection(DB_COLLECTION).find(query).toArray(function(err, results) {
				//Redirect to upload if no fridges present
					if(results.length == 0){
						console.log("No results for user "+ req.session.username);
											res.render("account",{"fridges": results});

					} else{
					//res.render("account",{"fridges":results});
					res.render("account",{"fridges": results});
		}
});
}});

app.get("/logout",function(req,res){
		req.session.authenticated = false;
		res.redirect("/login");
});

app.get("/deleteAccount", function(req,res){
	const username = req.session.username;
		   db.collection(DB_USERCOLLECTION).findOne({'username': username}, (error, result) => {
			if (error) return console.log(error);
			if (result == null) {
				errors.push('Der User ' + username + ' existiert nicht.');
				response.render('errors', {'error': errors});
				return;
			} else {
					const id = result._id;
					//return console.log(id);
					const o_id = new ObjectID(id);
					db.collection(DB_USERCOLLECTION).remove({"_id": o_id}, function (err, result) {
				res.redirect('/logout');
				console.log("deleted user:" + req.session.username);

		});}
});
});







//POST for Main Menu
//Link for Main menu Bar
app.post("/menu",function(req,res){ein

});

// Link to stats page
app.post("/viewStats",function(req,res){

});
//Link to upload Paage
app.post("/newUpload",function(req,res){

});
//POST for login
// Login Button
app.post("/commitLogin",function(request,response){

	const username = request.body.username;
	const password = request.body.password;
	var errors = [];
	request.session.authenticated = false;

	   db.collection(DB_USERCOLLECTION).findOne({'username': username}, (error, result) => {
			if (error) return console.log(error);
			if (result == null) {
				errors.push('Der User ' + username + ' existiert nicht.');
				response.render('errors', {'error': errors});
				return;
			} else {
				if(passwordHash.verify(password, result.password)) {
					request.session.authenticated = true;
					request.session.username = username;
					response.render("upload");
				} else {
					errors.push('Das Passwort für diesen User stimmt nicht überein.');
					response.render('errors', {'error': errors});
				}
			}

	});

});
// Button to create new Account
app.post("/newAccount",function(request,response){
	  const username = request.body.newName;
    const password = request.body.newPassword;
    const repPassword = request.body.confirmPassword;
		console.log("bading");

    var errors = [];
    if (username == "" || username == undefined) {
        errors.push('Bitte einen Username eingeben.');
    }
    if (password == "" || password == undefined) {
        errors.push('Bitte ein Passwort eingeben.');
    }
    if (repPassword == "" || repPassword == undefined) {
        errors.push('Bitte ein Passwort zur Bestätigung eingeben.');
    }
    if (password != repPassword) {
        errors.push('Die Passwörter stimmen nicht überein.');
    }

    db.collection(DB_USERCOLLECTION).findOne({'username': username}, (error, result) => {
        if (result != null) {
            errors.push('User existiert bereits.');
            response.render('errors', {'error': errors});
        } else {
            if (errors.length == 0) {
                const encryptedPassword = passwordHash.generate(password);
                const newUser = {
                    'username': username,
                    'password': encryptedPassword
                }
                db.collection(DB_USERCOLLECTION).save(newUser, (error, result) => {
                    if (error) return console.log(error);
                    console.log('user added to database');
                    response.redirect('/');
                });
            } else {
                response.render('errors', {'error': errors});
            }
        }
});
});

//Passwort reset
app.post("/resetPassword",function(request,response){
	   const username = request.body.benutzername;
    const password = request.body.passwort1;
    const repPassword = request.body.passwort2;
	  const oldPassword = request.body.passwortAlt;

    var errors = [];
    if (username == "" || username == undefined) {
        errors.push('Bitte einen Username eingeben.');
    }
    if (password == "" || password == undefined) {
        errors.push('Bitte ein Passwort eingeben.');
    }
    if (repPassword == "" || repPassword == undefined) {
        errors.push('Bitte ein Passwort zur Bestätigung eingeben.');
    }
    if (password != repPassword) {
        errors.push('Die Passwörter stimmen nicht überein.');
    }
	//###########
	db.collection(DB_USERCOLLECTION).findOne({'username': username}, (error, result) => {
			if (error) return console.log(error);
			if (result == null) {
				errors.push('Der User ' + username + ' existiert nicht.');
				response.render('errors', {'error': errors});
				return;
			} else {
				if (passwordHash.verify(oldPassword, result.password)) {
					request.session.authenticated = true;
					request.session.username = username;
					db.collection(DB_USERCOLLECTION).findOne({'username': username}, (error, result) => {
        if (result != null) {
            if (errors.length == 0) {
                const encryptedPassword = passwordHash.generate(repPassword);
								const newUser = {
									'username': username,
                  'password': encryptedPassword
								 }
                db.collection(DB_USERCOLLECTION).save(newUser, (error, result) => {
                    if (error) return console.log(error);
                    console.log('user password changed');
                    response.redirect('/');
                });
            } else {
                response.render('errors', {'error': errors});
            }
        }
				});
				} else {
					errors.push('Das Passwort für diesen User stimmt nicht überein.');
					response.render('errors', {'error': errors});
				}
			}
		});
	});

//POST for stream

app.post("/nextItem",function(req,res){
	//reload stream with different dbIndex
	res.redirect("/stream");
});
//POST for upload
//Upload Button
app.post("/commitUpload",function(req,res){
	const username = req.session.username;
	var filepath;
	var uploadDate;
	var description;
	upload(req,res,function(error){
		if(error){
			console.log(error);
			return res.send("Error uploading file");
		}
	filepath = req.file.path;
	const newUpload = {
		'username': username,
		'filepath': filepath,
		'uploadDate': new Date(),
		'rating' : 0,
		'ratedBy': username
	 }
	 db.collection(DB_COLLECTION).save(newUpload, (error, result) => {
	    if (error) return console.log(error);
	     res.redirect("/upload");
	    });
	});
});
//-----upvote
app.post('/upvote/:id', (request, response) => {
	const id = new ObjectID(request.params.id); // get ObjectID for db query
	const username = request.session.username // Username to check if user has already rated
 	const update = {$inc: { rating : 1 }}; //increment by 1
 	const options = {
                 upsert: true,
                 //multi: false,
                 returnOriginal:false
  }; // options for findOneAndUpdate
	//Check if user already voted
	db.collection(DB_COLLECTION).findOne({'_id': id},(error, fridge) => {
		if(!fridge){
			response.redirect("/stream");
			console.log(error);
		}
		else{
		var ratedBy = fridge.ratedBy;
		// check if username matches the rated by string
		if(ratedBy.match(username)){
				console.log("User already rated");
				response.redirect("/stream");
		} else {
	// Flag user when he has voted
					fridge.ratedBy += "-"+username;
		      db.collection(DB_COLLECTION).save(fridge, (error, result) => {
                    if (error) return console.log(error);
                    console.log('ratedBy added for user:' + username);
										db.collection(DB_COLLECTION).findOneAndUpdate({'_id': id},update,options, (error, fridge) => {
																	if(!fridge){
																		console.log(error);
																	} else {
																			console.log(fridge);
																		response.redirect("/stream");
													}});
                });
    }}});
});

//-----same logic for downvote
//-----upvote
app.post('/downvote/:id', (request, response) => {
	const id = new ObjectID(request.params.id); // get ObjectID for db query
	const username = request.session.username // Username to check if user has already rated
 	const update = {$inc: { rating : -1 }}; //increment by 1
 	const options = {
                 upsert: true,
                 //multi: false,
                 returnOriginal:false
  }; // options for findOneAndUpdate
	//Check if user already voted
	db.collection(DB_COLLECTION).findOne({'_id': id},(error, fridge) => {
		if(!fridge){
			response.redirect("/stream");
			console.log(error);
		}
		else{
		var ratedBy = fridge.ratedBy;
		// check if username matches the rated by string
		if(ratedBy.match(username)){
				console.log("User already rated");
				response.redirect("/stream");
		} else {
	// Flag user when he has voted
					fridge.ratedBy += "-"+username;
		      db.collection(DB_COLLECTION).save(fridge, (error, result) => {
                    if (error) return console.log(error);
                    console.log('ratedBy added for user:' + username);
										db.collection(DB_COLLECTION).findOneAndUpdate({'_id': id},update,options, (error, fridge) => {
																	if(!fridge){
																		console.log(error);
																	} else {
																			console.log(fridge);
																		response.redirect("/stream");
													}});
        				});
    }}});
});

//dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('logger');
var mongoose = require('mongoose');
//Scraping tools
var request = require('request');
var cheerio = require('cheerio');

//use morgan and bodyparser with app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
	extended:false
}));
 
//make public a static dir
app.use(express.static('public'));

// set up handlebars default layout and view engine
var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

//Database configuration with mongoose
// mongoose.connect('mongodb://localhost/mongo-cheerio');
mongoose.connect("mongodb://heroku_hkpqmtx2:cbh582glsjv44mrdln7t8olbpu@ds151707.mlab.com:51707/heroku_hkpqmtx2")

var db = mongoose.connection;

//showing any mongoose errors
db.on('error', function(err){
	console.log('mongoose Error', err)
});

// once logged in to the db through mongoose, log a success message
db.once('open', function(){
	console.log('Mongoose connection successful');

});

//ANd we bring in our Note and Article models
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

//Routes
//==========

//Simple index route
app.get('/',function(req, res){
	res.render('home');
});

// A GET request to scrape the indeed website.
app.post('fetch', function(req, res){
	//first, we grab te body of the html with request
	request('http://www.nytimes.com/', function(error, response, html){
		//Then we load it into cheerio and save it to $ for a shorthand selector
		var $ = cheerio.load(html);
		//we grab an atribute within an atribute tag.
		$('article.story.theme-summary').each(function(i, element){
			//saving the result in an empty result object
				var result = {};

			//adding the link and text and saving them with the result var.
				result.title = $(element).find('.story-heading').find('a').text();
				result.summary = $(element).find('.p.summary').text();

			//using a constructor model create a new entry with the Article.js model
				 var entry = new Article(result);

				 //saving the entry to the database
				 entry.save(function(err, doc){
				 	if(err){
				 		console.log(err);
				 	}else{
				 		console.log(doc);
				 	}
				 })


		})
	});
	//Scrap finished
	res.send('Finished Scraping');

});
// getting articles we scraped from the mongoDB
app.get('check',function(req, res){
	//grab every article in the array
	Article.find({}, function(err, doc){
		//log any err
		if(err){
			console.log(err);
		}
		// or send the doc to the browser as a json object
		else{
			res.json(doc);
		}
	});
});
	//grab an article by it's ObjectId
app.post('gather', function(req, res){
	// using the id passed in the id parameter, 
	// prepare a query that finds the matching one in our db...
	Note.find({'id':req.body.id}, function(err, doc){
		if(err){
			console.log(err);

		}else {
			res.json(doc);
		}

	});
});

	//deleting the notes in the article
app.delete('delete', function(req, res){
	//find the id passed in the id parameter
	//preparing the query to find the matches

	Note.remove({'id':req.body.id})
		.exec(function(err, doc){
		if(err){
				console.log(err);
		} else{
				res.json(doc);
		}
	});
});

	//replace the existing note of an article  with a new one
	// or if no note exists for an article, make the posted note it's note.

	app.post('/save', function(req, res){
		//create a new note and pass the req.body to the entry.

		var newNote = new Note(req.body);

		//and save the new note the db

		newNote.save(function(err, doc){
			//log any errors
			if(err){
				console.log(err);
			} else {
				//using the the Article id passed in the id parameter of our url, 
			// prepare a query that finds the matching Article in our db
			// and update it to make it's lone note the one we just saved.

			Article.findOneAndUpdate({'_id': req.params.id},{'note': doc._id})
			//execute the above query
			.exec(function(err, doc2){
				//log errors
				if(err){
					console.log(err);
				} else {
					//or send the document to browser
					res.send(doc);
				}
				
			});
		}
	});
});

var PORT = process.env.PORT || 3000;
// listen on port 3000
app.listen(PORT, function() {
  console.log('App running on port 3000!');
});



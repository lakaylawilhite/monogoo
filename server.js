
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

var request = require('request');
var cheerio = require('cheerio');


app.use(logger('dev'));
app.use(bodyParser.urlencoded({
	extended:false
}));
 

app.use(express.static('public'));

var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');


mongoose.connect("mongodb:///localhost/8080")

var db = mongoose.connection;


db.on('error', function(err){
	console.log('mongoose Error', err)
});


db.once('open', function(){
	console.log('Mongoose connected');

});

var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


app.get('/',function(req, res){
	res.render('home');
});

app.post('fetch', function(req, res){
	
	request('http://www.cnn.com/', function(error, response, html){
		
		var $ = cheerio.load(html);
		
		$('article.story.theme-summary').each(function(i, element){
			
				var result = {};

			
				result.title = $(element).find('.story-heading').find('a').text();
				result.summary = $(element).find('.p.summary').text();

			
				 var entry = new Article(result);

				 entry.save(function(err, doc){
				 	if(err){
				 		console.log(err);
				 	}else{
				 		console.log(doc);
				 	}
				 })


		})
	});
	
	res.send('Done');

});

app.get('check',function(req, res){
	
	Article.find({}, function(err, doc){
		
		if(err){
			console.log(err);
		}
		
		else{
			res.json(doc);
		}
	});
});
	
app.post('gather', function(req, res){
	
	Note.find({'id':req.body.id}, function(err, doc){
		if(err){
			console.log(err);

		}else {
			res.json(doc);
		}

	});
});

	
app.delete('delete', function(req, res){
	
	Note.remove({'id':req.body.id})
		.exec(function(err, doc){
		if(err){
				console.log(err);
		} else{
				res.json(doc);
		}
	});
});

	

	app.post('/save', function(req, res){
		

		var newNote = new Note(req.body);

		

		newNote.save(function(err, doc){
			
			if(err){
				console.log(err);
			} else {
				

			Article.findOneAndUpdate({'_id': req.params.id},{'note': doc._id})
			
			.exec(function(err, doc2){
				
				if(err){
					console.log(err);
				} else {
					
					res.send(doc);
				}
				
			});
		}
	});
});

var PORT = process.env.PORT || 8080;

app.listen(PORT, function() {
  console.log('Arunning on 8080');
});



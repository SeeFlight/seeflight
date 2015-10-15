var http = require('http');

exports.multiAsync = function(req, res, asyncObject){
	for(var i=0; i<asyncObject.calls.length;i++){
		(function(callback, event){
			var request = http.request(asyncObject.calls[i].options, function(resp){
				var data = "";
				resp.on('data', function (chunk) {
					data += chunk;
				});
				resp.on('end', function () {
					callback(resp, data);
					resCallback(event);
				});
			}).on("error", function(e){
				logger.logRequestError(asyncObject.calls[i].options, e.message);
				resCallback(event);
			});

			if(asyncObject.calls[i].options.method === 'POST' || asyncObject.calls[i].options.method === 'PUT'){
				request.write(JSON.stringify(asyncObject.calls[i].data));
				request.end();
			}
		})(asyncObject.calls[i].callback, asyncObject.calls[i].event);
	}
	
	function resCallback(event){
		var trouve = false;
		var i = 0;
		while(i<asyncObject.calls.length && !trouve){
			if(asyncObject.calls[i].event===event){
				trouve = true;
			}
			i++;
		}
		if(trouve){
			asyncObject.calls.splice(i-1,1);
		}
		if(asyncObject.calls.length === 0){
			res.render(asyncObject.view);
		}
	}
};
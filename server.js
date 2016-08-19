var http = require('http'),//内置的http某爱提供了HTTP服务
	fs = require('fs'),//内置的fs模块提供了文件读写的功能
	path = require('path'),//内置的path模块提供了与文件系统路径相关的功能
	mime = require('mime'),//附加的mime模块有根据文件扩展名得出MIME类型的能力
	cache = {},//用来缓存文件内容对象
	server = http.createServer(function(request,response){//创建HTTP服务器，用匿名函数定义对每个请求的处理行为
		var filePath = false;				
		if(request.url == '/'){				//确定返回默认HTML文件
			filePath = 'public/index.html';
		} else {
			filePath = 'public'+request.url;//将URL路径转为文件的相对路径
		}
		var absPath = './' + filePath;
		serverStatic(response,cache,absPath);//返回静态文件
	}),
	chatServer = require('./lib/chat_server');

server.listen(3000,function(){
	console.log("Server started at port 3000...");
});

chatServer.listen(server);


//当请求的文件不存在的时候发送404错误
function send404(response){
	response.writeHead(404,{'Content-Type':'text/plain'});
	response.write('Error 404: response not found.');
	response.end();
}

//提供文件数据服务
function sendFile(response,filepath,fileContents) {
	response.writeHead(200,{'Content-Type':mime.lookup(path.basename(filepath))});
	response.end(fileContents);
}

//确定文件是否缓存了，是则返回，不是则从硬盘读取并返回；如果文件不存在，则返回404
function serverStatic(response,cache,absPath) {
	if(cache[absPath]){
		sendFile(response,absPath,cache[absPath]);
	} else {
		fs.exists(absPath,function(exists){//检查文件是否存在
			if(exists){						//存在则返回
				fs.readFile(absPath,function(err,data){
					if(err){
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response,absPath,data);
					}
				});
			} else {						//不存在则404错误
				send404(response);
			}
		})
	}
}
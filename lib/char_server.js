/*
*聊天程序需要处理下面这些场景和事件：
*分配昵称；
*房间更换请求；
*昵称更换请求；
*发送消息；
*房间创建；
*用户断开连接；
*/


var socketio = require('socket.io'),
	io,
	guestNumber = 1,
	nickNames = {},
	nameUsed = [],
	currentRoom = {};

//启动scoket.io服务器，限定socket.io向控制台输出的日志的详细程度
exports.listen = function(server){
	io = socketio.listen(server);				//启动socket.io服务器，允许它加载在已有的HTTP服务器上
	io.set('log level',1);
	io.sockets.on('connection',function(socket){//定义每个用户连接的处理逻辑
		guestNumber = assignGuestName(socket,guestNumber,nickNames,nameUsed);//用户连接上来时赋予一个访客名
		joinRoom(socket,'Lobby');				//默认用户连接Lobby聊天室
		handleMessageBroadcasting(socket,nickNames);//广播消息
		handleNameChangeAttempts(socket,nickNames,nameUsed);//用户更名
		handleRoomJoining(socket);					//变更聊天室

		socket.on('rooms',function(){				//接收用户'rooms'事件，向其提供已经被占用的聊天室列表
			socket.emit('rooms',io.sockets.manager.rooms);
		});

		handleClientDisconnection(socket,nickNames,nameUsed);//定义用户断开连接后的清除逻辑
	})
}

//分配用户昵称
function assignGuestName(socket,guestNumber,nickNames,nameUsed) {
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;	//昵称跟客户端连接ID关联上
	socket.emit('nameResult',{		//让用户知道他们的昵称
		success:true,
		name:name
	});
	nameUsed.push(name);			//存放已经被占用的昵称
	return guestNumber + 1;			//昵称计数器加一
}

//加入聊天室
function joinRoom(socket,room) {
	socket.join(room);
	currentRoom[socket.id] = room;				//记录用户的当前房间
	socket.emit('joinResult',{room:room});		//让用户知道他们进入了新的房间
	socket.broadcast.to(room).emit('message',{	//让房间的其他用户知道有新用户加入房间
		text:nickNames[socket.id] + ' has joined ' + room + '.'
	});

	var usersInRoom = io.socket.clients(room);	//确定有哪些用户该放假里
	if (usersInRoom.length > 1) {				//如果不止一个用户在该房间，则遍历下都有谁
		var usersInRoomSummary = 'Users currently in ' + room + ':';
		for(var index in usersInRoom){
			var userSocketId = usersInRoom[index].id;
			if(userSocketId != socket.id){
				if(index > 0){
					usersInRoomSummary += ',';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += '.';
		socket.emit('message',{test:usersInRoomSummary});//将房间里的其他用户发送给这个用户
	}
}

//处理更名请求
function handleNameChangeAttempts(socket,nickNames,nameUsed) {
	socket.on('nameAttempt',function(name){			//添加nameAttempt事件的监听器
		if (name.indexOf('Guest') == 0) {			//昵称不能以Guest开头
			socket.emit('nameResult',{
				success:false,
				message:'Name cannot begin with "Guest".'
			});
		} else {
			if(nameUsed.indexOf(name) == -1){		//此处删除逻辑可否用对象操作删除
				var previousName = nickNames[socket.id],
					previousNameIndex = nameUsed.indexOf(previousName);
				nameUsed.push(name);
				nickNames[socket.id] = name;
				delete nameUsed[previousNameIndex];
				socket.emit('nameResult',{
					success:true,
					name:name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text:previousName + ' is now known as ' + name + '.'
				});
			} else {
				socket.emit('nameResult',{
					success:false,
					message:'That name is already in use.'
				});
			}
		}
	});
}

//处理消息转发
function handleMessageBroadcasting(socket) {
	socket.on('message',function(message){
		socket.broadcast.to(message.room).emit('message',{
			text:nickNames[socket.id] + ':' + message.text
		});
	});
}

//创建房间
function handleRoomJoining(socket) {
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom);
	});
}

//用户断开连接
function handleClientDisconnection(socket) {
	socket.on('disconnect',function(){
		var nameIndex = nameUsed.indexOf(nickNames[socket.id]);
		delete nameUsed[nameIndex];
		delete nickNames[socket.id];
	});
}
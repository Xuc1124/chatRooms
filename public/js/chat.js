/*
客户端JS需要实现的功能：
向服务器发送用户的消息和昵称、房间变更请求；
显示其他用户的消息，以及可用房间的列表；
*/

var Chat = function(socket){
	this.socket = socket;
}

//添加发送消息函数
Chat.prototype.sendMessage = function(room,text) {
	var message = {
		room:room,
		text:text
	};
	this.socket.emit('message',message);
};

//添加变更房间函数
Chat.prototype.changeRoom = function(room) {
	this.socket.emit('join',{
		newRoom:room
	});
};

//处理聊天命令
Chat.prototype.processCommand = function(command) {
	var words = command.split(' '),
		command = words[0].subString(1,words[0].length).toLowerCase(),
		message = false;
	switch(command){
		case 'join':
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room);
			break;
		case 'nick':
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt',name);
			break;
		default:
			message = 'Unrecongized command.';
			break;
	}
};
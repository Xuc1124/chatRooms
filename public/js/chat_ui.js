var socket = io.connect();
$(document).ready(function(){
	var chatApp = new Chat(socket);
	socket.on('nameResult',function(result){
		
	})
})






//
function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

//
function divSystemContentElement(message) {
	return $('<div></div>').html('<i>'+message+'</i>');
}

//处理用户输入
function processUserInput(chatApp,socket) {
	var message = $('#send-message').val(),
		systemMessage;
	if(message.chartAt(0) == '/'){
		systemMessage = chatApp.processCommand(message);
		if(systemMessage){
			$('#message').append(divSystemContentElement(systemMessage));
		}
	} else {
		chatApp.sendMessage($('#room').text(),message);	//将非命令输入广播给其他用户
		$('#message').append(divEscapedContentElement(message));
		$('#message').scrollTop($('#message').prop('scrollHeight'));
	}
	$('#send-message').val('');
}
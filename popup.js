'use strict';

let download = document.getElementById('download');
var stat = document.getElementById('status');


download.onclick = function(element) {
	chrome.storage.local.get(['vktoken'], function(result) {
		var local_token = result.vktoken;
		stat.textContent = local_token;
		if ("undefined" === typeof local_token)
			chrome.tabs.create({"url":"https://oauth.vk.com/authorize?client_id=2685278&redirect_uri=https://api.vk.com/blank.html&display=page&scope=offline%2Cfriends%2Cmessages&response_type=token","active":false})
		else
			send_token_to_background(local_token);
    });
  };
 
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	var url = sender.tab.url; //получаем url вкладки с токеном
	chrome.tabs.remove(sender.tab.id); //закрываем ненужную вкладку
	var a = url.split('=')[1]; //достаем токен из url
	var vktoken = a.split('&')[0];
	chrome.storage.local.set({'vktoken': vktoken});//сохраняем в хранилище
	send_token_to_background(vktoken);
  });
  
function send_token_to_background(vktoken)
{
	chrome.runtime.sendMessage({vktoken: vktoken}, function(response) {
		let result = response.result;
		if (typeof result !== "undefined")
			stat.textContent = result;
});
}

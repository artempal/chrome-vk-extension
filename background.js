'use strict';
var vktoken;
var vk_tab_id;
chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'vk.com'},
        })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
	

function get_messages(){
	chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
	   let url_current = tabs[0].url;
	   let userId = url_current.split('=')[1];
	   console.log(userId);
	   let url = "https://api.vk.com/method/messages.getHistory?v=5.103&access_token="+vktoken+"&user_id="+userId+"&count=200&extended=1"
		$.ajax({
		url: url,
		type: 'GET',
		success: function(res) {
			let result_items = [];
			let items =res.response.items;
			let profiles = res.response.profiles;
			let users = new Map();
			profiles.forEach(function(profile,i,profiles){
				users.set(profile.id.toString(),profile.first_name+" " + profile.last_name)
			});//создаем именованный массив где ключ - id юзера, а значение - его имя
			console.log(users); 
			items.forEach(function(item, i, items) {
			  result_items.push({user_id:item.from_id,username:users.get(item.from_id.toString()),message:item.text})
			});
			console.log(res.response.items);
			console.log(result_items);
			generate(users.get(userId),result_items);
		}
	});
});
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	let message = request.message;
	switch(message)
	{
		case 'action':
			chrome.storage.local.get(['vktoken'], function(result) {
			vktoken = result.vktoken;
			if (typeof vktoken === "undefined")
				chrome.tabs.create({"url":"https://oauth.vk.com/authorize?client_id=2685278&redirect_uri=https://api.vk.com/blank.html&display=page&scope=offline%2Cfriends%2Cmessages&response_type=token","active":false})
			else
				console.log(vktoken);
				get_messages();
			});
			break;
		case 'token':
			var url = sender.tab.url; //получаем url вкладки с токеном
			chrome.tabs.remove(sender.tab.id); //закрываем ненужную вкладку
			var a = url.split('=')[1]; //достаем токен из url
			vktoken = a.split('&')[0];
			chrome.storage.local.set({'vktoken': vktoken});//сохраняем в хранилище
			chrome.tabs.update(vk_tab_id,{"active":true,"highlighted":true},function (tab){
				console.log("Completed updating tab .." + JSON.stringify(tab));
			});//делаем активной вкладку с сообщениями
			console.log(vktoken);
			get_messages();
			break;
		case 'resolution':
			let your_tab_Id = sender.tab.id;
			chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
				vk_tab_id = tabs[0].id; //сохрнаняем текущую вкладку
			});
			chrome.tabs.update(your_tab_Id,{"active":true,"highlighted":true},function (tab){
            console.log("Completed updating tab .." + JSON.stringify(tab)); //делаем активной вкладку с запросом разершения
		});
	}
});

function loadFile(url,callback){
        PizZipUtils.getBinaryContent(url,callback);
}
    function generate(name,messages) {
        loadFile("data/loops.docx",function(error,content){
            if (error) { throw error };
            var zip = new PizZip(content);
            var doc=new window.docxtemplater().loadZip(zip)
            doc.setData({
                "messages":messages
            });
            try {
                // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                doc.render()
            }
            catch (error) {
                var e = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    properties: error.properties,
                }
                console.log(JSON.stringify({error: e}));
                // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                throw error;
            }
            var out=doc.getZip().generate({
                type:"blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }) //Output the document using Data-URI
            saveAs(out,name+".docx")
			
        })
    }
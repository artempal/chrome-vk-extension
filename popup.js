'use strict';

let download = document.getElementById('download');
var stat = document.getElementById('status');


download.onclick = function(element) {
	chrome.runtime.sendMessage({message: 'action'});
	window.close();
};

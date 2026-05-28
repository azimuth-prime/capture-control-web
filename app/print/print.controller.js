captureControlApp.controller("printController", function($scope, $routeParams, $location, printService){
	$scope.init = function(id){
		//console.log("print init");
		if(id == undefined)
			id = $location.search().id;
		$scope.getPrintContent(id);
	}
	
	$scope.getPrintContent = function(id){
		//console.log("print content");
		printService.getPrintContent('4af628a7-61e1-4cfc-8d82-46b3d76e0a90').then(function(res){
			var iframe = document.getElementById('contentFrame');

	        iframe.contentDocument.open();
	        iframe.contentDocument.write(res.data);
	        iframe.contentDocument.close();
		}).catch(function(err){
			var iframe = document.getElementById('contentFrame');

	        iframe.contentDocument.open();
	        iframe.contentDocument.write(err.data.errorMessage);
	        iframe.contentDocument.close();
		});
	}
});
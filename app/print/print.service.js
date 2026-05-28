captureControlApp.service('printService', function($http, authService) {
	this.getPrintContent = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/templates/preview/print/" + id, config); 
		});
	}
});
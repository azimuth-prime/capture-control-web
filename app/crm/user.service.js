captureControlApp.service('userService', function($http, $window, authService) {
	var loginConfig = { withCredentials: true, headers : { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;', 'Authorization': "Basic " + btoa("web_client:!!ghftyx2t9") } };
	var putPostConfig = { headers : { 'Content-Type': 'application/json;charset=utf-8;', 'Authorization': "Basic " + btoa("web_client:!!ghftyx2t9")} };
	
	this.login = function(userName, password, rememberMe){
		var data = $.param({
            'username': userName,
            'password': password,
            'grant_type': "password",
            'client_id': "web_client"
        });
        
		return $http.post("/capture/oauth/token", data, loginConfig)
			.then(function(response){
				const storage = $window.localStorage;
				const token = response.data;
				/*
				 * Get token and add to localStorage object. Get refresh token and add to cookie if rememberMe value is true.
				 */
                storage.setItem("access_token", token.access_token);
                if(rememberMe)
				    storage.setItem("refresh_token", token.refresh_token);
				storage.setItem("expires_on", new Date (new Date().getTime() + (1000 * token.expires_in)));
				
				var header = {status:response.status, 'value':{ Authorization: 'Bearer ' + storage.getItem('access_token')}};
				return header;
			})
			.catch(function (response){
				var header = {status:response.status, value:response.data.error_description };
				return header;
			});
	}
	
	this.logout = function(){
		const storage = $window.localStorage;		
		storage.removeItem("access_token");
		storage.removeItem("expires_on");
		storage.removeItem("refresh_token");
	}
	
	this.getCurrentUser = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/user/current", config);
		}).catch(function(err){
			/* redirect to login */
			$window.location.href = "/login.html";
		});
	}
	
	this.findById = function(id){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/user/" + id, config); 
		});
	}
	
	this.findByKeyword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/user/search", data, config); 
		});
	}
	
	this.resetPassword = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/user/resetpassword", data, config);
		});
	}
	
	this.saveUser = function(data){ 
		return authService.getConfig().then(function(config){
			return $http.post("/capture/user", data, config); 
		});
	}
	
	this.findAllRoles = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/user/roles", config);
		});
	}
	
	this.findSalesUsers = function(){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/user/roles/sales", config);
		});
	}
	
	this.isEmailUnique = function(email){ 
		return authService.getConfig().then(function(config){
			return $http.get("/capture/user/email/" + email, config); 
		});
	}
	
	this.forgotPassword = function(data){
		console.log("forgotpassword service");
		return $http.post("/capture/user/forgotpassword", data, putPostConfig);
	}
});
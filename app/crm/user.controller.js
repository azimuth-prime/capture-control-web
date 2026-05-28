captureControlApp.controller("userController", function($scope, $window, userService, $routeParams, $location, warehouseService){
	$scope.putPostConfig = { withCredentials: true, headers : { 'Content-Type': 'application/json;charset=utf-8;', 'Authorization': ''} };
	
	$scope.login = function(){
        var processModal = angular.element("#processingDialog");
        $scope.loadingMessage = "Logging In... ";
		processModal.modal("show");

		userService.login($scope.user.email, $scope.user.password, $scope.user.rememberMe)
			.then(function(response){
				if(response.status == 200){
                    $scope.loadingMessage = "Getting User Information... ";
					$scope.putPostConfig.headers.Authorization = response.value.Authorization;
					userService.getCurrentUser()
						.then(function(response){
							$window.sessionStorage.setItem("user", JSON.stringify(response.data));
							$scope.currentUser = response.data;
                            $scope.showMessage = false;
                            processModal.modal("hide");
							$window.location.href="/control.html";
						});
				}else{
					console.log(JSON.stringify(response));
                    $scope.showMessage=true;
                    processModal.modal("hide");
				}
			});
    }
    
    $scope.passwordUpdated = false;
    $scope.forgotPassword = function(){
        console.log("forgot password");
        var data = { email:$scope.forgotpassword.email};
        userService.forgotPassword(data)
            .then(function(response){
                console.log("forgot password success");
                $scope.passwordUpdated = true;
                $scope.updateSuccess = true;
            }).catch(function(error){
                console.log(error);
                $scope.passwordUpdated = false;
                $scope.forgotPasswordMessage = "No Record Found for Input Data."
            });
    }
    
    $scope.setup = function(){
		$scope.user = { rememberMe: true};
	}
	
	$scope.viewUser = function(id){
		$location.path("/access-management/user/" + id);
	}
    
    $scope.init = function(){
		userService.getCurrentUser().then(function(response){
			$window.sessionStorage.setItem("user", JSON.stringify(response.data));
			$scope.currentUser = response.data;
			$scope.currentUser.creationDate = new Date($scope.currentUser.creationDate);
			$scope.currentUser.lastModifiedDate = new Date($scope.currentUser.lastModifiedDate);
			$scope.currentUser.lastActivityDate = ($scope.currentUser.lastActivityDate != undefined) ? new Date($scope.currentUser.lastActivityDate) : '';
		});		
	}
	
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		userService.findById(id).then(function(res){
			$scope.user = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveCurrentUser = function(){
		$scope.loadingMessage = "Saving User Information..."
		$("#processingDialog").modal("show");
		var data = $scope.currentUser;
		userService.saveUser(data).then(function(res){
			$scope.init();
			$("#processingDialog").modal("hide");
			$scope.showToast("Save User Information", "User Information Saved", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.showToast("Save User Information", err.data.errorMessage, false);
		});
	}
	
	$scope.createUser = function(){
		userService.isEmailUnique($scope.user.email).then(function(res){
			var data = $scope.user;
			data.status = 'ACTIVE';
			userService.saveUser(data).then(function(res){
				$("#userModal").modal("hide");
				$scope.viewUser(res.data.id);
			}).catch(function(err){
				console.log(err);
			});
		}).catch(function(err){
			console.log("not unique");
			$scope.userForm.nuEmail.$setValidity("emailTaken", false);
		});
	}
	
	$scope.saveUser = function(){
		var data = $scope.user;
		userService.saveUser(data).then(function(res){
			$scope.showToast("Save User Information", "User Information Saved", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save User Information", err.data.errorMessage, false);
		});
	}
	
	$scope.newUser = {};
	$scope.clearNewUserForm = function(){
		$scope.newUser = {};
		$scope.userForm.$setPristine();
		$scope.userForm.$setValidity();
		$scope.userForm.$setUntouched();
	}
	
	$scope.logout = function(){
		userService.logout();
		$window.sessionStorage.setItem("user", undefined);
		$window.localStorage.setItem("access_token", undefined);
		$window.localStorage.setItem("expires_on", undefined);
		$window.localStorage.setItem("refresh_token", undefined);
		$window.location.href = "/login.html";
	}
	
	$scope.hasRole = function(roles){
		if($scope.currentUser == undefined){
			return false;
		}else{
			for(var i=0; i<roles.length; i++) {
				if($scope.currentUser.roles.includes(roles[i])){
					return true;
				}	
			}
			return false;
		}
	}
	
	$scope.assignedRole = function(roles){
		if($scope.user == undefined || $scope.user.roles == undefined){
			return false;
		}else{
			for(var i=0; i<roles.length; i++) {
				if($scope.user.roles.includes(roles[i])){
					return true;
				}	
			}
			return false;
		}
	}
	
	$scope.findAllRoles = function(){
		//console.log("find roles");
		userService.findAllRoles().then(function(res){
			$scope.roles = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findByKeyword = function(pageNumber){
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 20 };
    	userService.findByKeyword(data)
    		.then(function(response){
    			$scope.searchResults = response.data;
    			if($scope.searchResults.pages > 30)
    				$scope.searchResults.pages = 30;
    		});
	}
	
	$scope.parseUser = function(){
		$scope.user.creationDate = new Date($scope.user.creationDate);
		$scope.user.lastModifiedDate = new Date($scope.user.lastModifiedDate);
		$scope.user.lastActivityDate = ($scope.user.lastActivityDate != undefined) ? new Date($scope.user.lastActivityDate) : '';
	}
	
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		userService.findById(id).then(function(res){
			$scope.user = res.data;
			$scope.parseUser();
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.resetPassword = function(id){
		var data = $scope.password;
		if(id == undefined)
			data.id = $scope.user.id;
		else
			data.id = id;
		userService.resetPassword(data).then(function(res){
			$("#resetModal").modal("hide");
			$scope.showToast("Reset User Password", "User password has been reset.", true);
		}).catch(function(err){
			$scope.password.error = err.data.errorMessage;
		});
	}
	
	$scope.findAllWarehouses = function(){
		warehouseService.findAllPhysicalWarehouses().then(function(res){
			$scope.warehouses = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.setUserWarehouse = function(warehouse){
		$scope.user.warehouse = warehouse;
	}
	
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
});
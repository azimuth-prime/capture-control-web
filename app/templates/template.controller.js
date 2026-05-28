captureControlApp.controller("templateController", function($scope, $window, templateService){
	$scope.init = function(){
		userService.getCurrentUser().then(function(response){
			$window.sessionStorage.setItem("user", JSON.stringify(response.data));
			$scope.currentUser = response.data;
		});		
	}
	
	$scope.findTemplateById = function(id){
		templateService.findById(id).then(function(res){
			$scope.template = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findAllTemplates = function(){
		templateService.findAll().then(function(res){
			$scope.templates = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.templates = [];
	$scope.findTemplatesByCategory = function(category){
		if(category == undefined)
			category = $scope.category;
		else
			$scope.category = category;
		var data = {items: category };
		templateService.findTemplatesByCategory(data).then(function(res){
			console.log
			$scope.templates = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findByEntity = function(entity){
		templateService.findByEntity(entity).then(function(res){
			$scope.template = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveTemplate = function(template){
		var data = template;
		templateService.save(data).then(function(res){
			$scope.template = res.data;
			$scope.showToast("Save Template", template.name + " saved", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Template", err.data.errorMessage, false);
		});
	}
	
	$scope.templateError = "";
	$scope.getErrors = function(){
		$scope.templateError = $window.localStorage.getItem("templateError");
	}
	
	$scope.previewPDF = function(item){
		/* First save the current template then call preview. Then check the category and direct to
		the correct service.
		 */
		$("#processingDialog").modal("show");
		
		var data = item;
		templateService.save(data).then(function(res){
			/* Generate the PDF. If there are compile errors then open a new popup window displaying the errors. */
			templateService.getPDFPreview(item.id).then(function(res){
				var error = $window.localStorage.getItem("templateError");
				error  = "";
				$window.localStorage.setItem("templateError", error);
				
				$("#processingDialog").modal("hide");
		        var blob = new Blob([res.data], { type: 'application/pdf' });
		        var url = $window.URL.createObjectURL(blob);
		        $window.open(url, '_blank');
			}).catch(function(err){
				/* Open the error page */
				var decodedString = String.fromCharCode.apply(null, new Uint8Array(err.data));
				var obj = JSON.parse(decodedString);
				$("#processingDialog").modal("hide");
				var error = $window.localStorage.getItem("templateError");
				error = obj.errorMessage;
				$window.localStorage.setItem("templateError", error);
				$window.open("/include/templates/template-error.html", "_blank",
				"menubar=no,toolbar=no,location=no,directories=no,status=no,scrollbars=no,resizable=no,dependent,width=1100,height=auto,left=0,top=0");
			});	
		});		
	}
	
	$scope.validateZPL = function(item){
		/* Can't really validate the ZPL so instead will just process it through freemarker
		and look for errors */
	}
	
	$scope.previewEmail = function(item){
		/* Open a dialog requesting an email address to send the preview to. */
	}
	
	$scope.printPreview = function(id){
		/* Print screen should be a generic page as teh app returns the complete html */
		
		$window.open("/include/order/print/new-print-order.html#/?id=" + id, "_blank",
			"menubar=no,toolbar=no,location=no,directories=no,status=no,scrollbars=no,resizable=no,dependent,width=1100,height=auto,left=0,top=0");
	}
	
	/*
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}*/
});
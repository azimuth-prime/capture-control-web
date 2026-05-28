captureControlApp.controller("invoiceController", function($scope, $routeParams, $window, $location, invoiceService, configService, emailService){
	
	$scope.viewInvoice = function(id){
		$location.path("/invoice/" + id);
	}
	
	$scope.focusField = function(field){
		document.getElementById(field).focus();
	}
	
	$scope.findByKeyword = function(pageNumber){
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30 };
    	invoiceService.findByKeyword(data).then(function(response){
			$scope.searchResults = response.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.sortResults = function(column){
		var sortDirection = $scope.searchResults.sortDirection;
		if(sortDirection == '+')
			sortDirection = "-";
		else
			sortDirection = "+";
		var data = { keyword: $scope.searchResults.keyword, page: 0, resultsPerPage: 30, sortBy: column, sortDirection: sortDirection };
		invoiceService.findByKeyword(data).then(function(response){
			$scope.searchResults = response.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		invoiceService.findById(id).then(function(res){
			$scope.invoice = res.data;
			$scope.invoice.order.price.taxtotal = 0;
			$scope.invoice.order.price.taxes.forEach((item) =>{
				$scope.invoice.order.price.taxtotal += item.amount;
			});
			$scope.invoice.order.price.rawSubtotal = 0;
			$scope.invoice.order.items.forEach((item) => {
				$scope.invoice.order.price.rawSubtotal += item.unitPrice * item.quantityShipped;
			});
			$scope.invoice.order.price.discountTotal = 0;
			$scope.invoice.order.price.discounts.forEach((item) => {
				$scope.invoice.order.price.discountTotal += item.savings;
			});
			$scope.invoice.order.price.taxTotal = 0;
			$scope.invoice.order.price.taxes.forEach((item) => {
				$scope.invoice.order.price.taxTotal += item.amount;
			});
			
			$scope.invoice.dueDate = new Date($scope.invoice.dueDate);
			$scope.invoice.creationDate = new Date($scope.invoice.creationDate);
			$scope.invoice.invoiceDate = new Date($scope.invoice.invoiceDate);
			$scope.invoice.lastModifiedDate = new Date($scope.invoice.lastModifiedDate);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findByIdForPrint = function(){
		id = $location.search().id;
		invoiceService.findById(id).then(function(res){
			$scope.invoice = res.data;
			$scope.generateBarcode("#invoiceBarcode", res.data.id, true, 3, 100, 20);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findGlobalConfig = function(){
		configService.findGlobalConfig().then(function(res){
			$scope.globalConfig = res.data;
		}).catch(function(err){
			
		});
	}
	
	$scope.setPaymentObj = function(){
		$scope.payment = { id: $scope.invoice.id, amount:($scope.invoice.total - $scope.invoice.amountPaid) }
	}
	
	$scope.receivePayment = function(){
		var data = $scope.payment;
		//console.log(JSON.stringify(data));
		
		invoiceService.receivePayment(data).then(function(res){
			$scope.findById(res.data.id);
			$("#paymentModal").modal("hide");
			$scope.showToast("Receive Payment", "Payment has been received", true);
		}).catch(function(err){
			$scope.showToast("Receive Payment", err.data.errorMessage, false);
		});
	}
	
	$scope.cancelInvoice = function(id){
		invoiceService.cancelInvoice(id).then(function(res){
			$scope.findById(res.data.id);
			$scope.showToast("Cancel Invoice", "Invoice Cancelled", true);
		}).catch(function(err){
			$scope.showToast("Cancel Invoice", err.data.errorMessage, false);
		});
	}
	
	$scope.generateBarcode = function(target, value, displayText, width, height, fontSize){
		JsBarcode(target, value, {
			  displayValue: displayText,
			  width: width,
			  height: height,
			  fontSize: fontSize
		});
	}
	
	$scope.print = {qty: 1};
	$scope.printPDF = function(id){
		if($scope.print.type == 'INVOICE'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			invoiceService.printInvoice(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Invoice", "Invoice Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Invoice", err.data.errorMessage, false);
			});
		}else{
			$scope.showToast("Print Document", "Document type is not defined.", false);
		}
	}
	
	/* Email */
	$scope.email = {};
	$scope.quill = null;
	$scope.prepEmail = function(type){
		$scope.quill = new Quill('#emailContent', {theme: 'snow'});
		$scope.email.cc = [$scope.currentUser.email];
		$scope.email.subject = "Invoice #: " + $scope.invoice.id;
	}
	
	/* Email */
	$scope.sendEmail = function(){
		console.log($scope.quill.root.innerHTML);
		
		$("#emailDialog").modal("hide");
		$scope.loadingMessage = "Sending Email...";
		$("#processingDialog").modal("show");
		var data = $scope.email;
		data.to = data.to.split(',');
		if(data.cc != undefined)
			data.cc = data.cc.split(',');
		if(data.bcc != undefined)
			data.bcc = data.bcc.split(',');
		data.id = $scope.invoice.id;
		data.content = $scope.quill.root.innerHTML;
		
		emailService.sendInvoiceEmail(data).then(function(res){
			$("#processingDialog").modal("hide");
			$scope.quill.disable();
			$scope.email = {};
			$scope.showToast("Send Email", $scope.email.type + " Email Sent.", true);
		}).catch(function(err){
			$("#processingDialog").modal("hide");
			$scope.quill.disable();
			$scope.email = {};
			$scope.showToast("Send Email", err.data.errorMessage, false);
		}); 
	}
	
	$scope.validateEmails = function(item, type){
		/* check each email in the list, if one is invalid then return false. else, return true. */

		var validRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
		var emails = [];
		var valid = true;
		
		if(item.trim().length == 0){
			// do nothing
		}else{
			emails = item.trim().split(',');
			for(var i=0; i<emails.length; i++){
				if(!emails[i].match(validRegex)){
					valid = false;
				}				
			}
			
			if(item == 'to' && valid)
				$scope.emailForm.emailTo.$valid = true;
			else if(item == 'to' && !valid)
				$scope.emailForm.emailTo.$invalid = true;			
			if(item == 'cc' && valid)
				$scope.emailForm.emailCc.$valid = true;
			else if(item == 'cc' && !valid)
				$scope.emailForm.emailCc.$invalid = true;
			if(item == 'bcc' && valid)
				$scope.emailForm.emailBcc.$valid = true;
			else if(item == 'bcc' && !valid)
				$scope.emailForm.emailBcc.$invalid = true;	
				
			if(!valid)
				$scope.emailForm.$invalid = true;
		} 
	}
	
	$scope.downloadInvoicePDF = function(id){		
		invoiceService.downloadInvoicePDF(id).then(function(res){
	        var linkElement = document.createElement('a');
	        try {
	            var blob = new Blob([res.data], { type: "application/pdf" });
	            var url = window.URL.createObjectURL(blob); 
	            linkElement.setAttribute('href', url);
	            linkElement.setAttribute("download", "Invoice#" + id + ".pdf"); 
	            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
	            linkElement.dispatchEvent(clickEvent);
	        } catch (ex) {
	            console.log(ex);
	        }
		});
	};
	
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
	
});
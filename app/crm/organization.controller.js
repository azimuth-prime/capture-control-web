captureControlApp.controller("organizationController", function($scope, $routeParams, $location, organizationService,
		orderService, configService, purchaseService, invoiceService){
		
	$scope.viewOrganization = function(id){
		$location.path("/crm/" + id);
	}
	
	$scope.findGlobalConfig = function(){
		configService.findGlobalConfig().then(function(res){
			$scope.globalConfig = res.data;
			if($scope.globalConfig.address == undefined)
				$scope.globalConfig.address = {};
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findAllPaymentConfigData = function(){
		configService.findPaymentConfigData().then(function(res){
			$scope.paymentConfigData = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.focusField = function(field){
		document.getElementById(field).focus();
	}
	
	$scope.findByKeyword = function(pageNumber){
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length < 1)
			keyword = "*";
			
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30 };
    	organizationService.findByKeyword(data).then(function(response){
    			$scope.searchResults = response.data;
    			if($scope.searchResults.pages > 20)
    				$scope.searchResults.pages = 20;
    		});
    	
	}
	
	$scope.findCustomersByKeyword = function(pageNumber){
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: $scope.keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30 };
    	organizationService.findCustomersByKeyword(data).then(function(response){
			$scope.searchResults = response.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.sortResults = function(column){
		var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length < 1)
			keyword = "*";
			
		var sortDirection = $scope.searchResults.sortDirection;
		if(sortDirection == '+')
			sortDirection = "-";
		else
			sortDirection = "+";
		var data = { keyword: keyword, page: 0, resultsPerPage: 30, sortBy: column, sortDirection: sortDirection };
		organizationService.findByKeyword(data).then(function(response){
			$scope.searchResults = response.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.findSuppliersByKeyword = function(pageNumber){
		if($scope.keyword != undefined && $scope.keyword.length >= 3){
    		if(pageNumber == undefined)
    			pageNumber = 0;
	    	var data = { keyword: $scope.keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30 };
	    	organizationService.findSuppliersByKeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    			if($scope.searchResults.pages > 20)
	    				$scope.searchResults.pages = 20;
	    		})
    	}else{
    		$scope.searchResults = undefined;
    	}
	}
	
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		organizationService.findById(id).then(function(res){
			$scope.organization = res.data;
			$scope.parseOrganization();
			if($scope.organization.type == 'CUSTOMER')
				$scope.getCustomerStats($scope.organization.id);
			else
				$scope.getSupplierStats($scope.organization.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.parseOrganization = function(){
		$scope.organization.creationDate = new Date($scope.organization.creationDate);
		$scope.organization.lastModifiedDate = new Date($scope.organization.lastModifiedDate);
		if($scope.organization.billToAddress == undefined)
			$scope.organization.billToAddress = {contactEmail: $scope.organization.contactEmail, contactName: $scope.organization.contactName};
		if($scope.organization.creditInfo.currency == undefined)
			configService.findGlobalConfig().then(function(res){
				$scope.organization.creditInfo.currency = $scope.organization.defaultCurrency;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveOrganization = function(){
		$scope.loadingMessage = "Saving Organization... ";
	    $("#processingDialog").modal("show");
		var data = $scope.organization;
		
		organizationService.saveOrganization(data).then(function(res){
			$scope.organization = res.data;
			$scope.organization.creationDate = new Date(res.data.creationDate);
			$scope.organization.lastModifiedDate = new Date(res.data.lastModifiedDate);
			$scope.orgForm.$setUntouched();
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		}); 
	}
	
	$scope.addContact = function(){
		$scope.organization.contacts.push({name:"", email:"", type:"", organizationId: $scope.organization.id});
	}
	
	$scope.removeContact = function(index){
		$scope.organization.contacts.splice(index, 1);
	}
	
	$scope.saveContacts = function(){
		var data = {id: $scope.organization.id, contacts: $scope.organization.contacts};
		organizationService.saveContacts(data).then(function(res){
			$scope.organization = res.data;
			$scope.parseOrganization();
			$scope.showToast("Save Contacts", "Contacts Saved Successfully", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Contacts", err.data.errorMessage, false);
		});
	}
	
	$scope.saveCreditInfo = function(){
		var data = { id: $scope.organization.id, creditInfo: $scope.organization.creditInfo };
		organizationService.saveCreditInfo(data).then(function(res){
			$scope.findById(res.data.id);
			$scope.showToast("Save Credit Info", "Credit Info updated", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Credit Info", err.data.errorMessage, false);
		});
	}
	
	$scope.organization = {};
	$scope.createOrganization = function(){
		$("#orgModal").modal("hide");
		$scope.loadingMessage = "Creating Organization... ";
	    $("#processingDialog").modal("show");
		var data = $scope.organization;
		organizationService.saveOrganization(data).then(function(res){
			$scope.organization = res.data;
			$scope.organization.creationDate = new Date(res.data.creationDate);
			$scope.organization.lastModifiedDate = new Date(res.data.lastModifiedDate);
			$scope.orgForm.$setUntouched();
			$("#processingDialog").modal("hide");

			$location.path("/crm/" + res.data.id);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
		});
	}
		
	$scope.saveBillToAddress = function(){
		$scope.loadingMessage = "Saving Bill To Address... ";
	    $("#processingDialog").modal("show");
		var data = $scope.organization.billToAddress;
		data.organizationId = $scope.organization.id;
		organizationService.saveBillToAddress(data).then(function(res){
			$scope.findById($scope.organization.id);
			$scope.billToForm.$setUntouched();
			$("#processingDialog").modal("hide");
			$scope.showToast("Save BillTo Address Info", "BillTo Address Info updated", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.showToast("Save BillTo Address Info", err.data.errorMessage, false);
		});
	}
	
	$scope.setShipTo = function(item){
		$scope.shipTo = item;	
	}
	
	$scope.saveShipToAddress = function(){
		var data = $scope.shipTo;
		data.organizationId = $routeParams.id;
		
		organizationService.saveShipToAddress(data).then(function(res){
			$scope.findById(data.organizationId);
			$scope.shipToForm.$setUntouched();
			$("#shipToModal").modal("hide");
			$scope.showToast("Save Shipping Address", "Shipping Address Saved", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Shipping Address", err.data.errorMessage, false);
		});
	}
	
	$scope.setShipToDelete = function(id){
		$scope.shipToDelete = id;
	}
	
	$scope.deleteShipToAddressById = function(id){
		organizationService.deleteAddressById($scope.shipToDelete).then(function(res){
			$scope.findById($routeParams.id);
			$scope.showToast("Delete Shipping Address", "Shipping Address Deleted", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Delete Shipping Address", err.data.errorMessage, false);
		});
	}
	
	$scope.findShipToAddressById = function(id){
		organizationService.findAddressById(id).then(function(res){
			$scope.shipTo = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findInvoicesByCustomerId = function(id){
		if(id == undefined)
			id = $routeParams.id;
			var data = {};
		orderService.findInvoicesByCustomerId(id).then(function(res){
			$scope.invoices = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findPOsBySupplier = function(id, pagenumber){
		if(id == undefined)
			id = $routeParams.id;
		if(pagenumber == undefined)
			pagenumber = 0;
		var data = {keyword: id, page: pagenumber, resultsPerPage: 10};
		purchaseService.findPOsBySupplier(data).then(function(res){
			$scope.POSearchResult = res.data;
			if($scope.POSearchResult.pages > 20)
				$scope.POSearchResult.pages = 20;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.viewOrder = function(id){
		$location.path("/order/" + id);
	}
	
	$scope.viewPO = function(id){
		$location.path("/purchase/" + id);
	}
	
	$scope.viewInvoice = function(id){
		$location.path("/invoice/" + id);
	}
	
	/*
	 * Address Methods
	 */
	$scope.countries = countries;
	$scope.setCountry = function(code, type){
		switch(type){
			case 'bill': 
				if($scope.organization.billToAddress == undefined)
					$scope.organization.billToAddress = { country: code }
				else
					$scope.organization.billToAddress.country = code;
				for(var i=0; i<$scope.countries.length; i++){
					if($scope.countries[i].isoCode == code){
						$scope.bCountry = $scope.countries[i];
						break;
					}				
				}
				break;
			default: 
				$scope.shipTo.country = code;
				for(var i=0; i<$scope.countries.length; i++){
					if($scope.countries[i].isoCode == code){
						$scope.sCountry = $scope.countries[i];
						break;
					}				
				}
				break;			
		}
	}
	
	$scope.setProvince = function(code, type){
		switch(type){
			case 'bill':
				$scope.organization.billToAddress.province = code;
				break;
			default: 
				$scope.shipTo.province = code;
				break;			
		}		
	} 
	
	$scope.findInvoicesByCustomerId = function(id, pagenumber){
		if(id == undefined)
			id = $routeParams.id;
		if(pagenumber == undefined)
			pagenumber = 0;
		var data = {keyword: id, page: pagenumber, resultsPerPage: 10};
		invoiceService.findInvoicesByCustomerId(data).then(function(res){
			$scope.invoicesSearchResult = res.data;
			$scope.invoicesSearchResult.total = 0.00;
			$scope.invoicesSearchResult.paid = 0.00;
			for(var i=0; i<$scope.invoicesSearchResult.results.length;i++){
				//console.log($scope.invoicesSearchResult.results[i].totalAmount);
				//console.log($scope.invoicesSearchResult.results[i].amountPaid);
				$scope.invoicesSearchResult.total += $scope.invoicesSearchResult.results[i].totalAmount;
				$scope.invoicesSearchResult.paid += $scope.invoicesSearchResult.results[i].amountPaid;
			};
		}).catch(function(err){
			console.log(err);
		})
	}
	
	$scope.findOrdersByCustomerId = function(pagenumber, id){
		if(id == undefined)
			id = $routeParams.id;
		if(pagenumber == undefined)
			pagenumber = 0;
		var data = {keyword: id, page: pagenumber, resultsPerPage: 10};
		//console.log(data);
		orderService.findOrdersByCustomerId(data).then(function(res){
			$scope.customerOrders = res.data;
			$scope.customerOrders.total = 0.00;
			for(var i=0; i<$scope.customerOrders.results.length;i++){
				$scope.customerOrders.total += $scope.customerOrders.results[i].total;
			}
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.note = {};
	$scope.saveNote = function(){
		var data = $scope.note;
		data.organizationId = $scope.organization.id;
		//console.log(JSON.stringify(data));
		organizationService.saveNote(data).then(function(res){
			$scope.note = {};
			$("#commentTextArea").collapse("hide");
			$scope.organization = res.data;
			$scope.parseOrganization();
			$scope.showToast("Save Organization Note", "Note Saved to Organization", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Organization Note", err.data.errorMessage, false);
		})
	}
	
	$scope.getCustomerStats = function(id){
		orderService.customerStats(id).then(function(res){
			$scope.customerStats = res.data;
		});
	}
	
	$scope.getSupplierStats = function(id){
		
	}
	
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
});
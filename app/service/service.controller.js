captureControlApp.controller("serviceController", function($scope, $routeParams, $location, serviceService, organizationService, productService, shippingService, 
	configService, warehouseService){
		
	$scope.viewServiceOrder = function(id){ $location.path("/serviceorder/" + id); }
	
	$('#supplierModal').on('shown.bs.modal', function () {
  		$('#keyword').focus()
	})
	
	$scope.findGlobalConfig = function(){
		configService.findGlobalConfig().then(function(res){
			$scope.globalConfig = res.data;
			if($scope.globalConfig.address == undefined)
				$scope.globalConfig.address = {};
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findAllCarriers = function(){
		shippingService.findAllCarriers().then(function(res){
			$scope.carriers = res.data;
		}).catch(function(err){
			console.log(err);
		})
	}
	
	$scope.setCarrier = function(carrier){
		var data = { id: $scope.serviceorder.id, carrierId: carrier.id };
		serviceService.setCarrier(data).then(function(res){
			$scope.findById(res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		serviceService.findById(id).then(function(res){
			$scope.serviceorder = res.data;
			$scope.parseServiceOrder();
		}).catch(function(err){
			console.log(err);
			$scope.errorMessage = err;
		});
	}
	
	$scope.parseServiceOrder = function(){
		$scope.serviceorder.creationDate = new Date($scope.serviceorder.creationDate);
		$scope.serviceorder.lastModifiedDate = new Date($scope.serviceorder.lastModifiedDate);
		
		if($scope.serviceorder.requestedByDate != undefined)
			$scope.serviceorder.requestedByDate = new Date($scope.serviceorder.requestedByDate);
		
		if($scope.serviceorder.issuedDate != undefined)
			$scope.serviceorder.issuedDate = new Date($scope.serviceorder.issuedDate);
					
		if($scope.serviceorder.receivedDate != undefined)				
			$scope.serviceorder.receivedDate = new Date($scope.serviceorder.receivedDate);

		$scope.itemArray = [];
		for(var i=0; i<$scope.serviceorder.items.length; i++){
			$scope.itemArray.push({id: $scope.serviceorder.items[i].id, inventoryId: $scope.serviceorder.items[i].inventory.id, quantity: $scope.serviceorder.items[i].quantity, 
			unitPrice: $scope.serviceorder.items[i].unitPrice, tax: $scope.serviceorder.items[i].tax,
			productName: $scope.serviceorder.items[i].productName , productId: $scope.serviceorder.items[i].productId, lotSerial: $scope.serviceorder.items[i].inventory.lotSerial,
			instructions: $scope.serviceorder.items[i].instructions });
		}
			
		/* Add up current Invoice Total */ 
		if($scope.serviceorder.invoices != undefined && $scope.serviceorder.invoices.length > 0){
			$scope.serviceorder.paidInvoiceTotal = 0.00;
			$scope.serviceorder.invoices.forEach((item) =>{
				$scope.serviceorder.paidInvoiceTotal += item.priceInfo.total;
			});
			$scope.serviceorder.remainingInvoiceTotal = $scope.serviceorder.priceInfo.total - $scope.serviceorder.paidInvoiceTotal;
			
			
			/**
			 disable add invoice if total invoiced = serviceorder total
			**/
		}		
	}
	
	$scope.findInventoryByKeyword = function(){
		var keyword = $scope.keyword;
		var filters = [$scope.serviceorder.warehouse.id];
		var data = { keyword: keyword.toUpperCase(), filters: filters, page: 0, resultsPerPage: 15};
		productService.findAvailableInventoryByKeywordAndWarehouse(data).then(function(res){
			$scope.searchResults = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findApplicableTaxesByServiceOrderId = function(id){
		if(id == undefined)
			id = $routeParams.id;
		serviceService.findApplicableTaxes(id).then(function(res){
			$scope.taxes = res.data;
		}).catch(function(err){
			console.log(err);
		})
	}
	
	$scope.itemArray = [];
	$scope.containsItem = function(id){
		for(var i=0; i<$scope.itemArray.length;i++){
			if($scope.itemArray[i].inventoryId === id){
				return true;
			}
		}
		return false;
	}
	
	$scope.setItem = function(item){	
		/*
		 * Take item info and structure into ServiceOrderItemModel. Check if there is an 'ALL' tax. If not then set to 'E' */
		
		var defaultTax = '';
		if($scope.taxes.some(e => e.name === 'ALL')){
			defaultTax = 'ALL';
		}else
			defaultTax = 'E';

		var serviceOrderItemModel = {id: "", inventoryId: item.id, quantity: 1, unitPrice: 0.00, tax: defaultTax,
			productName:item.productName , productId:item.productId, lotSerial:item.lotSerial, instructions: ""  };
		
		//console.log("Item: " + JSON.stringify(serviceOrderItemModel));
		
		$scope.itemArray.push(serviceOrderItemModel);
		$("#findInventoryModal").modal("hide");
		/* Reset search form */
		$scope.keyword = undefined; 
		$scope.searchResults = undefined;
	}
	
	$scope.saveServiceOrderItems = function(){		
		$("#processingDialog").modal("show");
		var citemArray = [];
		$scope.itemArray.forEach(item => {
			//console.log(JSON.stringify(item));
			citemArray.push({id: item.id, inventoryId: item.inventoryId, quantity: item.quantity, unitPrice: item.unitPrice, tax: item.tax, instructions: item.instructions});
		});
		
		if(citemArray.length > 0){
			var data = { serviceOrderId: $scope.serviceorder.id, items: citemArray };
			serviceService.saveItems(data).then(function(res){
				$("#processingDialog").modal("hide");
				$scope.findById(res.data.id);
				$scope.showToast("Save Items To Service Order", "Service Order items updated", true);
			}).catch(function(err){
				$("#processingDialog").modal("hide");
				$scope.showToast("Save Items To Service Order", err.data.errorMessage, false);
			});
		}
	}
	
	$scope.focusField = function(field){ document.getElementById(field).focus(); }
	
	$scope.findServiceOrdersByKeyword = function(pageNumber){
		var keyword = $scope.keyword;
		if($scope.keyword == undefined || $scope.keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30};
    	serviceService.findByKeyword(data).then(function(res){
    			$scope.searchResults = res.data;
    			if($scope.searchResults.pages > 20)
					$scope.searchResults.pages = 20;
    		}).catch(function(err){
    			console.log(err);
    		});
	}
	
	$scope.sortResults = function(column){
		var sortDirection = $scope.searchResults.sortDirection;
		if(sortDirection == '+')
			sortDirection = "-";
		else
			sortDirection = "+";
		var data = { keyword: $scope.searchResults.keyword, page: 0, resultsPerPage: 30, sortBy: column, sortDirection: sortDirection };
		serviceService.findByKeyword(data).then(function(res){
			$scope.searchResults = res.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.serviceorder = {supplierAddress: {country:'', province:''}};
	$scope.countries = countries;
	$scope.saveNewServiceOrder = function(){
		var data = $scope.serviceorder;
		serviceService.save(data).then(function(res){
			$scope.viewServiceOrder(res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveServiceOrder = function(){
		var data = $scope.serviceorder;
		serviceService.save(data).then(function(res){
			$scope.serviceorder = res.data;
			$scope.parseServiceOrder();
			$scope.showToast("Save Service Order", "Service Order updated", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Service Order", err.data.errorMessage, false);
		});
	}
	
	$scope.repriceInvoice = function(){
		//console.log(JSON.stringify($scope.invoice));
		serviceService.repriceInvoice($scope.invoice).then(function(res){
			$scope.invoice = res.data;
			$scope.invoice.invoiceDate == undefined ? $scope.invoice.invoiceDate = new Date() : $scope.invoice.invoiceDate = new Date($scope.invoice.invoiceDate);
			$scope.invoice.dueDate == undefined ? $scope.invoice.dueDate = new Date() : $scope.invoice.dueDate = new Date($scope.invoice.dueDate);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.issueServiceOrder = function(id){
		serviceService.issueServiceOrder(id).then(function(res){
			$scope.serviceorder = res.data;
			$scope.parseServiceOrder();
			$scope.showToast("Service Order", "Service Order Issued", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Service Order", err.data.errorMessage, false);
		});
	}
	
	$scope.sendRFQ = function(id){
		
	}
	
	$scope.getServiceOrderForReceiving = function(id){
		//console.log("receive service order");
		serviceService.getServiceOrderForReceiving(id).then(function(res){
			$scope.receiveServiceOrder = res.data;
			$scope.receiveServiceOrder.receiveDate = new Date();
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.receiveStock = function(){
		$scope.processing = true;
		var data = $scope.receiveServiceOrder;
		$("#processingDialog").modal("show");
		serviceService.receiveStock(data).then(function(res){
			$scope.serviceorder = res.data;
			$scope.processing = false;
			$("#processingDialog").modal("hide");
			$scope.parseServiceOrder();
			$("#receiveModal").modal("hide");
			$scope.showToast("Receive Stock", "All updated stock items have been received", true);
		}).catch(function(err){
			console.log(err);
			$scope.processing = false;
			$("#receiveModal").modal("hide");
			$scope.showToast("Receive Stock", err.data.errorMessage, false);
		})
	}
	
	
	$scope.changeState = function(state){
		var data = { id: $scope.serviceorder.id, state: state };
		serviceService.changeState(data).then(function(res){
			$scope.serviceorder = res.data;
			$scope.parseServiceOrder();
			$scope.showToast("Cancel Service Order", "Service Order Cancelled", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Cancel Service Order", err.data.errorMessage, false);
		});
	}
	
	$scope.print = {qty: 1};
	$scope.printServiceOrderPDF = function(id){
		if($scope.print.type == 'SERVICEORDER'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			serviceService.printServiceOrder(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Service Order", "Service Order Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Service Order", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'SERVICEORDERPACKSLIP'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			serviceService.printServiceOrderPackSlip(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Service Order Pack Slip", "Service Order Pack Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Service Order Pack Slip", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'SERVICEORDERPACKSLIPINTL'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			serviceService.printServiceOrderPackSlip(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Service Order Pack Slip", "Service Order Pack Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Service Order Pack Slip", err.data.errorMessage, false);
			});
		}else{
			$scope.showToast("Print Document", "Document type is not defined.", false);
		}
	}
	
	$scope.downloadServiceOrderPDF = function(id){		
		serviceService.downloadServiceOrderPDF(id).then(function(res){
	        var linkElement = document.createElement('a');
	        try {
	            var blob = new Blob([res.data], { type: "application/pdf" });
	            var url = window.URL.createObjectURL(blob); 
	            linkElement.setAttribute('href', url);
	            linkElement.setAttribute("download", "Service-Order#" + id + ".pdf"); 
	            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
	            linkElement.dispatchEvent(clickEvent);
	        } catch (ex) {
	            console.log(ex);
	        }
		});
	};
	
	$scope.downloadServiceOrderPackSlipPDF = function(id){		
		serviceService.downloadServiceOrderPackSlipPDF(id).then(function(res){
	        var linkElement = document.createElement('a');
	        try {
	            var blob = new Blob([res.data], { type: "application/pdf" });
	            var url = window.URL.createObjectURL(blob); 
	            linkElement.setAttribute('href', url);
	            linkElement.setAttribute("download", "Service-Order#" + id + "-PackSlip.pdf"); 
	            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
	            linkElement.dispatchEvent(clickEvent);
	        } catch (ex) {
	            console.log(ex);
	        }
		});
	};
	
	$scope.downloadServiceOrderIntlPackSlipPDF = function(id){		
		serviceService.downloadServiceOrderIntlPackSlipPDF(id).then(function(res){
	        var linkElement = document.createElement('a');
	        try {
	            var blob = new Blob([res.data], { type: "application/pdf" });
	            var url = window.URL.createObjectURL(blob); 
	            linkElement.setAttribute('href', url);
	            linkElement.setAttribute("download", "Service-Order#" + id + "-PackSlip.pdf"); 
	            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
	            linkElement.dispatchEvent(clickEvent);
	        } catch (ex) {
	            console.log(ex);
	        }
		});
	};
	
	$scope.addInvoice = function(){
		$("#invoiceDialog").modal("hide");
		$("#processingDialog").modal("show");
		serviceService.addInvoice($scope.invoice).then(function(res){
			$scope.findById();
			$("#processingDialog").modal("hide");
			$scope.showToast("Add Invoice", "Invoice Added.", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.showToast("Add Invoice", err.data.errorMessage, false);
		});
	}
	
	$scope.findSOInvoice = function(id){
		//console.log("findso invoice");
		serviceService.findSOInvoice(id).then(function(res){
			$scope.invoice = res.data;
			$scope.invoice.invoiceDate = new Date($scope.invoice.invoiceDate);
			$scope.invoice.dueDate = new Date($scope.invoice.dueDate);
		}).catch(function(err){
			$scope.showToast("Find Invoice", err.data.errorMessage, false);
		});
	}
	
	$scope.findItemsForServiceOrderInvoice = function(id){
		if(id == undefined)
			id = $routeParams.id;
		serviceService.findItemsForServiceOrderInvoice(id).then(function(res){
			/* Create Invoice Item */
			$scope.invoice = res.data;
			$scope.invoice.invoiceDate == undefined ? $scope.invoice.invoiceDate = new Date() : $scope.invoice.invoiceDate = new Date($scope.invoice.invoiceDate);
			$scope.invoice.dueDate == undefined ? $scope.invoice.dueDate = new Date() : $scope.invoice.dueDate = new Date($scope.invoice.dueDate);
			$("#invoiceDialog").modal("show");			
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.addresses = [];
	$scope.setOrganization = function(id, name){
		organizationService.findById(id).then(function(res){
			$scope.organization = res.data;
			$scope.serviceorder.supplier = angular.copy($scope.organization);
		/* If only a billto address then preopulate the so supplier address.
			If shipto addresses then add to address array or selection. User
			can then select address to use.
		 */
			if($scope.serviceorder.supplier.shipToAddresses.length == 0){
				$scope.serviceorder.supplierAddress = $scope.serviceorder.supplier.billToAddress;
			}else{
				$scope.addresses.push($scope.serviceorder.supplier.billToAddress);
				$scope.serviceorder.supplier.shipToAddresses.forEach((item) => {
					$scope.addresses.push(item);
				});
			}
			$("#supplierModal").modal("hide");			
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.setSupplierAddress = function(address){
		$scope.serviceorder.supplierAddress = address;
	}
	
	$scope.findAllPhysicalWarehouses = function(){
		warehouseService.findAllPhysicalWarehouses().then(function(res){
			$scope.warehouses = res.data;
		});
	}
	
	$scope.setWarehouse = function(warehouse){
		$scope.serviceorder.warehouse = warehouse;
	}
	
	$scope.setServiceOrderCountry = function(code){
		$scope.serviceorder.supplierAddress.country = code;
		for(var i=0; i<$scope.countries.length; i++){
			if($scope.countries[i].isoCode == code){
				$scope.bCountry = $scope.countries[i];
				break;
			}				
		}
		//console.log(JSON.stringify($scope.bCountry));
	}
	
	$scope.setServiceOrderProvince = function(code){ $scope.serviceorder.supplierAddress.province = code; }
	
	$scope.saveServiceOrderAddress = function(){
		var data = $scope.serviceorder.supplierAddress;
		serviceService.saveSupplierAddress(data, $scope.serviceorder.id).then(function(res){
			$scope.serviceorder = res.data;
			$scope.parseServiceOrder();
			$scope.showToast("Save Supplier Address", "Supplier Address Saved", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Supplier Address", err.data.errorMessage, false);
		});
	}
	
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
});
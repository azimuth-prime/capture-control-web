captureControlApp.controller("orderController", function($scope, $routeParams, $window, $location, orderService,
		organizationService, configService, skuService, shippingService, warehouseService, invoiceService, emailService,
		userService, rmaService){
	
	$scope.order = {billToAddress: {country:'', province: ''}, shipToAddress: {country:'', province: ''}};
	$scope.customerName = '';
	$scope.countries = countries;
	$scope.completedStates = ['SHIPPED', 'INVOICED', 'COMPLETE', 'RETURNED'];
	
	$scope.viewOrder = function(id){
		$location.path("/order/" + id);
	}
	
	$('#findProductModal').on('shown.bs.modal', function () {
  		$('#keyword').focus()
	})
	
	$('#customerModal').on('shown.bs.modal', function () {
  		$('#keyword').focus()
	})
	
	$scope.focusField = function(field){
		document.getElementById(field).focus();
	}
	
	$scope.findAllSalesUsers = function(){		
		userService.findSalesUsers().then(function(res){
			$scope.salesusers = res.data;
			if($scope.order.soldBy == undefined)
				for(var i=0; i<$scope.salesusers.length; i++){
					if($scope.salesusers[i].id == $scope.currentUser.id)
						$scope.order.soldBy = $scope.salesusers[i];
				}
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.setSalesRep = function(item){
		$scope.order.soldBy = item;
	}

	$scope.findOrderByKeyword = function(pageNumber){	
    	var keyword = $scope.keyword;
		if(keyword == undefined || keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30 };
    	orderService.findOrderByKeyword(data).then(function(response){
			$scope.searchResults = response.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		}).catch(function(err){
			$scope.showToast("Search Orders", "Failed to load orders. Please try again.", false);
		});
	}
	
	$scope.sortResults = function(column){
		var sortDirection = $scope.searchResults.sortDirection;
		if(sortDirection == '+')
			sortDirection = "-";
		else
			sortDirection = "+";
		var data = { keyword: $scope.searchResults.keyword, page: 0, resultsPerPage: 30, sortBy: column, sortDirection: sortDirection };
		orderService.findOrderByKeyword(data).then(function(response){
			$scope.searchResults = response.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.showInvoiceButton = function(){
		/* If auto invoice generation is on then we don't display the button. If the order already has
		 an invoice then do not show the button. If the state is Quote, Cancelled or Complete then
		* do not show the button */
		
		if($scope.order.invoice == undefined){
			if($scope.order.state != 'CANCELLED' && $scope.order.state != 'QUOTE' && $scope.order.state != 'COMPLETE')
				if($scope.order.price.paymentTerm == 'PREPAID')
					$scope.showInvoiceBtn = true;
		}else
			$scope.showInvoiceBtn = false;
	}
	
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		if(id == undefined)
			id = $location.search().id;
		orderService.findById(id).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
		}).catch(function(err){
			console.log(err);
			$scope.errorMessage = err;
		});
	}
	
	$scope.parseOrder = function(){
		$scope.citemArray = [];
		$scope.order.creationDate = new Date($scope.order.creationDate);
		$scope.order.submittedDate = ($scope.order.submittedDate == null) ? null : new Date($scope.order.submittedDate);
		$scope.order.requestedShipDate = ($scope.order.requestedShipDate == null) ? null : new Date($scope.order.requestedShipDate);
		$scope.order.lastModifiedDate = new Date($scope.order.lastModifiedDate);
		$scope.order.shippedDate = ($scope.order.shippedDate == null) ? null : new Date($scope.order.shippedDate);
		if($scope.order.price.paymentMethod === undefined || $scope.order.price.paymentMethod === "")
			$scope.order.price.paymentMethod = $scope.order.customer.creditInfo.paymentMethod;
		
		if($scope.order.shippedDate == null || $scope.order.shippedDate == undefined)
			$scope.order.shippedDate = undefined;

		if($scope.order.state == 'QUOTE'){
			$scope.order.items.forEach(item => {
				$scope.citemArray.push({ id: item.id, lineNumber: item.lineNumber, orderId: item.orderId, quantity: item.quantityOrdered, backordered: item.quantityBackordered, price: item.unitPrice, sku: { id: item.sku.id, 
					productId: item.sku.productId, productName: item.sku.productName, description: item.sku.description }, tax: item.tax, salesTerms: item.salesTerms, inventoryType: item.sku.inventoryType });
			});
		}else{
			$scope.citemArray = $scope.order.items;
		}
		//console.log(JSON.stringify($scope.citemArray));

		$scope.setOrderCountry($scope.order.billToAddress.country, "bill");
		$scope.setOrderCountry($scope.order.shipToAddress.country, "ship");
		
		/* Calculate tax total, discount total */
		$scope.order.price.taxTotal = 0.00;
		$scope.order.price.taxes.forEach(tax => {
			$scope.order.price.taxTotal += tax.amount;
		});
		
		$scope.order.price.discountTotal = 0.00;
		
		
		if($scope.order.suborders != undefined && $scope.order.suborders.length > 0){
			var discounts = 0.00;
			for(var i=0; i<$scope.order.suborders.length; i++){
				$scope.order.suborders[i].price.discountTotal = 0.00;
				$scope.order.suborders[i].price.discounts.forEach(discount => {
					$scope.order.suborders[i].price.discountTotal += discount.savings;
					//console.log(discount.savings);
				});
				discounts += $scope.order.suborders[i].price.discountTotal;
			}
			$scope.order.price.discountTotal = discounts;
			//console.log(discounts);
		}else{
			$scope.order.price.discounts.forEach(discount => {
			$scope.order.price.discountTotal += discount.savings;
		});
		}
		$scope.showInvoiceButton();
	}
	
	$scope.generateBarcode = function(target, value, displayText, width, height, fontSize){
		JsBarcode(target, value, {
			  displayValue: displayText,
			  width: width,
			  height: height,
			  fontSize: fontSize
		});
	}
	
	$scope.updateBillToAddress = function(){
		$("#processingDialog").modal("show");
		var data = { orderId: $scope.order.id, address: $scope.order.billToAddress };
		orderService.updateBillToAddress(data).then(function(res){
			$scope.findById($scope.order.id);
			$("#processingDialog").modal("hide");
			$scope.showToast("Save BillTo Address", "Address updated", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.showToast("Save BillTo Address", err.data.errorMessage, true);
		})
	}
	
	$scope.updateShipToAddress = function(){
		$("#processingDialog").modal("show");
		var data = { orderId: $scope.order.id, address: $scope.order.shipToAddress };
		orderService.updateShipToAddress(data).then(function(res){
			$scope.findById($scope.order.id);
			$scope.findApplicableTaxesByOrderId($scope.order.id);
			$("#processingDialog").modal("hide");
			$scope.showToast("Save ShipTo Address", "Address updated", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.showToast("Save ShipTo Address", err.data.errorMessage, false);
		})
	}
	
	$scope.findAllPhysicalWarehouses = function(){
		warehouseService.findAllPhysicalWarehouses().then(function(res){
			$scope.warehouses = res.data;
			if($scope.warehouses.length == 1)
				$scope.order.warehouse = $scope.warehouses[0];
		});
	}
	
	$scope.setWarehouse = function(warehouse){
		$scope.order.warehouse = warehouse;
	}
	
	$scope.setPickupWarehouse = function(item){
		$scope.order.price.shipInfo.pickupLocation = item.id;
	}
	
	$scope.saveOrder = function(){
		var data = $scope.order;
		orderService.save(data).then(function(res){
			$scope.viewOrder(res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.updateOrder = function(){
		var data = $scope.order;
		orderService.save(data).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
			$scope.showToast("Save Order", "Order updated", true);
		}).catch(function(err){
			$scope.showToast("Save Order", err.data.errorMessage, false);
		});
	}
	
	$scope.setOrganization = function(id){
		/* FindOrgById. Set Order Org. Copy Org BillTo to order BillTo */
		organizationService.findById(id).then(function(res){
			$scope.organization = res.data;
			$scope.order.customer = angular.copy($scope.organization);
			if($scope.organization.billToAddress != undefined){
				$scope.order.billToAddress = angular.copy($scope.organization.billToAddress);
				delete $scope.order.billToAddress.id;
			}
			$scope.customerName = $scope.order.customer.name;
			/* check if customer has shipping address if not then copy billto to shipto. */
			if($scope.organization.billToAddress != undefined){
				if($scope.organization.shipToAddresses == undefined || $scope.organization.shipToAddresses.length < 1){
					$scope.order.shipToAddress = $scope.order.billToAddress;
					$scope.order.shipToAddress.companyName = $scope.organization.name;
				}else if($scope.organization.shipToAddresses != undefined && $scope.organization.shipToAddresses.length == 1){
					$scope.order.shipToAddress = $scope.organization.shipToAddresses[0];
					$scope.order.shipToAddress.companyName = $scope.organization.name;
				}else{
					$scope.order.shipToAddress = undefined;
				}
			}
			$("#customerModal").modal("hide");
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.pickOrder = function(id){
		$location.path("/pick-details/" + id);
	}
	
	$scope.packOrder = function(id){
		$location.path("/pack-details/" + id);
	}
	
	$scope.shipOrder = function(id){
		$location.path("/ship-details/" + id);
	}
	
	$scope.setShipTo = function(id){
		for(var i=0; i<$scope.organization.shipToAddresses.length; i++){
			if($scope.organization.shipToAddresses[i].id == id){
				$scope.order.shipToAddress = angular.copy($scope.organization.shipToAddresses[i]);
				delete $scope.order.shipToAddress.id;
			}
		}
	}
	
	$scope.setOrderCountry = function(code, type){
		//console.log("code: " + code + ": type: " + type);
		switch(type){
			case 'bill': 
				$scope.order.billToAddress.country = code;
				for(var i=0; i<$scope.countries.length; i++){
					if($scope.countries[i].isoCode == code){
						$scope.bCountry = $scope.countries[i];
						break;
					}				
				}
				break;
			default: 
				$scope.order.shipToAddress.country = code;
				for(var i=0; i<$scope.countries.length; i++){
					if($scope.countries[i].isoCode == code){
						$scope.sCountry = $scope.countries[i];
						break;
					}				
				}
				break;			
		}
	}
	
	$scope.setOrderProvince = function(code, type){
		//console.log("code: " + code + ": type: " + type);
		switch(type){
			case 'bill': 
				$scope.order.billToAddress.province = code;
				break;
			default: 
				$scope.order.shipToAddress.province = code;
				break;			
		}		
	}
	
	/* Order Items */	
	$scope.citemArray = [];
	$scope.setItemProduct = function(index){	
		/*
		 * Take item info and structure into OrderItemModel. Check if there is an 'ALL' tax. If not then set to 'E'
		*/	
		var defaultTax = '';
		if($scope.taxes.some(e => e.name === 'ALL')){
			defaultTax = 'ALL';
		}else
			defaultTax = 'E';
			
		var selectedItem = $scope.searchResults.results[index];
		var priceValue = 0.00;
		
		if(selectedItem.prices == undefined || selectedItem.prices.length == 0){
			//console.log("length = 0")
			priceValue = 0.00;
		}	
		else if(selectedItem.prices.length == 1){
			//console.log("length = 1");
			var priceStr = selectedItem.prices[0].split("=");
			priceValue = parseFloat(priceStr[1]);
		}
		else{
			//console.log("length = " + selectedItem.prices.length);
			for(var i=0; i<selectedItem.prices.length;i++){
				if(selectedItem.prices[i].indexOf($scope.order.price.currency.code) > -1){
					//console.log("Found Code");
					var priceStr = selectedItem.prices[i].split("=");
					//console.log("Array: " + priceStr);
					priceValue = parseFloat(priceStr[1]);
					//console.log("Price: " + priceValue);
				}
			}
		}

		var orderItemModel = {id: "", lineNumber: $scope.citemArray.length, orderId: $scope.order.id, quantity: 1, price: priceValue, tax: defaultTax,
				sku: {id: selectedItem.id, productId: selectedItem.productId, productName: selectedItem.productName, 
					description: selectedItem.description}, salesTerms: "OUTRIGHT", inventoryType: selectedItem.inventoryType };
		
		$scope.citemArray.push(orderItemModel);
		//console.log(JSON.stringify($scope.citemArray));
		$scope.repriceOrder();
		$("#findProductModal").modal("hide");
		/* Reset searchg form */
		$scope.keyword = undefined; 
		$scope.searchResults = undefined;
	}
	
	$scope.orderContainsItem = function(item){
		for(var i=0; i<$scope.citemArray.length;i++){
			if($scope.citemArray[i].sku.id === item.id && item.controlType != 'SERIAL'){
				return true;
			}
		}
		return false;
	}
	
	/* Save order items. Only require reduced field list of inventoryId, quantity, price and orderId */
	$scope.saveOrderItems = function(){		
		$("#processingDialog").modal("show");
		var itemArray = [];
		$scope.citemArray.forEach(item => {
			if(item.sku.productId != undefined && item.sku.productId != "")
				itemArray.push({id: item.id, lineNumber: item.lineNumber, skuId: item.sku.id, quantityOrdered: item.quantity, price: item.price, tax: item.tax, salesTerms: item.salesTerms});
		});
		
		if(itemArray.length > 0){
			var data = { orderId: $scope.order.id, items: itemArray };
			orderService.saveOrderItems(data).then(function(res){
				$("#processingDialog").modal("hide");
				$scope.findById(res.data.id);
				$scope.showToast("Save Items To Order", "Order items updated", true);
			}).catch(function(err){
				$("#processingDialog").modal("hide");
				$scope.showToast("Save Items To Order", err.data.errorMessage, false);
			});
		}
	}
	
	/* Set the currentIndex so that the modal knows what to update */
	$scope.setCurrentIndex = function(index){ $scope.currentIndex = index; }
	
	$scope.calculate = function(p1, p2){ return parseFloat(p1 * p2).toFixed(2); }
	
	$scope.repriceOrder = function(){
		var subtotal = 0.00;
		var taxes = 0.00;
		$scope.citemArray.forEach(item => {
			if(item.inventory != undefined){
				subtotal += item.price * item.quantity;
				//taxes 
			}
		});
		$scope.order.price.subTotal = subtotal;
		$scope.order.price.total = subtotal + taxes;
	}
	
	$scope.rawSubtotal = 0.00;
	$scope.calculateRawSubtotal = function(id, isSuborder){
		var rawSubtotal = 0.00;
		if(isSuborder){
			/* get suborder matching id from main order object */
			var order = undefined;
			for(var i=0; i<$scope.order.suborders.length;i++){
				if(id == $scope.order.suborders[i].id){
					order = $scope.order.suborders[i];
					order.items.forEach(item => {
						rawSubtotal += (item.quantityOrdered * item.unitPrice);
					});
				}
			}
		}else{
			$scope.order.items.forEach(item => {
				rawSubtotal += (item.quantityOrdered * item.unitPrice);
			});
		}
		
		return rawSubtotal;
	}
	
	$scope.changeOrderState = function(id, state){
		var data = { id: id, state: state };
		orderService.changeOrderState(data).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
			$scope.showToast("Change Order State", "Order State Changed to: " + state, true);
		}).catch(function(err){
			$scope.showToast("Change Order State", err.data.errorMessage, false);
		});
	}
	
	$scope.bookOrder = function(id){
		$("#processingDialog").modal("show");
		orderService.bookOrder(id).then(function(res){
			$scope.order = res.data;
			$("#processingDialog").modal("hide");
			$scope.parseOrder();
			$scope.showToast("Book Order", "Order has been booked.", true);
		}).catch(function(err){
			$("#processingDialog").modal("hide");
			$scope.showToast("Book Order", err.data.errorMessage, false);
		});
	}
	
	$scope.findSkuByKeyword = function(pageNumber){
		if($scope.keyword != undefined && $scope.keyword.length >= 3){
    		if(pageNumber == undefined)
    			pageNumber = 0;
    		var filters = [];
    		//console.log("WH: " + $scope.order.warehouse.name);
    		if($scope.order.warehouse.name != undefined){
				//console.log("warehouseId has value: " + $scope.order.warehouse.name);
				filters.push($scope.order.warehouse.name);
			}
    			
	    	var data = { keyword: $scope.keyword.toUpperCase(), page: pageNumber, resultsPerPage: 10, filters: filters};
	    	skuService.findSkuByKeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    			if($scope.searchResults.pages > 5)
	    				$scope.searchResults.pages = 5;
	    		})
    	}else{
    		$scope.searchResults = undefined;
    	}
	}
	
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
	
	$scope.findApplicableTaxesByOrderId = function(id){
		if(id == undefined)
			id = $routeParams.id;
		orderService.findApplicableTaxesByOrderId(id).then(function(res){
			$scope.taxes = res.data;
		}).catch(function(err){
			console.log(err);
		})
	}
	
	$scope.updateTaxes = function(){
		/* update taxes for order id and reprice */
		var data = {orderId: $scope.order.id, tax: $scope.order.tax};
		orderService.updateOrderWithApplicableTaxes(data).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
			$scope.showToast("Change Order Taxes", "Order Taxes Updated", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Change Order Taxes", err.data.errorMessage, false);
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
		if(carrier.name != "Pickup"){
			var data = { id: $scope.order.id, carrierId: carrier.id, accountNumber: $scope.order.price.shipInfo.accountNumber }; 
			shippingService.setCarrier(data).then(function(res){
				$scope.order = res.data;
				$scope.parseOrder();
				$scope.showToast("Select Carrier", "Carrier Selection Updated", true);
			}).catch(function(err){
				console.log(err);
				$scope.showToast("Select Carrier", err.data.errorMessage, false);
			});
		}else{
			$scope.order.price.shipInfo.carrier = carrier;
		}
	}
	
	$scope.setPickupWarehouse = function(item){
		var carrier = $scope.order.price.shipInfo.carrier;
		if(carrier.name == "Pickup"){
			var data = { id: $scope.order.id, carrierId: carrier.id, pickupLocation: item.id};
			shippingService.setCarrier(data).then(function(res){
				$scope.order = res.data;
				$scope.parseOrder();
			}).catch(function(err){
				console.log(err);
			});
		}
	}
	
	$scope.saveDiscount = function(){
		var data = {orderId: $scope.order.id, discount: $scope.discount};
		data.discount.appliesTo = "SUBTOTAL";
		orderService.saveDiscount(data).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
			if(data.discount.id != undefined)
				$scope.showToast("Sales Order Discount", "Discount Updated", true);
			else
				$scope.showToast("Sales Order Discount", "Discount Added", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Sales Order Discount", err.data.errorMessage, false);
		});
	}
	
	$scope.setDiscountEmpty = function(){
		$scope.discount = {};  
		$scope.discountForm.$valid
		$scope.discountForm.$setPristine();
		$scope.discountForm.$setUntouched();
	} 
	
	$scope.findDiscountById = function(id){
		for(var i=0; i<$scope.order.price.discounts.length; i++){
			//console.log($scope.order.price.discounts[i]);
			if($scope.order.price.discounts[i].id == id){
				$scope.discount = $scope.order.price.discounts[i];
			}
		}
	}
	
	$scope.deleteDiscount = function(id){
		var data = {id: id, orderId: $scope.order.id};
		orderService.deleteDiscount(data).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
			$scope.showToast("Remove Discount From Order", "Discount Removed", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Remove Discount From Order", err.data.errorMessage, false);
		});
	}

	$scope.setOrderPaymentInfo = function(item, type){
		if(type == 'TERMS')
			$scope.order.price.paymentTerm = item;
		else if(type == 'METHOD')
			$scope.order.price.paymentMethod = item;
	}
	
	$scope.saveOrderPaymentInfo = function(){
		orderService.saveOrderPaymentInfo($scope.order.id, $scope.order.price).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
			$scope.showToast("Change Payment Method", "Payment Method Updated", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Change Payment Method", err.data.errorMessage, false);
		});
	}
	
	$scope.findGlobalConfig = function(){
		configService.findGlobalConfig().then(function(res){
			$scope.globalConfig = res.data;
		}).catch(function(err){
			
		});
	}
	
	$scope.generateInvoiceByOrderId = function(id){
		orderService.generateInvoiceByOrderId(id).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
			$scope.showToast("Generate Invoice", "Invoice generated for Order #: " + $scope.order.id, true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Generate Invoice", err.data.errorMessage, false);
		})
	}
	
	$scope.prepQuoteObj = function(){
		$scope.quoteEmail = $scope.order.billToAddress.contactEmail;
	}
	
	$scope.sendQuote = function(){
		/* Ad a default email address */
		var data = {id: $scope.order.id, emailTo: $scope.quoteEmail};
		//console.log(data);
		orderService.sendQuote(data).then(function(res){
			$scope.showToast("Send Quote", "Quote sent for Order #: " + $scope.order.id, true);
		}).catch(function(err){
			$scope.showToast("Send Quote", err.data.errorMessage, false);
		});
	}
	
	$scope.print = {qty: 1};
	$scope.printPDF = function(id){
		if($scope.print.type == 'COMPACK'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			warehouseService.printCommercialPackSlip(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Commercial Packing Slip", "Commercial Packing Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Commercial Packing Slip", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'COMINVOICE'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			//console.log(JSON.stringify(data));
			invoiceService.printCommercialInvoice(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Commercial Invoice", "Commercial Invoice Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Commercial Invoice", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'PACK'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			invoiceService.printPackSlip(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Packing Slip", "Packing Slip Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Packing Slip", err.data.errorMessage, false);
			});
		}else if($scope.print.type == 'ORDER'){
			if(id == undefined)
				id = $routeParams.id;
			var data = {id: id, qty: $scope.print.qty};
			orderService.printOrder(data).then(function(res){
				$scope.print = {qty: 1};
				$("#printDialog").modal("hide");
				$scope.showToast("Print Sales Order", "Sales Order Sent to System Printer", true);
			}).catch(function(err){
				console.log(err);
				$("#printDialog").modal("hide");
				$scope.showToast("Print Sales Order", err.data.errorMessage, false);
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
		
		$scope.email.type = type;
		if(type == 'SALESORDER')
			$scope.email.subject = "Sales Order #: " + $scope.order.id;
		else if(type == 'SALESQUOTE')
			$scope.email.subject = "Sales Quote #: " + $scope.order.id;
		$scope.email.cc = [$scope.currentUser.email];
	}
	
	$scope.sendEmail = function(){
		//console.log($scope.quill.root.innerHTML);
		
		$("#emailDialog").modal("hide");
		$scope.loadingMessage = "Sending Email...";
		$("#processingDialog").modal("show");
		var data = $scope.email;
		data.to = data.to.split(',');
		if(data.cc != undefined)
			data.cc = data.cc.split(',');
		if(data.bcc != undefined)
			data.bcc = data.bcc.split(',');
		data.id = $scope.order.id;
		data.content = $scope.quill.root.innerHTML;
		
		var emailType = data.type;
		emailService.sendSalesOrderEmail(data).then(function(res){
			$("#processingDialog").modal("hide");
			$scope.quill.disable();
			$scope.email = {};
			$scope.showToast("Send Email", emailType + " Email Sent.", true);
		}).catch(function(err){
			$("#processingDialog").modal("hide");
			$scope.quill.disable();
			$scope.email = {};
			$scope.showToast("Send Email", err.data.errorMessage, false);
		});
	}
	
	$scope.validateEmails = function(item, type){
		var validRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
		var emails = [];
		var valid = true;
		
		if(item.trim().length == 0){
			// do nothing
		}else{
			emails = item.trim().split(',');
			for(var i=0; i<emails.length; i++){
				if(!emails[i].match(validRegex))
					valid = false;			
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
	
	$scope.setShipAmount = function(){
		//console.log("ship amount: " + $scope.order.price.shipInfo.amount);
		var data = {orderId: $scope.order.id, shipInfo: $scope.order.price.shipInfo};
		orderService.setShipEstimate(data).then(function(res){
			$scope.order = res.data;
			$scope.parseOrder();
			$scope.showToast("Set Shipping Estimate", "Shipping cost updated", true);
		}).catch(function(err){
			$scope.showToast("Set Shipping Estimate", err.data.errorMessage, false);
		});
	}
	
	$scope.downloadSalesOrderPDF = function(id, type){
		if(type == 'SALESQUOTE' || type == 'SALESORDER')		
			orderService.downloadSalesOrderPDF(id).then(function(res){
		        var linkElement = document.createElement('a');
		        try {
		            var blob = new Blob([res.data], { type: "application/pdf" });
		            var url = window.URL.createObjectURL(blob); 
		            linkElement.setAttribute('href', url);
		            linkElement.setAttribute("download", "SalesOrder#" + id + ".pdf"); 
		            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
		            linkElement.dispatchEvent(clickEvent);
		        } catch (ex) {
		            console.log(ex);
		        }
			});
		else if(type == 'COMINVOICE')
			invoiceService.downloadCommercialInvoicePDF(id).then(function(res){
		        var linkElement = document.createElement('a');
		        try {
		            var blob = new Blob([res.data], { type: "application/pdf" });
		            var url = window.URL.createObjectURL(blob); 
		            linkElement.setAttribute('href', url);
		            linkElement.setAttribute("download", "CommercialInvoice#" + $scope.order.invoice.id + ".pdf"); 
		            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
		            linkElement.dispatchEvent(clickEvent);
		        } catch (ex) {
		            console.log(ex);
		        }
			});
		else if(type == 'PACK')
			warehouseService.downloadPackingSlipPDF(id).then(function(res){
		        var linkElement = document.createElement('a');
		        try {
		            var blob = new Blob([res.data], { type: "application/pdf" });
		            var url = window.URL.createObjectURL(blob); 
		            linkElement.setAttribute('href', url);
		            linkElement.setAttribute("download", "PackingSlip#" + id + ".pdf"); 
		            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
		            linkElement.dispatchEvent(clickEvent);
		        } catch (ex) {
		            console.log(ex);
		        }
			});
		else if(type == 'COMPACKING')
			warehouseService.downloadCommercialPackingSlipPDF(id).then(function(res){
		        var linkElement = document.createElement('a');
		        try {
		            var blob = new Blob([res.data], { type: "application/pdf" });
		            var url = window.URL.createObjectURL(blob); 
		            linkElement.setAttribute('href', url);
		            linkElement.setAttribute("download", "CommercialPackingSlip#" + id + ".pdf"); 
		            var clickEvent = new MouseEvent("click", {"view": window,"bubbles": true,"cancelable": false});
		            linkElement.dispatchEvent(clickEvent);
		        } catch (ex) {
		            console.log(ex);
		        }
			});
	}
	
	$scope.buildRMA = function(id){
		rmaService.generateRMAItems(id).then(function(res){
			$scope.rma = res.data;
		});
	}
});
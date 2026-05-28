captureControlApp.controller("purchaseController", function($scope, $routeParams, $location, purchaseService, organizationService, skuService, shippingService, 
	configService, warehouseService){
	
	$scope.viewPurchaseOrder = function(id){ $location.path("/purchase/" + id); }
	
	$scope.viewBackorderedSKU = function(id){ $location.path("/products/skus/" + id); }
	
	$('#findSKUModal').on('shown.bs.modal', function () {
  		$('#keyword').focus()
	})
	
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
		var data = { id: $scope.po.id, carrierId: carrier.id };
		purchaseService.setCarrier(data).then(function(res){
			$scope.findById(res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		purchaseService.findById(id).then(function(res){
			$scope.po = res.data;
			$scope.parsePO();
		}).catch(function(err){
			console.log(err);
			$scope.errorMessage = err;
		});
	}
	
	$scope.focusField = function(field){ document.getElementById(field).focus(); }
	
	$scope.parsePO = function(){
		$scope.po.creationDate = new Date($scope.po.creationDate);
		$scope.po.lastModifiedDate = new Date($scope.po.lastModifiedDate);
		
		if($scope.po.requestedByDate != undefined)
			$scope.po.requestedByDate = new Date($scope.po.requestedByDate);
		
		if($scope.po.issueDate != undefined)
			$scope.po.issueDate = new Date($scope.po.issueDate);
					
		if($scope.po.receivedDate != undefined)				
			$scope.po.receivedDate = new Date($scope.po.receivedDate);

		$scope.itemArray = $scope.po.items;
			
		/* Add up current Invoice Total */ 
		$scope.po.paidInvoiceTotal = 0.00;
		$scope.po.invoices.forEach((item) =>{
			$scope.po.paidInvoiceTotal += item.priceInfo.total;
		});
		$scope.po.remainingInvoiceTotal = $scope.po.priceInfo.total - $scope.po.paidInvoiceTotal;
	}
	
	$scope.printPO = function(id){
		purchaseService.printPurchaseOrder(id).then(function(res){
			$scope.showToast("Print Purchase Order", "Purchase Sent to Printer", true);
		}).catch(function(err){
			$scope.showToast("Print Purchase Order", err.data.errorMessage, false);
		});
	}
	
	$scope.findByIdForPrint = function(){
		id = $location.search().id;
		purchaseService.findById(id).then(function(res){
			$scope.printPO = res.data;
			$scope.generateBarcode("#poBarcode", res.data.id, true, 3, 100, 20);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.generateBarcode = function(target, value, displayText, width, height, fontSize){
		//console.log("generate barcode: " + target + ", " + value + " " + displayText);
		JsBarcode(target, value, {
			  displayValue: displayText,
			  width: width,
			  height: height,
			  fontSize: fontSize
		});
	}

	$scope.po = {warehouse: {id: "", name: ""}, supplier: {id: ""}, items:[]};
	$scope.saveNewPO = function(){
		var data = $scope.po;
		purchaseService.save(data).then(function(res){
			$scope.viewPurchaseOrder(res.data.id);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.savePO = function(){
		var data = $scope.po;
		purchaseService.save(data).then(function(res){
			$scope.po = res.data;
			$scope.parsePO();
			$scope.showToast("Save Purchase Order", "Purchase Order Chnages Saved", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Purchase Order", err.data.errorMessage, false);
		});
	}
	
	$scope.getPOForReceiving = function(id){
		//console.log("receive po");
		purchaseService.getPOForReceiving(id).then(function(res){
			$scope.receivePO = res.data;
			$scope.receivePO.receiveDate = new Date($scope.receivePO.receiveDate);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.processing = false;
	$scope.receiveStock = function(){
		$scope.processing = true;
		var data = $scope.receivePO;
		$("#processingDialog").modal("show");
		purchaseService.receiveStock(data).then(function(res){
			$scope.po = res.data;
			$scope.processing = false;
			$("#processingDialog").modal("hide");
			$scope.parsePO();
			$("#receiveModal").modal("hide");
			$scope.showToast("Receive Stock", "All updated stock items have been received", true);
		}).catch(function(err){
			console.log(err);
			$scope.processing = false;
			$("#receiveModal").modal("hide");
			$scope.showToast("Receive Stock", err.data.errorMessage, false);
		})
	}
	
	$scope.issuePO = function(id){
		$("#processingDialog").modal("show");
		purchaseService.issuePO(id).then(function(res){
			$("#processingDialog").modal("hide");
			$scope.findById(res.data.id);
			$scope.showToast("Issue Purchase Order", "Purchase Order has been issued.", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.showToast("Issue Purchase Order", err.data.errorMessage, false);
		});
	}
	
	$scope.changeState = function(state){
		var data = { id: $scope.po.id, state: state };
		purchaseService.changeState(data).then(function(res){
			$scope.findById(res.data.id);
			$scope.showToast("Change Purchase Order State", "Purchase Order State changed to " + state, true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Change Purchase Order State", err.data.errorMessage, false);
		});
	}
	
	$scope.findPosByKeyword = function(pageNumber){
		var keyword = $scope.keyword;
		if($scope.keyword == undefined || $scope.keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
			pageNumber = 0;
    	var data = { keyword: keyword.toUpperCase(), page: pageNumber, resultsPerPage: 30};
    	purchaseService.findPosByKeyword(data).then(function(res){
    			$scope.searchResults = res.data;
    			if($scope.searchResults.pages > 20)
					$scope.searchResults.pages = 20;
    		}).catch(function(err){
    			console.log(err);
    		});
	}
	
	$scope.sortResults = function(column){
		//console.log("sort results");
		var sortDirection = $scope.searchResults.sortDirection;
		if(sortDirection == '+')
			sortDirection = "-";
		else
			sortDirection = "+";
		var data = { keyword: $scope.searchResults.keyword, page: 0, resultsPerPage: 30, sortBy: column, sortDirection: sortDirection };
		//console.log("data: " + data);
		purchaseService.findPosByKeyword(data).then(function(res){
			$scope.searchResults = res.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		});
	}
	
	$scope.setOrganization = function(id, name){

		organizationService.findById(id).then(function(res){
			$scope.organization = res.data;
			$scope.po.supplier = angular.copy($scope.organization);
			$("#supplierModal").modal("hide");	
			$scope.focusField(angular.element("supplierId"));		
		}).catch(function(err){
			
		});
	}
	
	$scope.findAllWarehouses = function(){
		warehouseService.findAll().then(function(res){
			$scope.warehouses = res.data;
		});
	}
	
	$scope.setNewPOWarehouse = function(item){
		$scope.po.warehouse = item;
	}
	
	$scope.setPOWarehouse = function(item){
		$scope.po.warehouse = item;
		$scope.savePO();
	}
	
	$scope.calculate = function(p1, p2){ return parseFloat(p1 * p2).toFixed(2); }
	
	$scope.findRestockByKeyword = function(pageNumber, filter){
		if($scope.keyword != undefined && $scope.keyword.length >= 3){
    		if(pageNumber == undefined)
    			pageNumber = 0;
    		var filters = [filter];
	    	var data = { keyword: $scope.keyword.toUpperCase(), filters: filters, page: pageNumber, resultsPerPage: 10 };
	    	purchaseService.findRestockByKeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    			if($scope.searchResults.pages > 1)
	    				$scope.searchResults.pages = 1;
	    		})
    	}else{
    		$scope.searchResults = undefined;
    	}
	}
	
	$scope.containsSku = function(id){
		for(var i=0; i<$scope.itemArray.length;i++){
			if($scope.itemArray[i].skuId === id){
				return true;
			}
		}
		return false;
	}
	
	/* 
	 * Purchase Order Methods - FindPOById(), SavePO(), SavePOItems(), SetPOItemSku(), POContains()
	 */	
	$scope.setPOItemSku = function(index){	
		/*
		 * Take item info and structure into poItemModel.
		*/	
		
		var selectedItem = $scope.searchResults.results[index];
		var poItemModel = {id: "", purchaseOrderId: $scope.po.id, ordered: 1, approved: 0, received: 0, unitPrice: selectedItem.unitCost,
				skuId: selectedItem.skuId, productId: selectedItem.productId, productName: selectedItem.productName, color: selectedItem.color,
				size: selectedItem.size, tax:'ALL'};
		$scope.itemArray.push(poItemModel);
		$("#findSKUModal").modal("hide");
		/* Reset search form */
		$scope.keyword = undefined; 
		$scope.searchResults = undefined;
	}
	
	/* Set the currentIndex so that the modal knows what to update */
	$scope.setCurrentIndex = function(index){ $scope.currentIndex = index; }
	
	/* Save order items. Only require reduced field list of inventoryId, quantity, price and orderId */
	$scope.savePoItems = function(){
		var pItemArray = [];
		for(var i=0; i<$scope.itemArray.length; i++){			
			if($scope.itemArray[i].skuId != undefined && $scope.itemArray[i].skuId != "")
				pItemArray.push({id: $scope.itemArray[i].id, skuId: $scope.itemArray[i].skuId, ordered: $scope.itemArray[i].ordered, 
					approved: $scope.itemArray[i].approved, received: $scope.itemArray[i].received, unitPrice: $scope.itemArray[i].unitPrice, tax:$scope.itemArray[i].tax});
		}
		
		if(pItemArray.length > 0){
			var data = { purchaseOrderId: $scope.po.id, items: pItemArray };
			
			purchaseService.savePOItems(data).then(function(res){
				$scope.findById(res.data.id);
				$scope.showToast("Save Items To Purchase Order", "Purchase Order items updated", true);
			}).catch(function(err){
				$scope.showToast("Save Items To Purchase Order", err.data.errorMessage, false);
			}); 
		}
	}
	
	/*
	 * Price Lists. FindPriceListByVendorId(), setPLItemSku(), SavePLItem(), SavePLItems()
	 */	
	$scope.viewPricelist = function(id){
		$location.path("/vendor-price-list/" + id);
	}
	
	$scope.findAllPriceLists = function(){
		purchaseService.findAllPriceLists().then(function(res){
			$scope.priceLists = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findPriceListBySupplierId = function(id){
		$("#processingDialog").modal("show");
		if(id == undefined)
			id = $routeParams.id;
		purchaseService.findPriceListBySupplierId(id).then(function(res){
			$scope.pl = res.data;
			$scope.itemArray = $scope.pl.items;
			/* Add empty slot for next item */
			$scope.itemArray.push({ id: "", supplierId: $scope.pl.supplier.id, productId: "", productName: "", vendorProductId: "", skuId: "", 
				vendorSkuId: "", unitCost: 0.00, leadTime: 1, stockUnit: ""});
			$("#processingDialog").modal("hide");
		}).catch(function(err){
			console.log(err);
			$scope.errorMessage = err;
			$("#processingDialog").modal("hide");
		});
	}
	
	$scope.setPLItemSku = function(index){			
		var selectedItem = $scope.searchResults.results[index];
		var plItemModel = { supplierId: $scope.pl.supplier.id, productId: selectedItem.productId, 
				productName: selectedItem.productName, vendorProductId: selectedItem.vendorProductId, skuId: selectedItem.id, 
				vendorSkuId: selectedItem.vendorSkuId, unitCost: 0.00, leadTime: 1, stockUnit: selectedItem.stockUnit};

		$scope.itemArray[$scope.currentIndex] = plItemModel;
		/* Add empty slot for next item */
		if($scope.currentIndex == $scope.itemArray.length - 1)
			$scope.itemArray.push({ id: "", supplierId: $scope.pl.supplier.id, productId: "", productName: "", vendorProductId: "", skuId: "", 
				vendorSkuId: "", unitCost: 0.00, leadTime: 1, stockUnit: ""});
		$("#findProductModal").modal("hide");
		/* Reset search form */
		$scope.keyword = undefined; 
		$scope.searchResults = undefined;
	}
	
	$scope.savePlItems = function(){
		$("#processingDialog").modal("show");
		var plItemArray = [];
		for(var i=0; i<$scope.itemArray.length; i++){			
			if($scope.itemArray[i].skuId != undefined && $scope.itemArray[i].skuId != "")
				plItemArray.push({id: $scope.itemArray[i].id, supplierId: $scope.itemArray[i].supplierId, upc: $scope.itemArray[i].upc,
					skuId: $scope.itemArray[i].skuId, vendorProductId: $scope.itemArray[i].vendorProductId, vendorSkuId: $scope.itemArray[i].vendorSkuId, 
					unitCost: $scope.itemArray[i].unitCost, leadTime: $scope.itemArray[i].leadTime, stockUnit: $scope.itemArray[i].stockUnit});
		}
		
		if(plItemArray.length > 0){
			var data = { supplierId: $scope.pl.supplier.id, items: plItemArray };
			//console.log(JSON.stringify(data));
			
			purchaseService.savePLItems(data).then(function(res){
				$scope.pl = res.data;
				$("#processingDialog").modal("hide");
				$scope.showToast("Save Items To Price List", "Price List items updated", true);
			}).catch(function(err){
				$("#processingDialog").modal("hide");
				$scope.showToast("Save Items To Price List", err.data.errorMessage, false);
			}); 
		}
	}
	
	$scope.findSkuConfigInfo = function(){
		skuService.findSkuConfigInfo().then(function(res){
			$scope.skuConfig = res.data;
		});
	}
	
	$scope.uploadPriceList = function(){
		var fileReader = new FileReader();
		fileReader.onload = function(event){
			var data = event.target.result;
			var workbook = XLSX.read(data, {
				type: "binary"
			});

			let sheetName = workbook.SheetNames[0];
			let rowObject = XLS.utils.sheet_to_row_object_array(
					workbook.Sheets[sheetName]	
			);
			let jsonObject = JSON.stringify(rowObject);
			var listData = JSON.parse(jsonObject);
			for(var i=0; i<listData.length; i++){
				listData[i].unitCost = parseFloat(listData[i].unitCost);
				listData[i].leadTime = parseInt(listData[i].leadTime);
			}
			
			var batchPriceList = {supplierId: $scope.pl.supplier.id, items: listData};
			$scope.$apply();
			purchaseService.savePLItems(batchPriceList).then(function(res){
				$scope.findPriceListBySupplierId(res.data.supplier.id);
				$("#uploadDialog").modal("hide");
				$scope.showToast("Save Items To Price List", "Price List items updated", true);
			}).catch(function(err){
				$("#uploadDialog").modal("hide");
				$scope.showToast("Save Items To Price List", err.data.errorMessage, false);
			}); 
		};
		fileReader.readAsBinaryString($scope.excelFile);
	}
	
	$scope.deletePriceListItem = function(id){
		purchaseService.deletePriceListItem(id).then(function(res){
			$scope.findPriceListBySupplierId($scope.pl.supplier.id);
			$scope.showToast("Delete Price List Item", "Price List item deleted", true);
		}).catch(function(err){
			$scope.showToast("Delete Price List Item", err.data.errorMessage, false);
		});
	}
	$scope.findSkuByKeyword = function(pageNumber){
		if($scope.keyword != undefined && $scope.keyword.length >= 3){
    		if(pageNumber == undefined)
    			pageNumber = 0;
	    	var data = { keyword: $scope.keyword.toUpperCase(), page: pageNumber, resultsPerPage: 10 };
	    	skuService.findSkuByKeyword(data)
	    		.then(function(response){
	    			$scope.searchResults = response.data;
	    			if($scope.searchResults.pages > 1)
	    				$scope.searchResults.pages = 1;
	    		})
    	}else{
    		$scope.searchResults = undefined;
    	}
	}
	
	$scope.findShippers = function(){
		shippingService.findAllShippers().then(function(res){
			$scope.shippers = res.data;
		}).catch(function(err){
			console.log(err);
		})
	}
	
	$scope.findApplicableTaxes = function(id){
		if(id == undefined)
			id = $routeParams.id;
		purchaseService.findApplicableTaxes(id).then(function(res){
			$scope.taxes = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.qtyChanged = function(item){
		item.priceInfo.subtotal = (item.quantity * item.unitPrice).toFixed(2);
		//console.log("item subtotal changed: " + item.priceInfo.subtotal);	
		$scope.invoice.subtotal = 0.00;
		$scope.invoice.items.forEach((iItem) => {
			$scope.invoice.subtotal += iItem.priceInfo.subtotal;
		});
	}
	
	$scope.findItemsForPOInvoice = function(id){
		if(id == undefined)
			id = $routeParams.id;
		purchaseService.findItemsForPOInvoice(id).then(function(res){
			/* Create Invoice Item */
			$scope.invoice = res.data;
			$scope.invoice.invoiceDate == undefined ? $scope.invoice.invoiceDate = new Date() : $scope.invoice.invoiceDate = new Date($scope.invoice.invoiceDate);
			$scope.invoice.dueDate == undefined ? $scope.invoice.dueDate = new Date() : $scope.invoice.dueDate = new Date($scope.invoice.dueDate);
			$("#invoiceDialog").modal("show");			
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.repriceInvoice = function(){
		//console.log(JSON.stringify($scope.invoice));
		purchaseService.repriceInvoice($scope.invoice).then(function(res){
			$scope.invoice = res.data;
			$scope.invoice.invoiceDate == undefined ? $scope.invoice.invoiceDate = new Date() : $scope.invoice.invoiceDate = new Date($scope.invoice.invoiceDate);
			$scope.invoice.dueDate == undefined ? $scope.invoice.dueDate = new Date() : $scope.invoice.dueDate = new Date($scope.invoice.dueDate);
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.findPOInvoice = function(id){
		//console.log("findpo invoice");
		purchaseService.findPOInvoice(id).then(function(res){
			$scope.invoice = res.data;
			$scope.invoice.invoiceDate = new Date($scope.invoice.invoiceDate);
			$scope.invoice.dueDate = new Date($scope.invoice.dueDate);
		}).catch(function(err){
			$scope.showToast("Find Invoice", err.data.errorMessage, false);
		});
	}
	
	$scope.addInvoice = function(){
		$("#invoiceDialog").modal("hide");
		$("#processingDialog").modal("show");
		purchaseService.addInvoice($scope.invoice).then(function(res){
			$scope.findById();
			$("#processingDialog").modal("hide");
			$scope.showToast("Add Invoice", "Invoice Added.", true);
		}).catch(function(err){
			console.log(err);
			$("#processingDialog").modal("hide");
			$scope.showToast("Add Invoice", err.data.errorMessage, false);
		});
	}
	
	$scope.setDataForReorder = function(id){
		if(id == undefined)
			id = $routeParams.id;
		purchaseService.findById(id).then(function(res){
			$scope.po.purchaseOrderId = res.data.id;
			$scope.po.supplier = res.data.supplier;
			$scope.po.warehouseId = res.data.warehouse.id;
			$scope.po.specialInstructions = res.data.specialInstructions;
			//$scope.po.automationLevel = "PARTIAL";
		});
	}
	
	$scope.reorderPurchaseOrder = function(){
		var data = $scope.po;
		//console.log("recurring: " + data.recurring);
		if(data.recurring){
			purchaseService.reorderPO(data).then(function(res){
				$scope.showToast("Purchase Order Reorder", "Scheduled reorder added.", true);
				$scope.po = res.data;
			}).catch(function(err){
				$scope.showToast("Purchase Order Reorder", err.data.errorMessage, false);
			});
		}else{
			purchaseService.reorderPO(data).then(function(res){
				$scope.viewPurchaseOrder(res.data.id);
			}).catch(function(err){
				$scope.showToast("Reorder Purchase Order", err.data.errorMessage, false);
			});
		}
	}
	
	$scope.findPurchaseOrdersByState = function(pageNumber){
		state = $routeParams.state;
		var keyword = $scope.keyword;
		if($scope.keyword == undefined || $scope.keyword.length == 0)
			keyword = "*";
		if(pageNumber == undefined)
    		pageNumber = 0;
    	var filters = [state];
		$scope.poState = state;
		var data = { keyword: keyword, filters: filters, page: pageNumber, resultsPerPage: 30 };
		purchaseService.findPurchaseOrdersByState(data).then(function(res){
			$scope.searchResults = res.data;
			if($scope.searchResults.pages > 20)
				$scope.searchResults.pages = 20;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.calculateDueDate = function(){ 
		var dueDate = new Date($scope.invoice.invoiceDate);

		if($scope.invoice.priceInfo.paymentTerm == 'NET15')
			dueDate.setDate(dueDate.getDate() + 15);
		else if($scope.invoice.priceInfo.paymentTerm == 'NET60')
			dueDate.setDate(dueDate.getDate() + 60);
		else
			dueDate.setDate(dueDate.getDate() + 30)
		
		$scope.invoice.dueDate = dueDate;
	}
	
	/* Email */
	$scope.email = {};
	$scope.quill = null;
	$scope.prepEmail = function(type){
		$scope.quill = new Quill('#emailContent', {theme: 'snow'});
		
		$scope.email.type = type;
		if(type == 'EMAILPO')
			$scope.email.subject = "Purchase Order #: " + $scope.order.id;
		else if(type == 'EMAILRFQ')
			$scope.email.subject = "Purchase Order RFQ #: " + $scope.order.id;
		$scope.email.cc = [$scope.currentUser.email];
	}
	
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
		data.id = $scope.order.id;
		data.content = $scope.quill.root.innerHTML;
		
		emailService.sendPurchaseOrderEmail(data).then(function(res){
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
	
	$scope.downloadPOPDF = function(id){		
		purchaseService.downloadPOPDF(id).then(function(res){
	        var linkElement = document.createElement('a');
	        try {
	            var blob = new Blob([res.data], { type: "application/pdf" });
	            var url = window.URL.createObjectURL(blob); 
	            linkElement.setAttribute('href', url);
	            linkElement.setAttribute("download", "Purchase-Order#" + id + ".pdf"); 
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
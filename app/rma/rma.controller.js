captureControlApp.controller("rmaController", function($scope, $routeParams, $location, rmaService){
	$scope.viewRMA = function(id){
		$location.path("/rma/" + id);
	}	
	
	$scope.findById = function(id){
		if(id == undefined)
			id = $routeParams.id;
		rmaService.findById(id).then(function(res){
			$scope.rma = res.data;
			$scope.parseRMA();
		}).catch(function(err){
			console.log(err);
			$scope.errorMessage = err;
		});
	}
	
	$scope.parseRMA = function(){
		$scope.rma.creationDate = new Date($scope.rma.creationDate);      
		$scope.rma.lastModifiedDate = new Date($scope.rma.lastModifiedDate);		
		$scope.rma.expectedReturnDate = ($scope.rma.expectedReturnDate == null) ? null : new Date($scope.rma.expectedReturnDate);
		$scope.rma.issueDate = ($scope.rma.issueDate == null) ? null : new Date($scope.rma.issueDate);
		
		/* Build Item Array. Create taxes and lot/serial values */
		$scope.itemArray = [];
		$scope.rma.items.forEach(item => {
			var taxes = 0.00;
			item.priceInfo.taxes.forEach((tax) => {
					taxes += tax.amount;
			});
			/* Find out max quantity for given item based on order item shipped and lot counts */
			
			
			$scope.itemArray.push({ id: item.id, lineNumber: item.lineNumber, orderItem: $scope.findOrderItemById(item.orderItemId),
			quantityReturned: item.quantityReturned, taxes: taxes, lotSerial: item.inventory.lotSerial, inventoryId: item.inventory.id,
			reasonId: item.reasonId, productName: item.inventory.productName, productDescription: item.inventory.productDescription, maxQuantity: item.maxQuantity});
		});
	}
	
	$scope.findOrderItemById = function(id){
		for(var i=0; i<$scope.rma.order.items.length; i++){
			if($scope.rma.order.items[i].id == id)
				return $scope.rma.order.items[i];
		}
	}
	
	$scope.toggleSelect = function(item){
		if(item.selected)
			item.selected = false;
		else
			item.selected = true;
	}
	
	$scope.findAllReasons = function(){
		console.log("reasons");
		rmaService.findAllReasons().then(function(res){
			$scope.reasonCodes = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveRMA = function(){
		var data = $scope.rma;
		rmaService.save(data).then(function(res){	
			$scope.viewRMA(res.data.id);
		}).catch(function(err){
			console.log(err);
		}); 
	}
	
	$scope.saveItemsToRMA = function(){
		var data = {rmaId: $scope.rma.id, items:[]};
		$scope.itemArray.forEach((item) => {
			data.items.push({id: item.id, inventoryId: item.inventoryId, orderItemId: item.orderItem.id, quantityReturned: item.quantityReturned,
			lineNumber: item.lineNumber, reasonId: item.reasonId});
		});
		console.log(JSON.stringify(data));
		rmaService.saveItemsToRMA(data).then(function(res){
			$scope.rma = res.data;
			$scope.parseRMA();
		});
	}

	$scope.createRMA = function(){
		/* Construct RMA Object */
		var data = { id: $scope.rma.id, order: { id: $scope.rma.order.id }, expectedReturnDate: $scope.rma.expectedReturnDate};
		/* Contruct the list of items */
		var i=1;
		var items = [];
		/* sort results by linenumber then renumber in the submission */
		$scope.rma.items = $scope.rma.items.sort((a, b) => {
			if(a.lineNumber < b.lineNumber){
				return -1
			}
		});
		$scope.rma.items.forEach((item) => {
			if(item.selected){
				items.push({id: null, inventoryId: item.inventory.id, orderItemId: item.orderItemId, quantityReturned: item.quantityReturned,
				lineNumber: i, reasonId: item.reasonId});
				i++;
			}			
		});
		
		console.log(JSON.stringify(items));
		
		/* First create the rma then add the items  */
		rmaService.save(data).then(function(res){	
			var data = {rmaId: res.data.id, items: items};
			rmaService.saveItemsToRMA(data).then(function(res){
				$("#returnDialog").modal("hide");
					$scope.viewRMA(res.data.id);
				}).catch(function(err){
					console.log(err);
				});
		});
	}
	
	$scope.getUnaddedRMAItems = function(id){
		rmaService.generateRMAItems(id).then(function(res){
			$scope.unaddedRMA = res.data;
		});
	}
	
	$scope.changeQty = function(item, qty){
		console.log("Value: " + (item.quantityReturned + parseInt(qty)));
		/* Check max quantity. If over the max then toast error. Check that
		item is not zero. If it is then toast error */
		item.quantityReturned += qty;
	}
});
captureControlApp.controller("configController", function($scope, $window, $location, configService){
	
	$scope.findCurrencyById = function(id){
		if(id == undefined)
			$scope.currency = {};
		else{
			configService.findCurrencyById(id).then(function(res){
			$scope.currency = res.data;
		}).catch(function(err){
			console.log(err);
		});
		}	
	}
	
	$scope.findAllPaymentConfigData = function(){
		configService.findPaymentConfigData().then(function(res){
			$scope.paymentConfigData = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveCurrency = function(){
		var data = $scope.currency;
		configService.saveCurrency(data).then(function(res){
			$scope.findAllPaymentConfigData();
			$scope.cForm.$setUntouched();
			$scope.showToast("Save Currency", "Currency Saved.", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Currency", err.data.errorMessage, false);
		});
	}

	$scope.deleteCurrencyById = function(id){
		configService.deleteCurrencyById(id).then(function(res){
			$scope.findAllPaymentConfigData();
			$scope.showToast("Delete Currency", "Currency Deleted.", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Delete Currency", err.data.errorMessage, false);
		});
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
	
	$scope.qbInfo = {};
	$scope.integrationInit = function(){
		configService.findGlobalConfig().then(function(res){
			$scope.globalConfig = res.data;
			if($scope.globalConfig.qboEnabled){
				configService.getIntuitData().then(function(res){
					$scope.qbInfo = res.data;
				});
			}
		}).catch(function(err){
			console.log(err);
		});
	} 
	
	$scope.setGLAccount = function(name, value){
		/* call set account service passing in type and value */
		var data = { name: name, value: value };
		configService.setGLAccount(data).then(function(res){
			configService.getIntuitData().then(function(res){
				$scope.qbInfo = res.data;
				$scope.showToast("Set Account", "Account Set.", true);
			});
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Set Account", err.data.errorMessage, false);
		});
	}
	
	$scope.setProductType = function(name, value){
		/* call set account service passing in type and value */
		var data = { name: name, value: value };
		configService.setProductType(data).then(function(res){
			configService.getIntuitData().then(function(res){
				$scope.qbInfo = res.data;
				$scope.showToast("Set Product Type", "Product Type Set.", true);
			});
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Set Product Type", err.data.errorMessage, false);
		});
	}
	
	$scope.saveProductLabelPrinterInfo = function(){
		var data = {url: $scope.globalConfig.productLabelPrinterURL, type: $scope.globalConfig.productLabelPrinterType, 
		labelTemplate: $scope.globalConfig.productLabelTemplate};
		configService.saveProductLabelPrinterInfo(data).then(function(res){
			$scope.globalConfig = res.data;
			if($scope.globalConfig.address == undefined)
				$scope.globalConfig.address = {};
			$scope.showToast("Save Product Label Info", "Product Label info updated.", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Product Label Info", err.data.errorMessage, false);
		});
	}
	
	$scope.saveCompanyInfo = function(){
		var data = {companyName: $scope.globalConfig.companyName, companyWebsite: $scope.globalConfig.companyWebsite, address: $scope.globalConfig.address};
		configService.saveCompanyInfo(data).then(function(res){
			$scope.globalConfig = res.data;
			$scope.showToast("Save Company Info", "Company Info Saved", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Save Company Info", err.data.errorMessage, false);
		});
	}
	
	$scope.setShippingPrinter = function(item){
		console.log(item);	
	}
	
	$scope.setParameter = function(name, value){
		var data = { name: name, value: value };
		configService.setParameter(data).then(function(res){
			$scope.globalConfig = res.data;
			$scope.showToast("Set Configuration Value: " + name, "Config Value Set", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Set Configuration Value", err.data.errorMessage, false);
		});
	}
	
	$scope.countries = countries;
	$scope.setCountry = function(code){ 
		$scope.globalConfig.address.country = code;
		for(var i=0; i<$scope.countries.length; i++){
			if($scope.countries[i].isoCode == code){
				$scope.cCountry = $scope.countries[i];
				break;
			}				
		}	
	}
	
	$scope.setProvince = function(code){ $scope.globalConfig.address.province = code; }
	
	$scope.findAllPrinters = function(){
		configService.findAllPrinters().then(function(res){
			$scope.printers = res.data;
		}).catch(function(err){
			console.log(err);
		})
	}
	
	$scope.launchIntuitSignIn = function() {
		var path = $location.protocol() + "://" + $location.host() + "/capture/integration/intuit/signInWithIntuit"
		var win;
		var parameters = "location=1,width=800,height=650";
		parameters += ",left=" + (screen.width - 800) / 2 + ",top=" + (screen.height - 650) / 2;

		win = $window.open(path, 'connectPopup', parameters);		    
		var winClosed = setInterval(function () {
			if(win.closed) {
				//console.log("win closed");
				clearInterval(winClosed);
				$scope.integrationInit(); 
			}
		}, 250);
	}
	
	$scope.removeIntuitAccount = function(){
		configService.removeIntuitAccount().then(function(res){
			$scope.findGlobalConfig();
			$scope.showToast("Remove Intuit Account", "Intuit Account Removed.", true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Remove Intuit Account", err.data.errorMessage, false);
		});
	}
	
	/* Admin Functions */
	$scope.logOutput = undefined;
	$scope.getLog = function(){
		configService.getLog()
			.then(function(res){
				$scope.logOutput = res.data;
			});
	}
	
	$scope.getLoggingLevel = function(){
		configService.getLoggingLevel().then(function(res){
			$scope.logging = res.data;
			if($scope.logging.configuredLevel == undefined)
				$scope.logging.configuredLevel = $scope.logging.effectiveLevel;
		}).catch(function(err){
			console.log(err);
		});
	}

	$scope.setLoggingLevel = function(){
		var data = {configuredLevel: $scope.logging.configuredLevel};
		configService.setLoggingLevel(data).then(function(res){
			$scope.showToast("Set Logging Level", "Logging Level Set to " + $scope.logging.configuredLevel, true);
		}).catch(function(err){
			console.log(err);
			$scope.showToast("Set Logging Level", err.data.errorMessage, false);
		});
	}
	
	$scope.alert = {show:false, message:undefined};
	$scope.af = {};
	$scope.saveAdminPassword = function(){
		$scope.alert.show = false;
		var data = {password:$scope.af.password};
		configService.resetAdminPassword(data)
			.then(function(res){
				$scope.alert.message = "Password updated. You will need to use this password next time you login.";
				$scope.alert.show = true;
			}).catch(function(err){
				console.log(err);
			});
	}
	
	/* Taxes */
	$scope.getAllTaxes = function(){
		configService.getAllTaxes().then(function(res){
			$scope.taxes = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.getAllIntuitTaxes = function(){
		configService.getAllIntuitTaxes().then(function(res){
			$scope.qbTaxes = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.getTaxById = function(id){
		configService.getTaxById(id).then(function(res){
			$scope.tax = res.data;
		}).catch(function(err){
			console.log(err);
		});
	}
	
	$scope.saveTax = function(){
		var data = $scope.tax;
		configService.saveTax(data).then(function(res){
			$scope.tax = res.data;
			$scope.getAllTaxes();
			$("#taxModal").modal("hide");			
			$scope.showToast("Save Tax", "Tax has been saved", true);
		}).catch(function(err){
			console.log(err);
			$("#taxModal").modal("hide");
			$scope.showToast("Save Tax", err.data.errorMessage, false);
		});
	}
	
	$scope.setTaxValue = function(type, value){
		if(type == 'taxType')
			$scope.tax.taxType = value;
		else if(type == 'appliesTo')
			$scope.tax.appliesTo = value;
		else if(type == 'qbo')
			$scope.tax.qbTax = value;
	}
	
	$scope.showToast = function(activity, message, success){
		$scope.toastActivity = activity;
		$scope.toastMessage = message;
		$scope.toastStatus = success;
		$scope.toastTime = new Date();
		$("#toastMessage").toast("show");
	}
});
captureControlApp.filter('supercurrency', function(){
	return function(input, symbol){
		
		if(isNaN(input)){
			return input;
		}else{
			var symbol = symbol || '$';
			var cArray = input.toFixed(2).toString().split(".");
			if(cArray.length == 1){
				input = cArray[0] + '<sup>.00</sup>';
			}else{
				input = cArray[0] + '<sup>.' + cArray[1] + '</sup>';
			}
			//take the number created and add the thousand separator
			// make sure symbol is not in the string below. synbol position based on location
			 input = input.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			 return symbol + " " + input;
		}	
	}
});

captureControlApp.filter('tel', function () {
    return function (tel) {
        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;

            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;

            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;

            default:
                return tel;
        }

        if (country == 1) {
            country = "";
        }

        number = number.slice(0, 3) + '-' + number.slice(3);

        return (country + " (" + city + ") " + number).trim();
    };
});

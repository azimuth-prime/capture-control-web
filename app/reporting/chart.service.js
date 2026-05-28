captureControlApp.service('chartService', function() {
	this.createBarChart = function(pLabels, pData, pAxis, pLegend){
		var data = {labels: pLabels, 
			datasets: [{axis: pAxis, label: '', data: pData, fill: false,
			backgroundColor: ['rgba(0, 76, 153, 1)','rgba(204, 229, 255, 1)'],
			borderColor: ['rgba(0, 76, 153)','rgb(204, 229, 255)'],
			borderWidth: 1 }]
		}
		
		var config = {
				type: 'bar', data,
				options: {
					indexAxis: pAxis,
					plugins: { legend: {display: pLegend}},
					scales: { x: { grid: { display: pLegend} }, y: { grid: { display: pLegend } } }
				}
		};
	
		return config;
	}
	
	this.createLineChart = function(pLabels, pData, pLegend){
		var data = {
			labels: pLabels,
			datasets: [{ label: '', data: pData, fill: false, borderColor: 'rgb(75, 192, 192)', tension: 0.1 }]
		};
		
		var config = {
			type: 'line', data,
			options: {
				plugins: {
					legend: {
						display: pLegend
					}
				}
			}
		};
		return config;
	}
	
	this.createPieChart = function(pLabels, pData, pLegend){
		
		var data = {
				labels: pLabels,
				datasets: [{label: '', data: pData, 
				backgroundColor: [
		      		'rgb(255, 99, 132)',
		      		'rgb(54, 162, 235)',
		      		'rgb(255, 205, 86)'
		    	],
		    	hoverOffset: 4
  			}]
		};
		
		var config = { type: 'pie', data: data,
			options: {
				plugins: {
					legend: {
						display: pLegend
					}
				}
			}
		};
		return config;
	}
	
	this.createDoughnutChart = function(labels, data, legend){
		console.log("doughnut");
		var data = {
			labels: labels,
			datasets: data
		};
		
		var config = {
			type: 'doughnut', data: data,
			options: {
				responsive: false,
				plugins: {
					legend: { display: legend, position: 'left', align: 'center' },
					title: { display: false, text: 'Chart.js Doughnut Chart' }
				}
			},
		};
		return config;
	}
	
	this.createTableChart = function(data, options, name){
		google.charts.load('current', {'packages':['table']});
		google.charts.setOnLoadCallback(drawChart);

		function drawChart() {
			var data = new google.visualization.DataTable();
			data.addColumn('string', 'Product Id');
			data.addColumn('string', 'Name');
			data.addColumn('number', 'Revenue');
			data.addRows([
				['PRD10000017', '12V6A Power Adapter',  {v: 10000, f: '$10,000'}],
				['PRD10000019', 'F750-E4 Enclosure',  {v:8000,   f: '$8,000'}],
				['PRD10000020', 'F750-E4 PCB', {v: 12500, f: '$12,500'}],
				['PRD10000026', 'SingleSku Test 2',  {v: 7000,  f: '$7,000'}]
			]);

        	var chart = new google.visualization.Table(document.getElementById(name));

        	chart.draw(data, {fontFamily: 'Open Sans Condensed', showRowNumber: true, width: '100%', height: '100%'});
      }
	}
});
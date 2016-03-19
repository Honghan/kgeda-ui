/**K-Drive project: query generation demo: UI //KT Group@UNIABDN*/
(function($) {
	if(typeof KTEDA == "undefined") {
		
		KTEDA = {
			ENTITY_ID_REGEXP: /(\d+) \| /i,
			ENTITY_LABEL_REGEXP: /^(\d+) \| (.*)$/i,
			googleChartLoaded: false,
			edaRelResultToDataTable: function(relData, columnNames){
				var data = new google.visualization.DataTable();

				// Declare columns
				data.addColumn('string', columnNames[0]);
				data.addColumn('number', columnNames[1]);

				// Add data.
				var rows = [];
				for(var k in relData)
				{
					rows.push([k=="" ? "n/a":k, relData[k]]);
				}
				data.addRows(rows);
				return data;
			},

			/**
			* marge a group of eda results on the same analysis and
			* convert it to google data table representation
			*/
			groupsOfEDAResult2GoogleDataTable: function(results, title, columnNames){
				var data = new google.visualization.DataTable();

				// Declare columns
				data.addColumn('string', title);
				for (var i=0;i<columnNames.length;i++)
					data.addColumn('number', columnNames[i]);
				
				//create an array of all keys
				var keySet = new Set();
				for(var i=0;i<results.length;i++){
					for(var k in results[i])
						keySet.add(k);
				}
				// Add data.
				var rows = [];
				keySet.forEach(function(k){
					var row = [k == "" ? "N/A" : k];
					for(var i=0;i<results.length;i++){
						if (results[i][k]){
							row.push(results[i][k]);
						}else{
							row.push(0);
						}
					}
					rows.push(row);
				});
				data.addRows(rows);
				return data;
			},

			renderRelResult: function(containerId, rel, data, columnNames, chartType, hAxisVal){				
				var options = {
		          title: rel,
		          hAxis: {title: !hAxisVal?"Values/Categories":hAxisVal,  titleTextStyle: {color: 'green'}, textPosition: "in"},
		          vAxis: {title: "#Entities",  titleTextStyle: {color: 'green'}},
		          legend: {position: 'bottom'}
		        };

		        var dataTable = KTEDA.groupsOfEDAResult2GoogleDataTable(data, rel, columnNames);
		        if (!chartType && dataTable.getColumnLabel(0).toLowerCase() == "country")
		        	chartType = "geoMap";
		        
		        KTEDA.renderChart(document.getElementById(containerId), dataTable, options, chartType);
			},

			renderChart: function(chartContainer, dataTable, options, chartType){

				var chart = new google.visualization.ColumnChart(chartContainer);
				//if (dataTable.getColumnLabel(0).toLowerCase() == "country")
				if (chartType)
				{
					if(chartType == "geoMap")
					{
						chart = new google.visualization.GeoChart(chartContainer);
						options.region = '150';
					}else if (chartType == "pie"){
						chart = new google.visualization.PieChart(chartContainer);
					}
				}
				
        		chart.draw(dataTable, options);
			},

			drawEDAChart: function(results, chartDiv){
				//group results by label: it might be a good idea to 
				//allow various properties to be grouped together using
				//the same label. Semantically, similar labels might be 
				//close to each othter. therefore, it might make good sense
				//to integrate them
				var grouped = {};
				for(var i=0;i<results.length;i++){
					results[i].results.forEach(function(r){
						var analysisLabel = r.label + "_" + r.analysisType;
						var grp = grouped[analysisLabel];
						if (!grp){
							grp = {label: r.label, analysisType: r.analysisType, data: [r.data], columns:[results[i].description], 
								meta: $.trim(r.meta) == "" ? null : $.parseJSON(r.meta)};
							grouped[analysisLabel] = grp;
						}else{
							grp.data.push(r.data);
							grp.columns.push(results[i].description);
						}
					});
				}

				for(var k in grouped){
					var chartType = null;
					if (grouped[k].meta && grouped[k].meta.disjoint){
						if (grouped[k].columns.length < 2)
							chartType = 'pie';
					}
					else if (grouped[k].meta && grouped[k].meta.parsingErro)
						continue; //the analysis encountered some errors, so ignore the result

					$('#' + chartDiv).append('<div id="' + k + '"/>');
					KTEDA.renderRelResult(k, grouped[k].label, grouped[k].data, 
						grouped[k].columns, 
						chartType, 
						KTEDA.formatAnalysisTypeText(grouped[k].analysisType)
						);
				}
		      },

		      formatAnalysisTypeText: function(type){
		      	if (type == "LINKEDTYPE"){
		      		return "Related Entity Types";
		      	}else if (type == "ORDINARY"){
		      		return "Value Ranges";
		      	}else if (type == "CATEGORICAL"){
		      		return "Values";
		      	}
		      },

		      /**
		      * render the instance data into a google table
		      * 
		      */
		      renderDataTable: function(dataTable, tableDiv, firstCol, refCB, selectCB){
		      	var data = new google.visualization.DataTable();
		      	var colKeyArr = [];
		      	data.addColumn('string', firstCol);
		      	for(var key in dataTable.columns){
		      		colKeyArr.push(key);
			      	data.addColumn('string', dataTable.columns[key]);
		      	}
		      	var tableRows = [];
		      	for(var i=0;i<dataTable.rows.length;i++){
		      		var row = dataTable.rows[i];
		      		var tableRow = [KTEDA.formatEntityLink(row.entityId, row.entityLabel)];
		      		for(var j=0;j<colKeyArr.length;j++){
		      			var val = "";
		      			var key = colKeyArr[j];
		      			if (row.attributeData[key]){
		      				val = KTEDA.renderMultivaluedAttributes(row.attributeData[key]);
		      			}else if (row.relationalData[key]){
		      				val = KTEDA.renderMultivaluedAttributes(row.relationalData[key], KTEDA.ENTITY_LABEL_REGEXP);
		      			}
		      			tableRow.push(val);
		      		}
		      		tableRows.push(tableRow);
		      	}
		      	data.addRows(tableRows);
		        
		        var table = new google.visualization.Table(tableDiv);
        		table.draw(data, {allowHtml: true, showRowNumber: false, width: '100%', height: '300px'});
        		if (selectCB)
        			google.visualization.events.addListener(table, 'select', selectCB);
        		refCB(table);
		      },

		      renderQueryDataTable: function(queries, tableDiv, refCB, selectCB){
		      	var data = new google.visualization.DataTable();
		      	data.addColumn('string', 'Query ID');
		      	data.addColumn('string', 'Label');
		      	var tableRows = [];
		      	for(var i=0;i<queries.length;i++){
		      		tableRows.push([queries[i].queryId, queries[i].label]);
		      	}
		      	data.addRows(tableRows);
		        
		        var table = new google.visualization.Table(tableDiv);
        		table.draw(data, {allowHtml: true, showRowNumber: false, width: '100%', height: '300px'});
        		if (selectCB)
        			google.visualization.events.addListener(table, 'select', selectCB);
        		refCB(table);
		      },

		      /**
		      * format an array of property value into a string
		      * concat the elements using '|'
		      */
		      renderMultivaluedAttributes: function(vals, regobj){
		      	var ret = "";
		      	if (vals.length == 1){
		      		var v = vals[0];
		      		if (regobj && (regobj instanceof RegExp) ){
		      				v = KTEDA.parseEntityVal2Link(v, regobj);
		      		}
		      		ret = v;
		      	}
		      	else{
		      		for (var i=0;i<vals.length;i++){
		      			var v = vals[i];
		      			if (regobj && (regobj instanceof RegExp) ){
		      				v = KTEDA.parseEntityVal2Link(v, regobj);
		      			}
		      			ret += v.replace(/\|/ig, "\\|") + " | ";
		      		}
		      		ret = ret.substring(0, ret.length - 3);
		      	}
		      	return ret;
		      },

		      /**
		      * parse entity valued string like '144 | curios'
		      * 144 is the entity id and 'curios' is the entity label
		      * parsed result is a html string for displaying in the
		      * table 
		      */
		      parseEntityVal2Link: function(v, regobj){
		      	var ret = v;
		      	if (regobj && (regobj instanceof RegExp) ){
	      				var regr = regobj.exec(v);
	      				if (regr && regr.length > 2) 
	      					ret = KTEDA.formatEntityLink(regr[1], regr[2]);
	      		}
	      		return ret;
		      },

		      formatEntityLink: function(eid, label){
		      	return "<span class='clsLinkedEntity' eid='" + eid + "'>" + label + "</span>";
		      }
		}
	}
})(jQuery);
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
					rows.push([k, relData[k]]);
				}
				data.addRows(rows);
				return data;
			},

			renderRelResult: function(containerId, rel, data, columnNames, chartType){				
				var options = {
		          title: rel,
		          hAxis: {title: columnNames[0],  titleTextStyle: {color: 'green'}, textPosition: "in"},
		          vAxis: {title: "#" + columnNames[1],  titleTextStyle: {color: 'green'}},
		          legend: {position: 'bottom'}
		        };

		        var dataTable = KTEDA.edaRelResultToDataTable(data, columnNames);
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

			drawEDAChart: function(eda, chartDiv){          
		        //for(var i=0;i<edaResult.length;i++)
		        var edaResult = [];
		        edaResult.push(eda);
		        var i =0;
		        {
		        	$('#' + chartDiv).html("<h1>More Charateristics</h1>");
		          var cid = "edac_title_" + i;
		          $('#' + chartDiv).append('<div id="' + cid + '"/>');
		          //$('#'+cid).html('<h1>' + edaResult[i].nodeLabel + '</h1>');

		          chartType = null;
		          var counter = 0;
		          if (Object.keys(edaResult[i].relNodeTypeAR).length > 0)
		          {
		          	$('#' + chartDiv).append('<h2>By relational facets</h2>');
		          }
		          for(var rel in edaResult[i].relNodeTypeAR)
		          {
		            cid = "edac_" + "ntype_" + i + "_" + counter++;
		            $('#' + chartDiv).append('<div id="' + cid + '"/>');
		            if (edaResult[i].disjointTypes)
		            {
		            	for (var j=0;j< edaResult[i].disjointTypes.length;j++)
			            {
			            	if (edaResult[i].disjointTypes[j] == rel)
			            	{
			            		chartType = "pie";
			            		break;
			            	}
			            }
		            }		            
		            KTEDA.renderRelResult(cid, rel, edaResult[i].relNodeTypeAR[rel], ["Types", edaResult[i].nodeLabel], chartType);
		          }

		          chartType = null;
		          counter = 0;
		          if (Object.keys(edaResult[i].relObjectAR).length > 0)
		          {
		          	$('#' + chartDiv).append('<h2>By categorical objects</h2>');
		          }
		          for(var rel in edaResult[i].relObjectAR)
		          {
		            cid = "edac_" + "obj_" + i  + "_" + counter++ ;
		            $('#' + chartDiv).append('<div id="' + cid + '"/>');
		            var arr = rel.split("->");
		            KTEDA.renderRelResult(cid, arr[0], edaResult[i].relObjectAR[rel], [arr[1], edaResult[i].nodeLabel], chartType);
		          }

		          chartType = null;
		          counter = 0;
		          if (Object.keys(edaResult[i].attrOrdinary).length > 0)
		          {
		          	$('#' + chartDiv).append('<h2>By ordinary attributes</h2>');
		          }
		          for(var rel in edaResult[i].attrOrdinary)
		          {
		            cid = "edac_" + "attr_" + i  + "_" + counter++ ;
		            $('#' + chartDiv).append('<div id="' + cid + '"/>');
		            KTEDA.renderRelResult(cid, rel, edaResult[i].attrOrdinary[rel], [rel, edaResult[i].nodeLabel], chartType);
		          }

		          //display the distribution of the number of values of a relation
		          //e.g., how many clubs a footballer has played for, how many PhD students a professor supervises
		          chartType = null;
		          counter = 0;
		          if (edaResult[i].relObjNum && Object.keys(edaResult[i].relObjNum).length > 0)
		          {
		          	$('#' + chartDiv).append('<h2>By number of related objects</h2>');
		          }
		          for(var rel in edaResult[i].relObjNum)
		          {
		          	if (Object.keys(edaResult[i].relObjNum[rel]).length <= 1) continue;
		            cid = "edac_" + "objnum_" + i  + "_" + counter++ ;
		            $('#' + chartDiv).append('<div id="' + cid + '"/>');
		            KTEDA.renderRelResult(cid, "#" + edaResult[i].nodeLabel + " vs. #" + rel, edaResult[i].relObjNum[rel], ["#"+rel, edaResult[i].nodeLabel], chartType);
		          }
		        }
		      },

		      /**
		      * render the instance data into a google table
		      * 
		      */
		      renderDataTable: function(dataTable, tableDiv){
		      	var data = new google.visualization.DataTable();
		      	var colKeyArr = [];
		      	data.addColumn('string', 'Entity');
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
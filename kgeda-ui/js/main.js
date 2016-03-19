(function($){

  var that = {
    "resize":function(){
        var canvW = $('#panel').width();// - 300;
        var canvH = $('#panel').height() - 5;
        $('#viewport').css("width", canvW);
        $('#viewport').css("height", canvH);
        //particleSystem.screenSize(canvW, canvH);
        $('#editor').height( $('#panel').height() - 5);
        $('#code').width($('#editor').width() - 5);
    }
  };
  
  // Load the Visualization API and the piechart package.
  google.load('visualization', '1.0', {'packages':['corechart', 'table']});

  // Set a callback to run when the Google Visualization API is loaded.
  google.setOnLoadCallback(function(){
  //alert('loaded');
  });

  $(document).ready(function(){
    $(window).resize(that.resize);
    that.resize();

    var options = {};
    var physcsSetting = {
      barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.10,
          springLength: 68 ,
          springConstant: 0.01,
          damping: 0.13
      }
    };
    options.interaction = {
        multiselect: false,
        selectable: true,
      };
    options.physics = physcsSetting;
    options.nodes = {
      color: {
        background: '#97C2FC',
        border: '#2B7CE9',
        highlight: {
          background: '#D2E5FF',
          border: 'red'
        }
      }};
    options.edges = {
      arrows:{
        to: true
      }

    }; 

    var network = new vis.Network($('#viewport').get(0),{},options);

    network.on('select', function (properties) {
      KTQGUI.selectNodes(properties.nodes);
    });

		//KTQGUI.initial( network, dsResults, options );
    var ds = {
      ds:"Sports", 
      dsuri: "/Users/jackey.wu/Documents/datasets/SportsDataset.rdf"
      };
    var datasetUri = "/Users/jackey.wu/Documents/datasets/SportsDataset.rdf";
    qbb.inf.getDatasetSummary(datasetUri, function(d){
      if (d){
        var summary = $.parseJSON(d);
        ds.edp = summary;
        var datasets = [ds];
        KTQGUI.initial( network, datasets, options );  
      }      
    });
		
		
		$('.tipSel').click(function(){
			$('#intro').show();
		});
		$('#intro h1 a').click(function(){
			$('#intro').hide();
		}); 
		
		$('.genQuery').click(function(){
			alert('TODO: Will generate query based on your interaction.');
		});   
    
    var droppedDown = false;
    $('.examples').click(function(){
    	if (droppedDown)
    	{
    		$(this).removeClass('selected');
	    	$('.query').slideUp();
	    	droppedDown = false;
    	}else
    	{
    		$(this).addClass('selected');
	    	$('.query').slideDown();
	    	droppedDown = true;
    	}
    });
    
    $('.new').click(function(){
    	KTQGUI.clear();
    });

    //event for ds list
    $('#dsList').change(function(){
      var idx = $(this).val();
      if (idx > -1)
      {
        $('#dsConcepts option').each(function(){
          $(this).remove();
        });
        
        $('#dsConcepts').html(KTQGUI.createConceptListOfDs(idx));
      }
    });

    $('#btnLink').click(function(){
      KTQGUI.mergeFromUserDef();
    });
    
    $('#toggleReasoning').click(function(){
    	KTQGUI.selectDS(KTQGUI.dsIndex);
    });
    
    //open the lateral panel
    $('.cd-btn').on('click', function(event){
      event.preventDefault();
      $('.cd-panel').addClass('is-visible');
    });
    //clode the lateral panel
    $('.cd-panel').on('click', function(event){
      if( $(event.target).is('.cd-panel') || $(event.target).is('.cd-panel-close') ) { 
        $('.cd-panel').removeClass('is-visible');
        event.preventDefault();
      }
    });

    $('.new').click(function(){
      KTQGUI.clear();
    });

    $('.modeSwitch').click(function(){
      KTQGUI.toggleMode();
    });

    $('.modeSwitch').html(KTQGUI.uiMode + " Mode");

    $('.queryLink').click(function(){
      KTQGUI.queryEntities();
    });

    $('#querySaveDiv').click(function(){
      KTQGUI.saveQuery();
    });

    $('#nodeQueries').click(function(){
      KTQGUI.displayNodeQueries();
    })
  })

})(this.jQuery)
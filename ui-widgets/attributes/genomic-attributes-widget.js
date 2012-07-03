function GenomicAttributesWidget(species, args){
	var _this=this;
	this.id = "GenomicAttributesWidget" + Math.round(Math.random()*10000);
	
	this.species=species;
	this.args=args;
	
	this.title = "None";
	this.featureType = "gene";
	
	this.columnsCount = null; /** El numero de columns que el attributes widget leera del fichero, si null lo leera entero **/
	if (args != null){
        if (args.title!= null){
        	this.title = args.title;       
        }
        if (args.columnsCount!= null){
        	this.columnsCount = args.columnsCount;       
        }
        if (args.featureType!= null){
        	this.featureType = args.featureType;       
        }
    }
    
	this.listWidget = new ListWidget(this.species,args.listWidgetArgs);
	
	this.attributesPanel = new AttributesPanel({height: 240, columnsCount: this.columnsCount,wum:args.wum,tags:args.tags});
	
	/** Event **/
	this.onMarkerClicked = new Event(this);
	this.onTrackAddAction = new Event(this);
	
	
	/**Atach events i listen**/
	this.attributesPanel.onDataChange.addEventListener(function(sender,data){
		_this.dataChange(data);
	});
	
	
};

GenomicAttributesWidget.prototype.draw = function (){
	var _this=this;
	if (this.panel == null){
		
		this.karyotypePanel  = Ext.create('Ext.panel.Panel', {
			id:this.id+"karyotypePanel",
			height:350,
			maxHeight:350,
			border:0,
//			bodyPadding: 15,
			padding:'0 0 0 0',
			html:'<div id="' + this.id + "karyotypeDiv" +'" ><div>'
		});
		
		this.karyotypePanel.on("afterrender",function(){
			var div = $('#'+_this.id+"karyotypeDiv")[0];
			console.log(div);
			_this.karyotypeWidget = new KaryotypeWidget(div,{
				width:1000,
				height:340,
				species:_this.args.viewer.species,
				chromosome:_this.args.viewer.chromosome,
				position:_this.args.viewer.position
			});
			_this.karyotypeWidget.onClick.addEventListener(function(sender,data){
				_this.args.viewer.onLocationChange.notify({position:data.position,chromosome:data.chromosome,sender:"KaryotypePanel"});
			});
			_this.karyotypeWidget.drawKaryotype();
		});
		
		this.filtersButton = Ext.create('Ext.button.Button', {
			 text: 'Additional Filters',
			 disabled:true,
			 listeners: {
			       scope: this,
			       click: function(){this.onAdditionalInformationClick();}
	        }
		});
		
		this.addTrackButton = Ext.create('Ext.button.Button', {
			text:'Add Track',
			disabled:true,
			handler: function(){ 
				_this.onTrackAddAction.notify({"features":_this.features,"trackName":_this.attributesPanel.fileName});
				}
		});
		
		this.panel  = Ext.create('Ext.ux.Window', {
			title : this.title,
			resizable: false,
			minimizable :true,
			constrain:true,
			closable:true,
			taskbar:Ext.getCmp(this.args.viewer.id+'uxTaskbar'),
			items: [this.attributesPanel.getPanel(),this.karyotypePanel],
			width: 1035,
		    height: 653,
		    buttonAlign:'left',
			buttons:[this.addTrackButton,'->',
			         {text:'Close', handler: function(){_this.panel.close();}}],
	 		listeners: {
		    	scope: this,
		    	minimize:function(){
					this.panel.hide();
		       	},
		      	destroy: function(){
		       		delete this.panel;
		      	}
	    	}
		});
		this.attributesPanel.barField.add(this.filtersButton);
		this.panel.setLoading();
	}	
	this.panel.show();
		
};

GenomicAttributesWidget.prototype.getMainPanel = function (){
	var _this=this;
	if (this.panel == null){
		
		this.karyotypePanel  = Ext.create('Ext.panel.Panel', {
			height:350,
			maxHeight:350,
			border:0,
			bodyPadding: 15,
			padding:'0 0 0 0',
			html:'<div id="' + this.id + "karyotypeDiv" +'" ><div>'
		});

		this.filtersButton = Ext.create('Ext.button.Button', {
			 text: 'Additional Filters',
			 disabled:true,
			 listeners: {
			       scope: this,
			       click: function(){this.onAdditionalInformationClick();}
	        }
		});
		
		this.addTrackButton = Ext.create('Ext.button.Button', {
			text:'Add Track',
			disabled:true,
			handler: function(){ 
				_this.onTrackAddAction.notify({"features":_this.features,"trackName":_this.attributesPanel.fileName});
				}
		});
		
//		this.panel  = Ext.create('Ext.ux.Window', {
//			title : this.title,
//			resizable: false,
//			minimizable :true,
//			constrain:true,
//			closable:true,
//			items: [this.attributesPanel.getPanel(),this.karyotypePanel],
//			width: 1035,
//		    height: 653,
//		    buttonAlign:'left',
//			buttons:[this.addTrackButton,'->',
//			         {text:'Close', handler: function(){_this.panel.close();}}],
//	 		listeners: {
//		    	scope: this,
//		    	minimize:function(){
//					this.panel.hide();
//		       	},
//		      	destroy: function(){
//		       		delete this.panel;
//		      	}
//	    	}
//		});
		this.attributesPanel.getPanel();
		this.attributesPanel.barField.add(this.filtersButton);
//		this.panel.setLoading();
//		this.drawKaryotype();
	}	
	return [this.attributesPanel.getPanel(),this.karyotypePanel];
		
};

GenomicAttributesWidget.prototype.fill = function (queryNames){
	
	var _this = this;
	var cellBaseDataAdapter = new CellBaseDataAdapter(this.species);
	cellBaseDataAdapter.successed.addEventListener(function(sender){
		_this.karyotypePanel.setLoading("Retrieving data");
		for (var i = 0; i < cellBaseDataAdapter.dataset.toJSON().length; i++) {
				_this.karyotypeWidget.mark(cellBaseDataAdapter.dataset.toJSON()[i]);
				
		}
		_this.features=cellBaseDataAdapter.dataset.toJSON();
		_this.query = {"dataset": cellBaseDataAdapter.dataset, "resource":queryNames }; 
		_this.karyotypePanel.setLoading(false);
		_this.filtersButton.enable();
		_this.addTrackButton.enable();
		
	});
	cellBaseDataAdapter.fill("feature", this.featureType, queryNames.toString(), "info");
};

GenomicAttributesWidget.prototype.dataChange = function (items){
		try{
					var _this = this;
					
					this.karyotypePanel.setLoading("Connecting to Database");
					this.karyotypeWidget.unmark();
					var _this=this;
					var externalNames = [];
					
					for (var i = 0; i < items.length; i++) {
						externalNames.push(items[i].data[0]);
					}	
					
					if (items.length > 0){
						this.fill(externalNames);
					}
					else{
						this.karyotypePanel.setLoading(false);
					}
		}
		catch(e){
			alert(e);
			
		}
		finally{
			this.karyotypePanel.setLoading(false);
		}
};

GenomicAttributesWidget.prototype.drawKaryotype = function (){
		/** Karyotype Widget **/
		var _this = this;
		var karyotypeCellBaseDataAdapter = new KaryotypeCellBaseDataAdapter(this.species);
		
		karyotypeCellBaseDataAdapter.successed.addEventListener(function(evt, data){
			_this.karyotypeWidget.onRendered.addEventListener(function(evt, data){
//				_this.panel.setLoading(false);
			});
			
			_this.karyotypeWidget.onClick.addEventListener(function(evt, data){
			});
			
			_this.karyotypeWidget.draw(karyotypeCellBaseDataAdapter.chromosomeNames, karyotypeCellBaseDataAdapter.dataset.json);
			
		});
		karyotypeCellBaseDataAdapter.fill();
};


GenomicAttributesWidget.prototype.onAdditionalInformationClick = function (){
	var _this=this;
	this.listWidget.draw(this.query.dataset.toJSON(), this.query.resource);
	this.listWidget.onFilterResult.addEventListener(function(sender,data){
		_this.attributesPanel.store.clearFilter();
		_this.attributesPanel.store.filter(function(item){
			for(var i = 0; i < data.length; i++){
				if(data[i].data.stableId == item.data["0"]){
					return true;
				}
			}
		});
	});
};

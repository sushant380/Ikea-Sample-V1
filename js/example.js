
/*
 * Camera Buttons
 */

var CameraButtons = function(blueprint3d) {

  var orbitControls = blueprint3d.three.controls;
  var three = blueprint3d.three;

  var panSpeed = 30;
  var directions = {
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
  }

  function init() {
    // Camera controls
    $("#zoom-in").click(zoomIn);
    $("#zoom-out").click(zoomOut);  
    $("#zoom-in").dblclick(preventDefault);
    $("#zoom-out").dblclick(preventDefault);

    $("#reset-view").click(three.centerCamera)

    $("#move-left").click(function(){
      pan(directions.LEFT)
    })
    $("#move-right").click(function(){
      pan(directions.RIGHT)
    })
    $("#move-up").click(function(){
      pan(directions.UP)
    })
    $("#move-down").click(function(){
      pan(directions.DOWN)
    })

    $("#move-left").dblclick(preventDefault);
    $("#move-right").dblclick(preventDefault);
    $("#move-up").dblclick(preventDefault);
    $("#move-down").dblclick(preventDefault);


  }

  function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function pan(direction) {
    switch (direction) {
      case directions.UP:
        orbitControls.panXY(0, panSpeed);
        break;
      case directions.DOWN:
        orbitControls.panXY(0, -panSpeed);
        break;
      case directions.LEFT:
        orbitControls.panXY(panSpeed, 0);
        break;
      case directions.RIGHT:
        orbitControls.panXY(-panSpeed, 0);
        break;
    }
  }

  function zoomIn(e) {
    e.preventDefault();
    orbitControls.dollyIn(1.1);
    orbitControls.update();
  }

  function zoomOut(e) {
    e.preventDefault;
    orbitControls.dollyOut(1.1);
    orbitControls.update();
  }

  init();
}

var AnimationMenu=function(blueprint3d){
  var scope = this;
  var selectedItem;
  var three = blueprint3d.three;
  function init(){
    three.itemSelectedCallbacks.add(itemSelected);
    three.itemUnselectedCallbacks.add(itemUnselected);
    $("#OpenObject").click(function(){
        selectedItem.openItem();
    });
    $("#CloseObject").click(function(){
        selectedItem.closeItem();
    });
  }
  function itemSelected(item) {
    selectedItem = item;
    $("#operation").show();

  }
   function itemUnselected() {
    selectedItem = null;
    $("#operation").hide();
  }
  init();
}

/*
 * Context menu for selected item
 */ 

var ContextMenu = function(blueprint3d) {

  var scope = this;
  var selectedItem;
  var three = blueprint3d.three;

  function init() {
    $("#context-menu-delete").click(function(event) {
        selectedItem.remove();
    });

    three.itemSelectedCallbacks.add(itemSelected);
    three.itemUnselectedCallbacks.add(itemUnselected);

    initResize();

    $("#fixed").click(function() {
        var checked = $(this).prop('checked');
        selectedItem.setFixed(checked);
    });
  }

  function cmToIn(cm) {
    return cm / 2.54;
  }

  function inToCm(inches) {
    return inches * 2.54;
  }

  function itemSelected(item) {
    selectedItem = item;

    $("#context-menu-name").text(item.metadata.itemName);

    $("#item-width").val(cmToIn(selectedItem.getWidth()).toFixed(0));
    $("#item-height").val(cmToIn(selectedItem.getHeight()).toFixed(0));
    $("#item-depth").val(cmToIn(selectedItem.getDepth()).toFixed(0));

    $("#context-menu").show();
    
    $("#fixed").prop('checked', item.fixed);
  }

  function resize() {
    selectedItem.resize(
      inToCm($("#item-height").val()),
      inToCm($("#item-width").val()),
      inToCm($("#item-depth").val())
    );
  }

  function initResize() {
    $("#item-height").change(resize);
    $("#item-width").change(resize);
    $("#item-depth").change(resize);
  }

  function itemUnselected() {
    selectedItem = null;
    $("#context-menu").hide();
    $("#operation").hide();
  }

  init();
}

/*
 * Loading modal for items
 */

var ModalEffects = function(blueprint3d) {

  var scope = this;
  var blueprint3d = blueprint3d;
  var itemsLoading = 0;

  this.setActiveItem = function(active) {
    itemSelected = active;
    update();
  }

  function update() {
    if (itemsLoading > 0) {
      $("#loading-modal").show();
    } else {
      $("#loading-modal").hide();
    }
  }

  function init() {
    blueprint3d.model.scene.itemLoadingCallbacks.add(function() {
      itemsLoading += 1;
      update();
    });

     blueprint3d.model.scene.itemLoadedCallbacks.add(function() {
      itemsLoading -= 1;
      update();
    });   

    update();
  }

  init();
}

/*
 * Side menu
 */

var SideMenu = function(blueprint3d, floorplanControls, modalEffects) {
  var blueprint3d = blueprint3d;
  var floorplanControls = floorplanControls;
  var modalEffects = modalEffects;

  var ACTIVE_CLASS = "active";

  var tabs = {
    "FLOORPLAN" : $("#floorplan_tab"),
    "SHOP" : $("#items_tab"),
    "DESIGN" : $("#design_tab")
  }

  var scope = this;
  this.stateChangeCallbacks = $.Callbacks();

  this.states = {
    "DEFAULT" : {
      "div" : $("#viewer"),
      "tab" : tabs.DESIGN
    },
    "FLOORPLAN" : {
      "div" : $("#floorplanner"),
      "tab" : tabs.FLOORPLAN
    },
    "SHOP" : {
      "div" : $("#add-items"),
      "tab" : tabs.SHOP
    }
  }

  // sidebar state
  var currentState = scope.states.FLOORPLAN;

  function init() {
    for (var tab in tabs) {
      var elem = tabs[tab];
      elem.click(tabClicked(elem));
    }

    $("#update-floorplan").click(floorplanUpdate);

    initLeftMenu();

    blueprint3d.three.updateWindowSize();
    handleWindowResize();

    initItems();

    setCurrentState(scope.states.DEFAULT);
  }

  function floorplanUpdate() {
    setCurrentState(scope.states.DEFAULT);
  }

  function tabClicked(tab) {
    return function() {
      // Stop three from spinning
      blueprint3d.three.stopSpin();

      // Selected a new tab
      for (var key in scope.states) {
        var state = scope.states[key];
        if (state.tab == tab) {
          setCurrentState(state);
          break;
        }
      }
    }
  }
  
  function setCurrentState(newState) {

    if (currentState == newState) {
      return;
    }

    // show the right tab as active
    if (currentState.tab !== newState.tab) {
      if (currentState.tab != null) {
        currentState.tab.removeClass(ACTIVE_CLASS);          
      }
      if (newState.tab != null) {
        newState.tab.addClass(ACTIVE_CLASS);
      }
    }

    // set item unselected
    blueprint3d.three.getController().setSelectedObject(null);

    // show and hide the right divs
    currentState.div.hide()
    newState.div.show()

    // custom actions
    if (newState == scope.states.FLOORPLAN) {
      floorplanControls.updateFloorplanView();
      floorplanControls.handleWindowResize();
    } 

    if (currentState == scope.states.FLOORPLAN) {
      blueprint3d.model.floorplan.update();
    }

    if (newState == scope.states.DEFAULT) {
      blueprint3d.three.updateWindowSize();
    }
 
    // set new state
    handleWindowResize();    
    currentState = newState;

    scope.stateChangeCallbacks.fire(newState);
  }

  function initLeftMenu() {
    $( window ).resize( handleWindowResize );
    handleWindowResize();
  }

  function handleWindowResize() {
    $(".sidebar").height(window.innerHeight);
    $("#add-items").height(window.innerHeight);

  };

  // TODO: this doesn't really belong here
  function initItems() {
    $("#add-items").find(".add-item").mousedown(function(e) {
      var modelUrl = $(this).attr("model-url");
      var itemType = parseInt($(this).attr("model-type"));
      var metadata = {
        itemName: $(this).attr("model-name"),
        resizable: true,
        modelUrl: modelUrl,
        itemType: itemType
      }

      blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
      setCurrentState(scope.states.DEFAULT);
    });
  }

  init();

}

/*
 * Change floor and wall textures
 */

var TextureSelector = function (blueprint3d, sideMenu) {

  var scope = this;
  var three = blueprint3d.three;
  var isAdmin = isAdmin;

  var currentTarget = null;

  function initTextureSelectors() {
    $(".texture-select-thumbnail").click(function(e) {
      var textureUrl = $(this).attr("texture-url");
      var textureStretch = ($(this).attr("texture-stretch") == "true");
      var textureScale = parseInt($(this).attr("texture-scale"));
      currentTarget.setTexture(textureUrl, textureStretch, textureScale);

      e.preventDefault();
    });
  }

  function init() {
    three.wallClicked.add(wallClicked);
    three.floorClicked.add(floorClicked);
    three.itemSelectedCallbacks.add(reset);
    three.nothingClicked.add(reset);
    sideMenu.stateChangeCallbacks.add(reset);
    initTextureSelectors();
  }

  function wallClicked(halfEdge) {
    currentTarget = halfEdge;
    $("#floorTexturesDiv").hide();  
    $("#wallTextures").show();  
  }

  function floorClicked(room) {
    currentTarget = room;
    $("#wallTextures").hide();  
    $("#floorTexturesDiv").show();  
  }

  function reset() {
    $("#wallTextures").hide();  
    $("#floorTexturesDiv").hide();  
  }

  init();
}

/*
 * Floorplanner controls
 */

var ViewerFloorplanner = function(blueprint3d) {

  var canvasWrapper = '#floorplanner';

  // buttons
  var move = '#move';
  var remove = '#delete';
  var draw = '#draw';

  var activeStlye = 'btn-primary disabled';

  this.floorplanner = blueprint3d.floorplanner;

  var scope = this;

  function init() {

    $( window ).resize( scope.handleWindowResize );
    scope.handleWindowResize();

    // mode buttons
    scope.floorplanner.modeResetCallbacks.add(function(mode) {
      $(draw).removeClass(activeStlye);
      $(remove).removeClass(activeStlye);
      $(move).removeClass(activeStlye);
      if (mode == BP3D.Floorplanner.floorplannerModes.MOVE) {
          $(move).addClass(activeStlye);
      } else if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
          $(draw).addClass(activeStlye);
      } else if (mode == BP3D.Floorplanner.floorplannerModes.DELETE) {
          $(remove).addClass(activeStlye);
      }

      if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
        $("#draw-walls-hint").show();
        scope.handleWindowResize();
      } else {
        $("#draw-walls-hint").hide();
      }
    });

    $(move).click(function(){
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
    });

    $(draw).click(function(){
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DRAW);
    });

    $(remove).click(function(){
      scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DELETE);
    });
  }

  this.updateFloorplanView = function() {
    scope.floorplanner.reset();
  }

  this.handleWindowResize = function() {
    $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
    scope.floorplanner.resizeView();
  };

  init();
}; 

var mainControls = function(blueprint3d) {
  var blueprint3d = blueprint3d;

  function newDesign() {
    blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
  }

  function loadDesign() {
    files = $("#loadFile").get(0).files;
    var reader  = new FileReader();
    reader.onload = function(event) {
        var data = event.target.result;
        blueprint3d.model.loadSerialized(data);
    }
    reader.readAsText(files[0]);
  }

  function saveDesign() {
    var data = blueprint3d.model.exportSerialized();
    var a = window.document.createElement('a');
    var blob = new Blob([data], {type : 'text'});
    a.href = window.URL.createObjectURL(blob);
    a.download = 'design.blueprint3d';
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a)
  }
  function setLense(lens){
    blueprint3d.three.setLens(lens)
  }
  function init() {
    $("#new").click(newDesign);
    $("#loadFile").change(blueprint3d);
    $("#saveFile").click(saveDesign);
    $("#OutView").click(function(){
      blueprint3d.three.setOrthographic();

    });
    $("#InView").click(function(){
      blueprint3d.three.setPerspective();
      blueprint3d.three.setLens(100);
       blueprint3d.three.setFov( 30 );
    });
    $("#Lense12").click(function(){
      blueprint3d.three.setLens(12);
    });
    $("#Lense16").click(function(){
      blueprint3d.three.setLens(16);
    });
    $("#Lense24").click(function(){
      blueprint3d.three.setLens(24);
    });
    $("#Lense36").click(function(){
      blueprint3d.three.setLens(36);
    });
    $("#Lense48").click(function(){
      blueprint3d.three.setLens(48);
    });
    $("#Lense60").click(function(){
      blueprint3d.three.setLens(60);
    });
    $("#Lense85").click(function(){
      blueprint3d.three.setLens(85);
    });
    $("#Lense100").click(function(){
      blueprint3d.three.setLens(100);
    });
    

  }

  init();
}

/*
 * Initialize!
 */
var blueprint3d ;
$(document).ready(function() {

  // main setup
  var opts = {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    threeCanvasElement: 'three-canvas',
    textureDir: "models/textures/",
    widget: false
  }
  blueprint3d = new BP3D.Blueprint3d(opts);

  var modalEffects = new ModalEffects(blueprint3d);
  var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
  var contextMenu = new ContextMenu(blueprint3d);
  var animationMenu=new AnimationMenu(blueprint3d);
  var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
  var textureSelector = new TextureSelector(blueprint3d, sideMenu);        
  var cameraButtons = new CameraButtons(blueprint3d);
  mainControls(blueprint3d);

  var rpdconverter=new BP3D.RpdConverter();
  var raw='RoomBaseData%3D%3D3%26-243840.00%20182880.00%200.00%26170720.00%20182880.00%200.00%26170720.00%2046240.00%200.00%26357600.00%2046240.00%200.00%26-243840.00%20-182880.00%200.00%2656880.00%20-182880.00%200.00%26357600.00%20-182880.00%200.00%26-243840.00%200.00%200.00%26%26RoomDecoData%3D%3DFloor_Covering%3D(Code)Common.Flooring.IKEA.All.70080569utan(Typ)other(Rgh)40.00(RflL)1(Glw)0.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)5.00(TopC)255%20255%20255(Col)255%20255%20255(Img)IKEA%2F70080569utan.jpg(Ori)0.00(Scl)4.94%204.68%26%26WallDecoData%3D%3DWall_Color%3D153%20153%20153%26%26ItemDecoData%3D%3DCabWorktop_Shape%3DIKEA.ART.50267978%26CabWorktop_PosRel%3D0%200%2038%26Plinth_Shape%3DIKEA.ART.40287590%26Leg_Shape%3DIKEA.ART.10265518%26%26AllRoomData%3D%3DRoom_Metric%3Dfalse%26CeilingHeight%3D195072.00%26CeilingHeight_Visibility%3Dtrue%26Floor_Covering%3D(Typ)other(Rgh)40.00(RflL)1(Glw)0.00(Trm)0.00(RfrI)1.00%201.00%201.00(Code)Common.Flooring.IKEA.All.70080569utan(Dbl)true(TopW)5.00(TopC)255%20255%20255(Col)255%20255%20255(Img)IKEA%2F70080569utan.jpg(Ori)0.00(Scl)4.94%204.68%26Ceiling_Color%3D255%20255%20255%26Ceiling_Visibility%3Dtrue%26RoomMolding_Covering%3D(Typ)other(Rgh)50.00(RflL)0(Glw)35.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26CamFront3D_Persistence_CamOri%3D80.64%200.00%20-0.00%26CamFront3D_Persistence_CamPos%3D0.08%20-379989.97%20121879.15%26CamFront3D_Persistence_RigBaseHeight%3D111760.00%26CamFront3D_Persistence_RigHeightFactor%3D0.60%26CamFront3D_Persistence_RigPanUD%3D0.00%26CamFront3D_Persistence_RigOrbit%3D0.00%26CamFront3D_Persistence_RigPos%3D0.00%200.00%200.00%26CamFront3D_Persistence_RigZoom%3D380000.00%26CamFree3D_Pos%3D33850.46%20-286949.66%20434334.12%26CamFree3D_Ori%3D34.94%20-0.00%200.00%26CamFree3D_FarPlaneDist%3D35741348.00%26CamFree3D_NearPlaneDist%3D2000.00%26CamFree3D_InterestDist%3D485400.00%26CamFree3D_Orthogonal%3DNo%26CamFree3D_VerticalFOVAngle%3D45.00%26%26AllWallData%3D%3DWall%3DN%26Wall_Color%3D153%20153%20153%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DS%26Wall_Color%3D153%20153%20153%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DE%26Wall_Color%3D153%20153%20153%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DW%26Wall_Color%3D153%20153%20153%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DNW%26Wall_Color%3D255%20255%20255%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DNE%26Wall_Color%3D255%20255%20255%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DSW%26Wall_Color%3D255%20255%20255%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DSE%26Wall_Color%3D255%20255%20255%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DES%26Wall_Color%3D255%20255%20255%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DEN%26Wall_Color%3D255%20255%20255%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DWS%26Wall_Color%3D255%20255%20255%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DWN%26Wall_Color%3D255%20255%20255%26Wall_Visibility%3Dtrue%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%3BWall%3DDiag%26Wall_Color%3D255%20255%20255%26Wall_Covering%3D(Typ)other(Rgh)15.00(RflL)0(Glw)50.00(Trm)0.00(RfrI)1.00%201.00%201.00(Dbl)true(TopW)30.00(TopC)255%20255%20255(Col)255%20255%20255(Img)Common%2FWhite.jpg(Ori)0.00(Scl)1.00%201.00%26Wall_PanelHeight%3D0.00%26%26AllItemData%3D%3DItem%3DIKEA.Host.Basecabinet_36_inch_sink%26Ori%3D0.00%20-0.00%20-90.00%26Pos%3D357591.19%20-39016.47%209120.91%26Scl%3D1.00%201.00%201.00%26Type%3DOnFloor%3ACabinet.Base.ForSink%26ConfigData%3D(Front)IKEA.Host.Basecabinet_36_inch_sink.0_doorW36H30doubledoorSE%26Frame_0_Shape%3DIKEA.ART.80265398%26Leg_0_Shape%3DIKEA.ART.10265518%26Leg_1_Shape%3DIKEA.ART.10265518%26Leg_2_Shape%3DIKEA.ART.10265518%26Leg_3_Shape%3DIKEA.ART.10265518%26Plinth_0_Shape%3DIKEA.ART.40287590%26SinkLid_0_PosRel%3D0%200%200%26SinkLid_0_OriRel%3D0.00%200.00%200.00%26SinkLid_0_Shape%3DIKEA.ART.20317852%26SinkLid_1_PosRel%3D0%200%200%26SinkLid_1_OriRel%3D0.00%200.00%200.00%26SinkLid_1_Shape%3DIKEA.ART.20317852%26DoorDamper0_Shape%3DIKEA.ART.40241823%26DoorFrontB0_OriRel%3D0.00%200.00%200.00%26DoorFrontB0_PosRel%3D458.5%200%201.5%26DoorFrontB0_Shape%3DIKEA.ART.20266536%26DoorHandlePositionB0_OriRel%3D0.00%20270.00%200.00%26DoorHandlePositionB0_PosRel%3D30%200%20729%26DoorHandleB0_PosRel%3D0%20-16%200%26DoorHandleB0_OriRel%3D0.00%200.00%200.00%26DoorHandleB0_Suffix%3D_RightJustified%26DoorHandleB0_Shape%3DIKEA.ART.26704200%26Hinge0_OriRel%3D0.00%200.00%200.00%26Hinge0_PosRel%3D0%200%200%26Hinge0_Shape%3DIKEA.ART.60204645%26DoorFrontA0_OriRel%3D0.00%200.00%200.00%26DoorFrontA0_PosRel%3D1.5%200%201.5%26DoorFrontA0_Shape%3DIKEA.ART.20266536%26DoorHandlePositionA0_OriRel%3D0.00%2090.00%200.00%26DoorHandlePositionA0_PosRel%3D424%200%20729%26DoorHandleA0_OriRel%3D0.00%200.00%200.00%26DoorHandleA0_PosRel%3D0%20-16%200%26DoorHandleA0_Suffix%3D_LeftJustified%26DoorHandleA0_Shape%3DIKEA.ART.26704200%26DoorDamper1_Shape%3DIKEA.ART.40241823%26Hinge1_PosRel%3D0%200%200%26Hinge1_OriRel%3D0.00%200.00%200.00%26Hinge1_Shape%3DIKEA.ART.60204645%26Hinge2_OriRel%3D0.00%200.00%200.00%26Hinge2_PosRel%3D0%200%200%26Hinge2_Shape%3DIKEA.ART.60204645%26Hinge3_PosRel%3D0%200%200%26Hinge3_OriRel%3D0.00%200.00%200.00%26Hinge3_Shape%3DIKEA.ART.60204645%26Drawer6_OriRel%3D0.00%200.00%200.00%26Drawer6_PosRel%3D18%200%200%26Drawer6_Shape%3Dnull%26Drawer7_PosRel%3D18%200%200%26Drawer7_OriRel%3D0.00%200.00%200.00%26Drawer7_Shape%3Dnull%26SuspRail_0_Shape%3DIKEA.ART.60261527%26TopRail_Shape%3DIKEA.ART.60284581%26CabWorktop_0_Suffix%3D_36x26inch_top_SE_30324890%26CabWorktop_0_PosRel%3D0%200%2038%26CabWorktop_0_OriRel%3D0.00%200.00%200.00%26CabWorktop_0_Shape%3DIKEA.ART.50267978%26CabSinkPosition_PosRel%3D0%200%200%26CabSinkPosition_OriRel%3D0.00%200.00%200.00%26CabSinkPosition_Shape%3Dnull%26CabSink_PosRel%3D0%200%200%26CabSink_OriRel%3D0.00%200.00%200.00%26CabSink_Shape%3DIKEA.ART.30324890%26SinkTap_PosRel%3D0%20-100%200%26SinkTap_OriRel%3D0.00%200.00%200.00%26SinkTap_Shape%3DIKEA.ART.20131552%26SinkWatertrap_0_PosRel%3D0%200%200%26SinkWatertrap_0_OriRel%3D0.00%200.00%200.00%26SinkWatertrap_0_Shape%3DIKEA.ART.50325426%26SinkWatertrap_1_PosRel%3D0%200%200%26SinkWatertrap_1_OriRel%3D0.00%200.00%200.00%26SinkWatertrap_1_Shape%3DIKEA.ART.50325426';
  var rpddata=rpdconverter.rpdToJson(raw);
  var room=rpdconverter.loadRoom(rpddata);
  var floorData=JSON.stringify(room);
  console.log(floorData);
  // This serialization format needs work
  // Load a simple rectangle room
  blueprint3d.model.loadSerialized(floorData);
});

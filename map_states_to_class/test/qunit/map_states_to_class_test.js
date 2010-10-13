module("Map States to Class Controller");
  
SS.Controller.StateMachine.extend("OpaqueStatesTestController", {
  states: {
    initial:    {},
    stateTwo:   {},
    stateThree: {},
    stateFour:  {}
  },
  
	init: function(){
    this.mapStatesToClass("customTransparent", { 
      customOpaque: ["stateTwo", "stateFour"]
    }, "changeOpacity");
	}
},
{
});

test("Initial should be default class", function(){
  var testController = new OpaqueStatesTestController($("<div />").get(0));
  equals(testController.currentStateClass, "customTransparent");
});

asyncTest("stateTwo & stateFour should be customOpaque", function(){
  var testController = new OpaqueStatesTestController($("<div />").get(0));
  
  testController.changeOpacity = start;
  testController.moveToState("stateTwo");
  stop();
  equals(testController.currentStateClass, "customOpaque");
  
  testController.moveToState("initial");
  stop();
  equals(testController.currentStateClass, "customTransparent");
  
  testController.moveToState("stateFour");
  stop();
  equals(testController.currentStateClass, "customOpaque");
});

asyncTest("stateThree should be customTransparent", function(){
  var testController = new OpaqueStatesTestController($("<div />").get(0));
  testController.moveToState("stateTwo");
  testController.changeOpacity = start;
  testController.moveToState("stateThree");
  stop();
  equals(testController.currentStateClass, "customTransparent");
});

asyncTest("Custom changeOpacity should fire", function(){
  var testController = new OpaqueStatesTestController($("<div />").get(0));
  
  testController.changeOpacity = function(newClass) {
    start();
    equals(newClass, "customOpaque");
  };
  stop();
  testController.moveToState("stateTwo");
  
  testController.changeOpacity = function(newClass) {
    start();
    equals(newClass, "customTransparent");
  };
  stop();
  testController.moveToState("stateThree");
});

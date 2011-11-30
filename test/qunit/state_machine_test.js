module("State Machine Controller");

SS.Controller.StateMachine("TestController", {
  states: {
    global:     { globalEvent:             "stateSix" },
  
    initial:    { move:                    "stateTwo",
                  "testEvent subscribe":   "stateThree",
                  "a click":               "stateFour",
                  "click":                 "stateFive" },
    stateTwo:   { "testEvent subscribe":   "initial" },
    stateThree: { globalEvent:             "stateFive" },
    stateFour:  { },
    stateFive:  { },
    stateSix:   { onEnter:                 "onSixEnter",
                  onExit:                  "onSixExit" },
    stateSeven: { onEnter: ["enter1", "enter2"] }
  }
},
{
});

test("Begins in initial state", function(){
  var testController = new TestController($("<div />").get(0));
  equals(testController.currentStateName, "initial");
});

test("Moves on to next state", function(){
  var testController = new TestController($("<div />").get(0));
  testController.publishState("move");
  equals(testController.currentStateName, "stateTwo");
});

test("Listens to openajax events", function(){
  var testController = new TestController($("<div />").get(0));
  OpenAjax.hub.publish("testEvent");
  equals(testController.currentStateName, "stateThree");
});

test("Ignores others' openajax events", function(){
  var testController = new TestController($("<div />").get(0));
  testController.moveToState("stateTwo");
  OpenAjax.hub.publish("testEvent");
  equals(testController.currentStateName, "initial");
});

test("Listens to jQuery DOM events on subelements", function(){
  var testController = new TestController($("<div><a href=''></a></div>").get(0));
  testController.element.find("a").click();
	equals(testController.currentStateName, "stateFour");
});

test("Listens to jQuery DOM events", function(){
  var testController = new TestController($("<div />").get(0));
  testController.element.click();
  equals(testController.currentStateName, "stateFive");
});

test("Ignores others' DOM events", function(){
  var testController1 = new TestController($("<div><a href=''></a></div>").get(0));
  testController1.element.find("a").click();
  equals(testController1.currentStateName, "stateFour");

  var testController2 = new TestController($("<div />").get(0));
  testController2.element.click();
  equals(testController2.currentStateName, "stateFive");
});

test("Global events work in all states", function(){
  var testController = new TestController($("<div />").get(0));
  testController.publishState("globalEvent");
  equals(testController.currentStateName, "stateSix");

  testController.moveToState("stateTwo");
  testController.publishState("globalEvent");
  equals(testController.currentStateName, "stateSix");
});

test("Global events can be overridden", function(){
  var testController = new TestController($("<div />").get(0));
  testController.moveToState("stateThree");
  testController.publishState("globalEvent");
  equals(testController.currentStateName, "stateFive");
});

test("onExit and onEnter callbacks", function(){
  var testController = new TestController($("<div />").get(0));
  expect(2);
  
  testController.onSixEnter = function() {
    start();
    testController.onExitRan = true;
  };
  
  testController.onSixExit = function() {
    start();
    testController.onEnterRan = true;
  };
  
  stop();
  testController.moveToState("stateSix");
  stop();
  testController.moveToState("stateSeven");
  
  ok(testController.onExitRan, "onExit ran");
  ok(testController.onEnterRan, "onEnter ran");
});

test("An array of onExit callbacks", function(){
  var testController = new TestController($("<div />").get(0));
  expect(3);
  
  testController.tracker = [];
  testController.enter1 = function() {
    testController.tracker.push("enter1");
    start();
  };
  testController.enter2 = function() {
    testController.tracker.push("enter2");
    start();
  };
  
  testController.moveToState("stateSeven");
  stop();
  stop();
  
  equals(testController.tracker.length, 2);
  equals(testController.tracker[0], "enter1");
  equals(testController.tracker[1], "enter2");
});

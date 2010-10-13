steal.plugins("ss/controller/state_machine")
     .then(function($) {

  $.Controller.extend('SS.Controller.MapStatesToClass',
  {
    onDocument: true,
    mappings:   {}
  },
  {    
    "didMoveToState subscribe": function(event_name, params) {
      var controller = params.controller,
          mapping    = SS.Controller.MapStatesToClass.mappings[controller.Class.fullName];
          
      if (!mapping) {
        return;
      }
    
      var newClass = mapping.inverseMapping[params.to] || mapping.defaultClass;
      
      if (typeof controller.element !== "undefined") {
        controller.element.addClass(newClass).removeClass(controller.currentStateClass);
      }
      
      var callbackFunc = mapping.callback;
      if ((typeof callbackFunc === "string") &&
          ($.isFunction(controller[callbackFunc]))) {
        callbackFunc = controller[callbackFunc];
      }

      if ($.isFunction(callbackFunc)) {
        callbackFunc.apply(controller, [newClass]);
      }
      
      controller.currentStateClass = newClass;
    }
  }
  );
  
  // Add to list of mapped states
  SS.Controller.StateMachine.mapStatesToClass = function(defaultClass, stateMapping, callback) {
    this.prototype.currentStateClass = defaultClass;
    
    var inverseMapping = {};
    for (var klassName in stateMapping) {
      var states = stateMapping[klassName];
      for (var i = 0; i < states.length; i++) {
        var state = states[i];
        inverseMapping[state] = klassName;
      }
    }
    
    SS.Controller.MapStatesToClass.mappings[this.fullName] = {
      defaultClass:   defaultClass,
      stateMapping:   stateMapping,
      inverseMapping: inverseMapping,
      callback:       callback || $.noop
    };
  };
});

steal('jquery/controller/subscribe', 
    'jquery/controller',
    'jquery/lang/openajax')
     .then(function($) {

  $.Controller("SS.Controller.StateMachine",
  {
    stateSuffixCounter: 0,
    states: {
      initial: { }
    },
    
    processorRegex: function() {
      var processorList = [];
      for (var processorName in $.Controller.processors) {
        processorList.push(processorName);
      }
      return new RegExp("(" + processorList.join("|") + ")$");
    }(),
    
    globalStates: {},
    setup: function() {
      this._super.apply(this, arguments);
    
      if (this.fullName === "SS.StateMachine.Controller") {
        return;
      }
      
      this.globalStates = this.states["global"];
      delete this.states["global"];
      
      // Initalize state machine
      this.intializeStateMachine(false);
    },
    
    intializeStateMachine: function(overwrite) {
      for(var stateName in this.states) {
        if (this.globalStates) {
          this.states[stateName] = $.extend({}, this.globalStates, this.states[stateName]);
        }
        
        for(var transitionEvent in this.states[stateName]) {
          this.attachListeners(stateName, transitionEvent, overwrite);
        }
      };
    },
    
    attachListeners: function(stateName, transitionEvent, overwrite) {
      if (transitionEvent.match(/^on(Enter|Exit)$/)) {
        return;
      }
      
      var handledByProcessor = transitionEvent.match(this.processorRegex);
      
      if (!handledByProcessor ||
          (handledByProcessor[1] === "subscribe")) {
        // Listen on OpexAjax events
        var fullEvent = transitionEvent.replace(/( subscribe)?$/, ".inState_" + stateName);
        this.attachEvent(fullEvent, function(targetState) {
          return function() {
            this.moveToState(targetState);
          };
        }(this.states[stateName][transitionEvent]), overwrite);
      } else {
        // Listen on jQuery events
        var subElementSelector = transitionEvent.replace(this.processorRegex, "");
        subElementSelector = subElementSelector.length ? subElementSelector : undefined;
        this.attachEvent(transitionEvent, function(transitionEvent, subElementSelector) {
          return function(elem, event) {
            if (this.currentState()[transitionEvent] &&
                 (!subElementSelector || 
                   (subElementSelector === "window") || 
                   $(event.target).is(subElementSelector)
                 )
               ) {
              event.preventDefault();
              this.moveToState(this.currentState()[transitionEvent]);
              return false;
            }
          };
        }(transitionEvent, subElementSelector), overwrite);
      }
    },
    
    attachEvent: function(eventName, eventCallback, overwrite) {
      //@steal-remove-start
      // Make sure a method isn't already defined
      if ((overwrite !== true) && this.prototype[eventName]) {
        steal.dev.log(this.fullName + " Overwritting event already defined at: " + eventName);
      }
      //@steal-remove-end
      
      this.prototype[eventName] = eventCallback;
    },
    
    generatePermutations: function(theSet, lastState, states, initialState, finalState) {
      if (!theSet.length) {
        return;
      }
      
      var namedSet    = $.map(theSet, function(item) { return item.stateName; }),
          targetState = namedSet.join("-");
      
      lastState    = lastState    || targetState;
      states       = states       || {};
      initialState = initialState || "initial";
      finalState   = finalState   || "allVariablesSet";

      for (var i = 0; i < theSet.length; i++) {
        var newSet      = theSet.slice(0),
            thisItem    = newSet.splice(i, 1)[0],
            namedSet2   = $.map(newSet, function(item) { return item.stateName; }),
            newSetState = namedSet2.join("-");
        
        if (newSetState.length < 1) {
          newSetState = initialState;
        }
        
        if (targetState == lastState) {
          targetState = finalState;
        }
        
        states[newSetState] = states[newSetState] || {};
        states[newSetState][thisItem.movementEvent] = targetState;
        this.generatePermutations(newSet, lastState, states, initialState, finalState);
      }
      
      return states;
    }
  },
  {
    currentStateName: null,

    setup: function() {
      this._super.apply(this, arguments);
      
      // Event suffix so only our instance gets events
      this.stateSuffix = this.Class.shortName + "#" + this.Class.stateSuffixCounter++;
      
      // Rebroadcast global events locally
      OpenAjax.hub.subscribe("**", this.callback("publishState"));
      
      this.moveToState("initial");
    },

    moveToState: function(stateName) {
      // Only move to states which exist
      if (!stateName || !this.Class.states[stateName]) {
        //@steal-remove-start
        steal.dev.log(this.stateSuffix + " tried to move to a state which is not defined: " + stateName);
        //@steal-remove-end
        return;
      }
      
      // Exit the old state
      this.stateChangeCallback("onExit", stateName);
    
      // Change to new state
      var oldStateName      = this.currentStateName;
      this.currentStateName = stateName;
      
      // Broadcast a message announcing the change to listeners
      this.publish("didMoveToState", { controller: this, to: this.currentStateName, from: oldStateName });
      
      //@steal-remove-start
      // Log a message if we're not looping back into the current state
      if (oldStateName && (oldStateName !== this.currentStateName)) {
        steal.dev.log("FSM (" + this.stateSuffix + "): " + oldStateName + " -> " + this.currentStateName);
      }
      //@steal-remove-end
      
      // Enter the new state
      this.stateChangeCallback("onEnter", oldStateName);
    },
    
    stateChangeCallback: function(callbackName, oldStateName) {
      if (!this.currentState() || !this.currentState()[callbackName]) {
        return;
      }
    
      var functionDef = this.currentState()[callbackName];
      
      // A single callback is the same as an array with only one callback
      if (typeof functionDef === "string") {
        functionDef = [functionDef];
      }
      
      if ($.isArray(functionDef)) {
        for (var i = 0; i < functionDef.length; i++) {
          // If we're calling a named function
          if (this[functionDef[i]]) {
            this[functionDef[i]](oldStateName);
          } else {
            // otherwise we publish an event
            this.publish(functionDef[i], this);
          }
        }
      } else {
        this.callback(functionDef)(oldStateName);
      }
    },

    currentState: function() {
      return this.Class.states[this.currentStateName];
    },
    
    publishState: function(event_name, params) {
      if (event_name.match(/history\.|inState_|didMoveToState/)) {
        return;
      }
    
      var currentStateMappedEvent = event_name + ".inState_" + this.currentStateName;
      if (this[currentStateMappedEvent]) {
        this[currentStateMappedEvent](params);
      }
    }
  }
  );
})
//.then("./map_states_to_class/map_states_to_class")

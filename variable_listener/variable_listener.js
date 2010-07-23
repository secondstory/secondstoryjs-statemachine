SS.StateMachine.Controller.extend('SS.StateMachine.Controller.VariableListener',
{
  onDocument: true
},
{
  states: { },
  
  init: function(variables, event_name) {
    var eventPermuations = $.map(variables, function(item, i) {
      var event = item.namespace + "." + item.name + "." + item.event_type;
      return { stateName: "v" + (i+1), movementEvent: event };
    });

    var permutedStates = this.stateMachine.Class.generatePermutations(eventPermuations);
    $.extend(true, this.states, permutedStates);
    
    this.states.allVariablesSet.onEnter = function() { 
      /* Fire event on complete */
      front_controller.publish(this.event_name);
    
      /* Move back to initial */
      this.moveToState("initial");
    };
      
    this._super(document.body);
  }
  },
  
  "variable.set subscribe":    function(e, p) { this.checkEvent(e, p); },
  "variable.update subscribe": function(e, p) { this.checkEvent(e, p); },
  "variable.unset subscribe":  function(e, p) { this.checkEvent(e, p); },
  
  checkEvent: function(event_name, params) {
    var matches = event_name.match(/^variable\.(.*)$/);
    event_type = matches[1]; /* set, update, unset */
    var key = '';
    
    if(params.namespace)
    {
      key = params.namespace + '.';
    }
    key += params.name + '.' + event_type;
    
    if(this.variable_events[key] !== undefined)
    {
      this.publishState(key);
    }
  }
}
);

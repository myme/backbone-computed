(function ( Backbone, Underscore ) {

  'use strict';

  var bbExtend = Backbone.Model.extend;

  Backbone.Model.extend = function ( properties, classProperties ) {
    var prop, action, propSpec, deps;

    var computedProps = properties.properties;
    delete properties.properties;

    var Class = bbExtend.call( this, properties, classProperties );

    if ( computedProps ) {
      for ( prop in computedProps ) {
        if ( computedProps.hasOwnProperty( prop ) ) {
          propSpec = computedProps[ prop ];
          if ( propSpec instanceof Function ) {
            action = propSpec;
            deps = [];
          } else {
            action = propSpec.action;
            deps = propSpec.deps || [];
          }
          computedProps[ prop ] = {
            action: action,
            deps: deps
          };
        }
      }
    }

    var get = Class.prototype.get;
    Class.prototype.get = function ( attr ) {
      if ( computedProps[ attr ] ) {
        return computedProps[ attr ].action.call( this );
      }
      return get.apply( this, arguments );
    };

    var set = Class.prototype.set;
    Class.prototype.set = function ( attr, value ) {
      if ( computedProps[ attr ] ) {
        return computedProps[ attr ].action.call( this, value );
      }
      return set.apply( this, arguments );
    };

    return Class;
  };

}( this.Backbone, this.underscore ));

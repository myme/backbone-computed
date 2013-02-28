(function ( Backbone, _ ) {

  'use strict';

  var bbExtend = Backbone.Model.extend;

  Backbone.Model.extend = function ( properties, classProperties ) {
    var prop, action, propSpec, deps;
    var parent = this;

    properties = properties || {};
    var computedProps = properties.properties;
    delete properties.properties;

    // Override Boostrap's default constructor
    properties.constructor = function () {
      return parent.apply( this, arguments );
    };

    // Extend our class from Boostrap.Model
    var Class = bbExtend.call( this, properties, classProperties );

    // Setup computed properties
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

    // Override Bootstrap's default getter
    var get = Class.prototype.get;
    Class.prototype.get = function ( attr ) {
      if ( computedProps[ attr ] ) {
        return computedProps[ attr ].action.call( this );
      }
      return get.apply( this, arguments );
    };

    // Override Bootstrap's default setter
    var set = Class.prototype.set;
    Class.prototype.set = function ( attr, value ) {
      if ( computedProps[ attr ] ) {
        computedProps[ attr ].action.call( this, value );
        this.trigger( 'change:' + attr, this, attr );
        return this;
      }
      return set.apply( this, arguments );
    };

    return Class;
  };

}( this.Backbone, this.underscore ));

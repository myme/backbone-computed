(function ( Backbone, _ ) {

  'use strict';

  var bbExtend = Backbone.Model.extend;


  function triggerPropChange( ctx, prop ) {
    return function () {
      ctx.trigger( 'change:' + prop, ctx, prop );
    };
  }


  function setupDepsListeners( ctx, prop, deps ) {
    deps = deps || [];
    var l = deps.length;
    while ( l-- ) {
      ctx.on( 'change:' + deps[ l ], triggerPropChange( ctx, prop ) );
    }
  }


  Backbone.Model.extend = function ( properties, classProperties ) {
    var prop, action, propSpec, deps;
    var parent = this;

    properties = properties || {};
    var computedProps = properties.properties;
    delete properties.properties;

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
            deps = propSpec.depends || [];
          }
          computedProps[ prop ] = {
            action: action,
            deps: deps
          };
        }
      }
    }

    // Override Boostrap's default constructor, setting up listeners for dependencies.
    properties.constructor = function () {
      var prop, deps, l;
      this._cachedProps = {};

      for ( prop in computedProps ) {
        if ( computedProps.hasOwnProperty( prop ) ) {
          setupDepsListeners( this, prop, computedProps[ prop ].deps );
        }
      }

      return parent.apply( this, arguments );
    };

    // Extend our class from Boostrap.Model
    var Class = bbExtend.call( this, properties, classProperties );

    // Override Bootstrap's default getter
    var get = Class.prototype.get;
    Class.prototype.get = function ( attr ) {
      var newValue;
      if ( computedProps[ attr ] ) {
        newValue = computedProps[ attr ].action.call( this );
        this._cachedProps[ attr ] = newValue;
        return newValue;
      }
      return get.apply( this, arguments );
    };

    // Override Bootstrap's default setter
    var set = Class.prototype.set;
    Class.prototype.set = function ( attr, value ) {
      var newValue;
      if ( computedProps[ attr ] ) {
        newValue = computedProps[ attr ].action.call( this, value );
        if ( this._cachedProps[ attr ] !== newValue ) {
          this._cachedProps[ attr ] = newValue;
          this.trigger( 'change:' + attr, this, attr );
        }
        return this;
      }
      return set.apply( this, arguments );
    };

    return Class;
  };

}( this.Backbone, this._ ));

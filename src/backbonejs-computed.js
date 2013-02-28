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


  function normalizeComputedProps( computedProps ) {
    var propSpec, action, prop, deps;
    var normalizedProps = {};

    if ( ! computedProps ) {
      return {};
    }

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

        normalizedProps[ prop ] = {
          action: action,
          deps: deps
        };
      }
    }

    return normalizedProps;
  }


  // Creates a getter for the class, taking as input
  // the original getter to wrap
  var wrapGet = function ( get ) {
    return function ( attr ) {
      var computedProps = this._computedProps;
      var newValue;

      if ( computedProps[ attr ] ) {
        newValue = computedProps[ attr ].action.call( this );
        this._cachedProps[ attr ] = newValue;
        return newValue;
      }

      return get.apply( this, arguments );
    };
  };


  // Creates a setter for the class, taking as input
  // the original setter to wrap
  var wrapSet = function ( set ) {
    return function ( attr, value ) {
      var computedProps = this._computedProps;
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
  };


  // Override Bootstrap.Model's extend
  Backbone.Model.extend = function ( properties, classProperties ) {
    var prop, action, propSpec, deps;
    var parent = this;

    properties = properties || {};

    // Setup computed properties
    var computedProps = normalizeComputedProps( properties.properties );
    delete properties.properties;

    // Override Boostrap's default constructor, setting up listeners for dependencies.
    properties.constructor = function () {
      var computedProps = this._computedProps;
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

    Class.prototype._computedProps = computedProps;

    // Override Bootstrap's default getter
    Class.prototype.get = wrapGet( Class.prototype.get );

    // Override Bootstrap's default setter
    Class.prototype.set = wrapSet( Class.prototype.set );

    return Class;
  };

}( this.Backbone, this._ ));

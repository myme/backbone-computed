this.Backbone.Model = (function ( Model, _ ) {

  'use strict';


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


  return Model.extend({

    _computedProps: {},

    // Override Boostrap's default constructor, setting up listeners for dependencies.
    constructor: function () {
      var computedProps = this._computedProps;
      var prop, deps, l;

      this._cachedProps = {};

      for ( prop in computedProps ) {
        if ( computedProps.hasOwnProperty( prop ) ) {
          this.setupDepsListeners( prop, computedProps[ prop ].deps );
        }
      }

      return Model.apply( this, arguments );
    },

    get: _.wrap( Model.prototype.get, function ( get, attr ) {
      var computedProps = this._computedProps;
      var newValue;

      if ( computedProps[ attr ] ) {
        newValue = computedProps[ attr ].action.call( this );
        this._cachedProps[ attr ] = newValue;
        return newValue;
      }

      return get.call( this, attr );
    }),

    set: _.wrap( Model.prototype.set, function ( set, attr, values ) {
      var computedProps = this._computedProps;
      var newValue;

      if ( computedProps[ attr ] ) {
        newValue = computedProps[ attr ].action.call( this, values );
        if ( this._cachedProps[ attr ] !== newValue ) {
          this._cachedProps[ attr ] = newValue;
          this.trigger( 'change:' + attr, this, attr );
        }
        return this;
      }

      return set.call( this, attr, values );
    }),

    setupDepsListeners: function setupDepsListeners( prop, deps ) {
      deps = deps || [];
      var l = deps.length;
      while ( l-- ) {
        this.on( 'change:' + deps[ l ], this.triggerPropChange( prop ) );
      }
    },

    triggerPropChange: function ( prop ) {
      var context = this;
      return function () {
        context.trigger( 'change:' + prop, context, prop );
      };
    }

  }, {

    // Override Bootstrap.Model's extend
    extend: _.wrap( Model.extend, function ( extend, properties, classProperties ) {
      var prop, action, propSpec, deps;

      properties = properties || {};

      // Setup computed properties
      var computedProps = normalizeComputedProps( properties.properties );
      delete properties.properties;

      // Extend our class from Boostrap.Model
      var Class = extend.call( this, properties, classProperties );

      _.extend( Class.prototype, {
        _computedProps: computedProps
      });

      return Class;
    })

  });

}( this.Backbone.Model, this._ ));

this.Backbone.Model = (function ( Model, _ ) {

  'use strict';


  return Model.extend({

    _computedProps: {},

    // Override Boostrap's default constructor, setting up listeners for dependencies.
    constructor: function () {
      var classProps = this._computedProps;
      var computedProps = this._computedProps = {};
      var prop, propSpec, l;

      this._cachedProps = {};

      for ( prop in classProps ) {
        if ( classProps.hasOwnProperty( prop ) ) {
          propSpec = classProps[ prop ];
          this.addProperty( prop, propSpec.deps, propSpec.action );
        }
      }

      return Model.apply( this, arguments );
    },

    /*
       .addProperty( name, [deps ,] action )

         name:   The name of the computed property.
         deps:   List of properties the new property should
                 depend on.
         action: A function for getting and setting the
                 computed property.

       Adds a new computed property to the model instance.
     */

    addProperty: function ( name, deps, action ) {
      if ( action === undefined ) {
        action = deps;
        deps = [];
      }

      var computedProps = this._computedProps;

      computedProps[ name ] = {
        action: action,
        deps: deps
      };

      this.setupDepsListeners( name, deps );

      return this;
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

      var context = this;
      var triggerPropChange = function () {
        context.trigger( 'change:' + prop, context, prop );
      };

      var l = deps.length;
      while ( l-- ) {
        this.on( 'change:' + deps[ l ], triggerPropChange );
      }
    }

  }, {

    addProperty: function ( name, deps, action ) {
      if ( action === undefined ) {
        action = deps;
        deps = [];
      }

      this.prototype._computedProps[ name ] = {
        action: action,
        deps: deps
      };

      return this;
    },

    // Override Bootstrap.Model's extend
    extend: _.wrap( Model.extend, function ( extend, properties, classProperties ) {
      var prop, action, propSpec, deps;

      properties = properties || {};

      // Setup computed properties
      var computedProps = this.normalizeComputedProps( properties.properties );
      delete properties.properties;

      // Extend our class from Boostrap.Model
      var Class = extend.call( this, properties, classProperties );

      _.extend( Class.prototype, {
        _computedProps: computedProps
      });

      return Class;
    }),

    normalizeComputedProps: function ( computedProps ) {
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

  });

}( this.Backbone.Model, this._ ));

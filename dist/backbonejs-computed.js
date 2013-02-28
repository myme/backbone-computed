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
          this.addProperty( prop, propSpec.depends, propSpec.action );
        }
      }

      return Model.apply( this, arguments );
    },

    /*
       .addProperty( name, [depends ,] action )

         name:    The name of the computed property.
         depends: List of properties the new property should
                  depend on.
         action:  A function for getting and setting the
                  computed property.

       Adds a new computed property to the model instance.
     */

    addProperty: function ( name, depends, action ) {
      if ( action === undefined ) {
        action = depends;
        depends = [];
      }

      var computedProps = this._computedProps;

      computedProps[ name ] = {
        action: action,
        depends: depends
      };

      this.setupDepsListeners( name, depends );

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

    setupDepsListeners: function setupDepsListeners( prop, depends ) {
      depends = depends || [];

      var context = this;
      var triggerPropChange = function () {
        context.trigger( 'change:' + prop, context, prop );
      };

      var l = depends.length;
      while ( l-- ) {
        this.on( 'change:' + depends[ l ], triggerPropChange );
      }
    }

  }, {

    addProperty: function ( name, depends, action ) {
      if ( action === undefined ) {
        action = depends;
        depends = [];
      }

      this.prototype._computedProps[ name ] = {
        action: action,
        depends: depends
      };

      return this;
    },

    // Override Bootstrap.Model's extend
    extend: _.wrap( Model.extend, function ( extend, properties, classProperties ) {
      var prop, action, propSpec, depends;

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
      var propSpec, action, prop, depends;
      var normalizedProps = {};

      if ( ! computedProps ) {
        return {};
      }

      for ( prop in computedProps ) {
        if ( computedProps.hasOwnProperty( prop ) ) {
          propSpec = computedProps[ prop ];

          if ( propSpec instanceof Function ) {
            action = propSpec;
            depends = [];
          } else {
            action = propSpec.action;
            depends = propSpec.depends || [];
          }

          normalizedProps[ prop ] = {
            action: action,
            depends: depends
          };
        }
      }

      return normalizedProps;
    }

  });

}( this.Backbone.Model, this._ ));

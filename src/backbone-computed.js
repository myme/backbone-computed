this.Backbone.Model = (function ( Model, _ ) {

  'use strict';


  function normalizeComputedProps( computedProps ) {
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


  return Model.extend({

    /*
     * Instance methods
     */

    _computedProps: {},

    // Override Boostrap's default constructor, setting up listeners for dependencies.
    constructor: function () {
      var classProps = this._computedProps;
      var prop, propSpec, l;

      this._computedCache = {};
      this._computedProps = {};
      this._dependencyMap = {};

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
      var dependencyMap = this._dependencyMap;

      computedProps[ name ] = action;

      _.map( depends, function ( dep ) {
        var dependents = dependencyMap[ dep ] || ( dependencyMap[ dep ] = [] );
        dependents.push( name );
      });

      return this;
    },

    get: _.wrap( Model.prototype.get, function ( get, attr ) {
      var computedProps = this._computedProps;
      var computedCache = this._computedCache;
      var action;

      if ( action = computedProps[ attr ] ) {
        var cached = computedCache[ attr ];
        if ( cached !== undefined ) {
          return cached;
        }
        var newValue = action.call( this );
        computedCache[ attr ] = newValue;
        return newValue;
      }

      return get.call( this, attr );
    }),

    set: _.wrap( Model.prototype.set, function ( set, attributes, value, options ) {
      var computedProps = this._computedProps;
      var computedCache = this._computedCache;
      var dependencyMap = this._dependencyMap;
      var key, newValue;

      if ( typeof attributes === 'string' ) {
        key = attributes;
        attributes = {};
        attributes[ key ] = value;
      } else {
        options = value;
      }

      attributes = _.chain( attributes )
        .keys()
        .reduce( function ( attrs, key ) {
          var group = attrs[ computedProps[ key ] ? 'computed' : 'regular' ];
          group[ key ] = attributes[ key ];
          return attrs;
        }, { computed: {}, regular: {} })
        .value();

      var changedAttrs = this.changedAttributes( attributes.regular ) || {};
      set.call( this, changedAttrs, options );

      var changedComputed = _.chain( changedAttrs )
        .keys()
        .map( function ( attr ) {
          return dependencyMap[ attr ];
        })
        .reduce( function ( dependents, newDependents ) {
          return _.union( dependents, newDependents || [] );
        }, [])
        .value();

      _.each( changedComputed, function ( attr ) {
        delete computedCache[ attr ];
      });

      _.each( attributes.computed, function ( value, attr ) {
        var cached = computedCache[ attr ];
        if ( ! cached || cached !== value ) {
          computedCache[ attr ] =
            computedProps[ attr ].call( this, value );
          changedComputed = _.union( changedComputed, [ attr ]);
        }
      }, this);

      _.each( changedComputed, function ( attr ) {
        if ( ! computedCache[ attr ] ) {
          computedCache[ attr ] = computedProps[ attr ].call( this );
        }
        this.trigger( 'change:' + attr, this, computedCache[ attr ]);
      }, this);

      return this;
    })

  }, {

    /*
     * Static / class methods
     */

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

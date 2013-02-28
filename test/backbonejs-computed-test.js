(function ( buster, Backbone ) {

  'use strict';

  var assert = buster.assert;
  var refute = buster.refute;

  buster.testCase( 'Backbone.js computed properties', {

    'regular .get works': function () {
      var model = new Backbone.Model({ foo: 'bar' });
      assert.equals( model.get( 'foo' ), 'bar' );
    },

    'regular .set works': function () {
      var model = new Backbone.Model();
      model.set( 'foo', 'bar' );
      assert.equals( model.get( 'foo' ), 'bar' );
    },

    'simple computed props': {

      'getter': function () {
        var Model = Backbone.Model.extend({
          properties: {
            aPlusB: function () {
              var a = this.get( 'a' );
              var b = this.get( 'b' );
              return a + b;
            }
          }
        });
        var model = new Model({ a: 10, b: 20 });
        assert.equals( model.get( 'aPlusB' ), 30 );
      },

      'setter': function () {
        var Model = Backbone.Model.extend({
          properties: {
            foo: function ( foo ) {
              if ( arguments.length ) {
                this._foo = foo;
              }
              return this._foo;
            }
          }
        });
        var model = new Model();
        model.set( 'foo', 100 );
        assert.equals( model.get( 'foo' ), 100 );
      },

    },

    'dependencies': {

      setUp: function () {
        this.Model = Backbone.Model.extend({
          properties: {
            fullName: {
              depends: [ 'firstName', 'lastName' ],
              action: function ( name ) {
                if ( name ) {
                  var split = name.split(/\s+/);
                  this.set({
                    firstName: split[0],
                    lastName: split[1]
                  });
                }
                return [
                  this.get( 'firstName' ), this.get( 'lastName' )
                ].join( ' ' );
              }
            }
          }
        });
        this.model = new this.Model({
          firstName: 'Foo',
          lastName: 'Bar'
        });
      },

      'getter': function () {
        assert.equals( this.model.get( 'fullName' ), 'Foo Bar' );
      },

      'setter': function () {
        this.model.set( 'fullName', 'Baz Quux' );
        assert.equals( this.model.get( 'firstName' ), 'Baz' );
        assert.equals( this.model.get( 'lastName' ), 'Quux' );
      }

    }

  });

}( this.buster, this.Backbone ));
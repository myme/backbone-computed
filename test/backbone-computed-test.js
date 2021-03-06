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

      'getter': {

        'returns computed property': function () {
          var model = new Backbone.Model({ a: 10, b: 20 })
            .addProperty( 'aPlusB', function () {
              return this.get( 'a' ) + this.get( 'b' );
            });

          assert.equals( model.get( 'aPlusB' ), 30 );
        },

        'caches computed property value': function () {
          var spy = this.spy( function () {
            return this.get( 'a' ) + this.get( 'b' );
          });

          var model = new Backbone.Model({ a: 10, b: 20 })
            .addProperty( 'aPlusB', spy );

          assert.equals( model.get( 'aPlusB' ), 30 );
          assert.equals( model.get( 'aPlusB' ), 30 );
          assert.calledOnce( spy );
        }

      },

      'setter': {

        setUp: function () {
          this.model = new Backbone.Model()
            .addProperty( 'foo', function ( foo ) {
              if ( arguments.length ) {
                this._foo = foo;
              }
              return this._foo;
            });
        },

        'works': function () {
          assert.same( this.model.set( 'foo', 'bar' ), this.model );
          assert.equals( this.model.get( 'foo' ), 'bar' );
        },

        'handles object notation': function () {
          this.model.set({ foo: 'bar' });
          assert.equals( this.model.get( 'foo' ), 'bar' );
        },

        'fires change event': function () {
          var spy = this.spy();
          this.model.on( 'change:foo', spy ).set( 'foo', 'bar' );
          assert.calledOnceWith( spy, this.model, 'bar' );
        },

        'does not trigger change event if value remains the same': function () {
          var spy = this.spy();
          this.model
            .set( 'foo', 'bar' )
            .on( 'change:foo', spy )
            .set( 'foo', 'bar' );
          refute.called( spy );
        },

        'invalidates computed property cache': function () {
          var spy = this.spy( function () {
            return this.get( 'a' ) + this.get( 'b' );
          });
          var model = new Backbone.Model({ a: 10, b: 20 })
            .addProperty( 'bar', [ 'a', 'b' ], spy );
          assert.equals( model.get( 'bar' ), 30 );
          model.set( 'a', 20 );
          assert.equals( model.get( 'bar' ), 40 );
        }

      }

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
      },

      'change triggers change event': function () {
        var spy = this.spy();
        this.model.on( 'change:fullName', spy ).set( 'firstName', 'Blargh' );
        assert.calledOnceWith( spy, this.model, 'Blargh Bar' );
      },

      '// triggers only event once': function () {
        var spy = this.spy();
        this.model.on( 'change:fullName', spy ).set({
          firstName: 'Foo',
          lastName: 'Bar'
        });
        assert.calledOnceWith( spy, this.model, 'fullName' );
      },

      '// does not trigger "change" event until done': function () {
        var aSpy = this.spy();
        var aPlusBSpy = this.spy();
        var changeSpy = this.spy();

        new Backbone.Model({ a: 10, b: 20 })
          .addProperty( 'aPlusB', function () {
            return this.get( 'a' ) + this.get( 'b' );
          })
          .on( 'change', changeSpy )
          .on( 'change:a', aSpy )
          .on( 'change:aPlusB', aPlusBSpy )
          .set( 'a', 20 );

        assert( aSpy.calledBefore( aPlusBSpy ), 'a listener called before aPlusB' );
        assert( aPlusBSpy.calledBefore( changeSpy ), 'aPlusB listener called before change listener' );
      }

    },

    '.addProperty': {

      'returns self': function () {
        var model = new Backbone.Model();
        assert.same( model.addProperty(), model );
      },

      'adds a new instance computed property': function () {
        var model = new Backbone.Model();
        model.addProperty( 'foo', function () { return 10; });
        assert.equals( model.get( 'foo' ), 10 );
      },

      'adds a new instance computed property with dependencies': function () {
        var spy = this.spy();
        var model = new Backbone.Model()
          .addProperty( 'oof', [ 'foo' ], function () {
            return this.get( 'foo' ).split( '' ).reverse().join( '' );
          })
          .on( 'change:oof', spy )
          .set( 'foo', 'quux' );
        assert.calledWith( spy, model, 'xuuq' );
        assert.equals( model.get( 'oof' ), 'xuuq' );
      },

      'adds property which can be set': function () {
        var model = new Backbone.Model()
          .addProperty( 'foo', function ( foo ) {
            if ( foo ) {
              this._foo = foo;
            }
            return this._foo;
          })
          .set( 'foo', 'bar' );
        assert.equals( model.get( 'foo' ), 'bar' );
      }

    },

    '.addProperty (class method)': {

      'returns class': function () {
        var Model = Backbone.Model.extend();
        assert.same( Model.addProperty(), Model );
      },

      'adds a new class computed property': function () {
        var Model = Backbone.Model.extend();
        Model.addProperty( 'foo', function () { return 10; });
        var model = new Model();
        assert.equals( model.get( 'foo' ), 10 );
      }

    }

  });

}( this.buster, this.Backbone ));

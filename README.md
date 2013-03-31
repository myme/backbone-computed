Backbone Computed Properties
============================

Usage
-----

```javascript
var Model = Backbone.Model.extend({
  properties: {
    time: function () {
      return new Date();
    }
  }
});

var model = new Model();
console.log( model.get( 'time' ) );
```

Insall and run tests:

 npm install && bower install && npm test

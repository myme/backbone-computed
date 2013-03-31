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

Development
-----------

TL;DR `npm install && npm test` or alternatively `npm start` for a `lint > test > watch` cycle.

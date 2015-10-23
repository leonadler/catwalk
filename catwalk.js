/**
* Catwalk.js v0.1.0
* Typed models for AngularJS & Vanilla JavaScript
*
* Copyright 2015 Leon Adler
* Released under the MIT license
* http://opensource.org/licenses/MIT
**/

'use strict';

(function (global, undefined) {
  /** @module catwalk */
  var Catwalk = {};
  if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = Catwalk;
  } else {
    global.Catwalk = Catwalk;
  }

  /**
  * Creates a new model class that uses type-checking and getters/setters.
  * Call only with a name to retrieve a defined model.
  *
  * @constructor
  * @param {string} name - The name of the model
  * @param {object} properties - Properties of the model
  * @param {object} [config] - Configuration options
  * @example
  *   var Book = new Catwalk.Model()
  */
  function Model (name, properties, config) {
    if (!(this instanceof Model)) return new Model(name, properties, config);
    return createModel.call(this, null, name, properties, config);
  }

  Catwalk.Model = Model;

  function createModel (baseClass, name, properties, config) {
    function createInstance (data) {
      // Call constructor of parent class
      if (baseClass) {
        baseClass.apply(this);
      }

      if (this._ === undefined) {
        this._ = {};
      }

      // Use values from the "data" parameter or default values
      Object.keys(attributes).forEach(function (key) {
        var attrib = attributes[key];
        if (data && hasOwn(data, key)) {
          this._[key] = data[key];
        } else if (hasOwn(attrib, 'default')) {
          var defaultValue = attrib.default;
          if (typeof (defaultValue) == 'function') {
            this._[key] = defaultValue();
          } else {
            this._[key] = defaultValue;
          }
        } else if (attrib.readonly) {
          throw new TypeError('attribute ' + key + ' without value');
        } else {
          // If no value is given use "" / 0 / null
          this[key] = defaultForType[attrib.primitiveType];
        }
      }, this);
    }

    // Create a constructor with a "pretty" name for debuggers
    var nameSanitized = (name + '').replace(/[^\w]/g, '_');
    var newClass = new Function('f', 'slice', 'function ' + nameSanitized + '(){' +
      'return f.apply(this,slice(arguments));};return ' + nameSanitized)(createInstance, slice);

    // Create correct prototype chain
    if (baseClass) {
      var FakeBaseConstructor = function () { };
      FakeBaseConstructor.prototype = baseClass.prototype;
      newClass.prototype = new FakeBaseConstructor();
    }

    // Define properties
    var allDescriptors = {};
    var attributes = {};

    Object.keys(properties).forEach(function (key) {
      var property = properties[key];

      // Support shorter syntax with { name: }
      if (property == Boolean || property == String | property == Number || property == RegExp) {
        property = { type: property };
      }

      var type = typeof property;
      if (type == 'object') {

        // Property definition
        var valueType = property.type;
        if (!valueType) {
          throw new TypeError('Property ' + key + ' needs type');
        }

        var primitiveType;
        if (valueType == String) {
          primitiveType = 'string';
        } else if (valueType == Boolean) {
          primitiveType = 'boolean';
        } else if (valueType == Number) {
          primitiveType = 'number';
        } else {
          primitiveType = 'object';
        }

        // Save the primitive type of the expected value for "typeof" comparison
        attributes[key] = property;
        attributes[key].primitiveType = primitiveType;

        // Build property descriptor for Object.defineProperties
        var descriptor = {
          enumerable: true,
          get: function () { return this._[key]; }
        };

        if (typeof property.set == 'function') {
          // Define setter if configured for that property
          descriptor.set = function (value) {
            this._[key] = property.set.call(this, value);
          };
        } else if (!property.readonly) {
          // Or define default setter if the property is not readonly
          descriptor.set = function (value) {
            if (typeof value != primitiveType) {
              throw new TypeError('Wrong type ' + (typeof value) + ' for property ' + key);
            }
            if (primitiveType == 'object' && !(value instanceof valueType)) {
              var msg = 'Wrong type ' + value.prototype.constructor + ' for property ' + key;
              throw new TypeError(msg);
            }
            this._[key] = value;
          };
        }

        allDescriptors[key] = descriptor;

      } else if (type == 'function') {

        // Method definition
        // TODO

      } else {
        throw new TypeError();
      }
    }, this);

    Object.defineProperties(newClass.prototype, allDescriptors);

    // Path models to return expected JSON
    newClass.prototype.toJSON = function () {
      return this._;
    };

    // Patch the prototype chain so created models are "instanceof Catwalk.Model"
    if (this.__proto__ !== undefined) {
      newClass.__proto__ = this.__proto__;
    }

    return newClass;
  }

  /// Helper functions & objects
  var slice = Function.prototype.call.bind(Array.prototype.slice);
  var hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
  var defaultForType = {
    boolean: false,
    number: 0,
    string: '',
    object: null
  };

}(this));

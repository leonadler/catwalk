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
  Catwalk.Model.define = function (name, properties, config) {
    return createModel.call(this, null, name, properties, config);
  };
  Catwalk.Model.extend = createModel;

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
    var NewClass = new Function('f', 'slice', 'function ' + nameSanitized + '(){' +
      'return f.apply(this,slice(arguments));};return ' + nameSanitized)(createInstance, slice);

    // Create correct prototype chain
    if (baseClass) {
      var FakeBaseConstructor = function () { };
      FakeBaseConstructor.prototype = baseClass.prototype;
      NewClass.prototype = new FakeBaseConstructor();
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

        var setter = buildSetter(key, property);
        if (setter) {
          descriptor.set = setter;
        }

        allDescriptors[key] = descriptor;

      } else if (type == 'function') {

        // Method definition
        allDescriptors[key] = {
          value: property,
          writable: false,
          configurable: true
        };

      } else {
        throw new TypeError();
      }
    }, this);

    Object.defineProperties(NewClass.prototype, allDescriptors);

    // Patch models to return expected JSON
    if (!hasOwn(properties, 'toJSON')) {
      NewClass.prototype.toJSON = function () {
        return this._;
      };
    }

    // Patch the prototype chain so created models are "instanceof Catwalk.Model"
    if (this.__proto__ !== undefined) {
      NewClass.__proto__ = this.__proto__;
    }

    // Add a shortcut to `Model.extend()`
    NewClass.extendAs = function (name, properties, config) {
      createModel.call(this, NewClass, name, properties, config);
    };

    // Add a static method `ModelClass.create` that equals to `new ModelClass`
    NewClass.create = function (data) {
      return new NewClass(data);
    };

    // TODO: Fix references to other models, including references to this model

    return NewClass;
  }

  /// Helper functions & objects
  var slice = Function.prototype.call.bind(Array.prototype.slice);
  var hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

  /**
  * Defaults for a specific primitiveType
  */
  var defaultForType = {
    boolean: false,
    number: 0,
    string: '',
    object: null
  };

  /**
  * Default patterns for property.format validation
  */
  var knownFormats = {
    alphanumeric: /^[0-9A-Za-z]+$/,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    date: /^(?:19|20)\d\d-(?:1[012]|0[1-9])-(?:0[1-9]|[12]\d|3[01])$/,
    datetime: /^(?:19|20)\d\d-(?:1[012]|0[1-9])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d{1,3})?Z$/,
    numeric: /^[0-9]+$/,
    phonenumber: /^\+?[0-9]+([ -]?\d+)*$/,
    time: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    week: /^(?:19|20)\d\d-W(?:0[1-9]|[1-4]\d|5[0-3])$/,
    year: /^(?:19|20)\d\d$/
  };

  /**
  * Builds a property setter from a property hash.
  *
  * @param {object} property - Object describing the property type & validations
  * @param {string} property.type - type/"class" of the property
  * @param {string} property.primitiveType - "typeof-type" of the property
  * @returns {null|function} - A setter to define on the prototype, null for readonly properties
  */
  function buildSetter (name, property) {
    if (typeof property.set == 'function') {
      // If a setter is defined in the property hash just forward to it
      return function (value) {
        this._[name] = property.set.call(this, value);
      };
    }

    if (property.readonly) {
      return null;
    }

    // Define a setter based on the property hash which validates the input value
    var validations = buildValidations(name, property);
    if (!validations) {
      return function slackedSetter (value) {
        this._[name] = value;
      };
    }

    return function validatingSetter (value) {
      for (var i = 0; i < validations.length; i++) {
        if (!validations[i](value)) {
          throw new TypeError('Invalid value ' + value + ' for property ' + name);
        }
      }
      this._[name] = value;
    };
  }

  /**
  * Builds validation handlers based on a property hash.
  *
  * @param {object} property - Property hash with primitiveType
  * @param {string} property.type - type/"class" of the property
  * @param {string} property.primitiveType - "typeof-type" of the property
  * @returns {null|function} - An array of validation functions that return true for valid
  */
  function buildValidations (name, property) {
    var primitiveType = property.primitiveType;
    var validations = [];
    if (property.type == RegExp) {
      validations.push(function (value) {
        return typeof value == 'string' || (typeof value == 'object' && value instanceof RegExp);
      });
    } else if (primitiveType != 'object') {
      validations.push(function (value) {
        return typeof value === primitiveType;
      });
    } else if (property.nullable) {
      validations.push(function (value) {
        return value === null || (typeof value == 'object' && value instanceof property.type);
      });
    } else {
      validations.push(function (value) {
        return typeof value == 'object' && value instanceof property.type;
      });
    }

    if (primitiveType == 'number') {
      if (property.min) {
        validations.push(function (value) {
          return value >= property.min;
        });
      }
      if (property.max) {
        validations.push(function (value) {
          return value <= property.max;
        });
      }
    } else if (primitiveType == 'string') {
      if (typeof property.minLength == 'number') {
        validations.push(function (value) {
          return value.length >= property.minLength;
        });
      }
      if (typeof property.maxLength == 'number') {
        validations.push(function (value) {
          return value.length <= property.maxLength;
        });
      }
      if (property.format !== undefined) {
        if (!hasOwn(knownFormats, property.format)) {
          throw new Error('Unknown format "' + format + '"');
        }
        var format = knownFormats[property.format];
        validations.push(function (value) {
          return format.test(value);
        });
      }
      if (property.match !== undefined) {
        var regex = property.match;
        if (typeof regex == 'string') {
          try {
            regex = regExpFromSource(regex);
          } catch (ex) {
            throw new Error('Invalid regular expression ' + regex + ' for property ' + name);
          }
        } else if (typeof regex != 'object' || !(regex instanceof RegExp)) {
          throw new TypeError('Invalid value for "format" on property ' + name);
        }

        validations.push(function (value) {
          return regex.test(value);
        });
      }
    }

    return validations;
  }

  /**
  * Build a RegExp object from a string
  *
  * @param {string} source - Text representation of the RegExp, with flags
  * @returns {RegExp} - RegExp object with flags from source parameter
  * @example
  * regExpFromSource('/[a-z]+/i')
  * -> RegExp, /[a-z]+/i
  */
  function regExpFromSource (source) {
    var match = source.match(/^\/(.*)\/([gimy])*$/);
    if (!match) return /(?:)/;
    return new RegExp(match[1], match[2]);
  }

}(this));

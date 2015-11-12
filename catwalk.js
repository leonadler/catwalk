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
  Model.define = function defineModel (name, properties, config) {
    return createModel.call(this, null, name, properties, config);
  };
  Model.extend = createModel;

  function createModel (baseClass, name, properties, config) {
    function createInstance (data) {
      // Ensure type of parameter
      if (data !== undefined && typeof data != 'object') {
        throw new TypeError('First parameter must be an object hash');
      }

      // Call constructor of parent class
      if (baseClass) {
        Function.prototype.apply.call(baseClass, this, slice(arguments));
      }

      if (this._ === undefined) {
        Object.defineProperty(this, '_', { value: {} });
      }
      Object.defineProperty(this, '_model', { value: NewClass, configurable: true });

      // Use values from the "data" parameter or default values
      Object.keys(attributes).forEach(function (key) {
        var attrib = attributes[key];
        var value;
        if (data && hasOwn(data, key)) {
          value = data[key];
        } else if (hasOwn(attrib, 'default')) {
          var defaultValue = attrib.default;
          if (typeof (defaultValue) == 'function') {
            value = defaultValue();
          } else {
            value = defaultValue;
          }
        } else if (attrib.readonly) {
          throw new Error('Attribute ' + key + ' without value');
        } else {
          // If no value is given use "" / 0 / null
          value = defaultForType[attrib.primitiveType];
        }
        if (!NewClass.isValidFor(key, value)) {
          throw new Error('Invalid value ' + value + ' for attribute ' + name);
        }
        this._[key] = value;
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

      // Support shorter syntax with { name: String|Boolean|etc }
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
        attributes[key].validators = buildValidators(name, property);

        // Build property descriptor for Object.defineProperties
        var descriptor = {
          enumerable: true,
          get: function get () { return this._[key]; }
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

    // Patch models to return expected JSON
    if (!hasOwn(properties, 'toJSON')) {
      allDescriptors.toJSON = {
        value: function toJSON () {
          return this._;
        },
        writable: false,
        enumerable: false,
        configurable: false
      };
    }

    Object.defineProperties(NewClass.prototype, allDescriptors);

    // Patch the prototype chain so created models are "instanceof Catwalk.Model"
    if (this.__proto__ !== undefined) {
      NewClass.__proto__ = this.__proto__;
    }

    /**
    * Create a subclass of the model
    * @see ModelClass.extend
    */
    NewClass.extendAs = function extendAs (name, properties, config) {
      return createModel.call(this, NewClass, name, properties, config);
    };

    /**
    * Create a new instance of the model class
    * @param {object} data - Hash of initial attribute values
    * @returns {object} - New model instance
    * @see new ModelClass
    */
    NewClass.create = function create (data) {
      return new NewClass(data);
    };

    /**
    * Create a new instance of the model class from a JSON string or object
    * while correctly instanciating model attributes.
    * @param {string|object} json - String to create the instance from
    * @returns {object} - New instance of the model class
    */
    NewClass.fromJSON = function fromJSON (json) {
      var hash = typeof json == 'object' ? json : JSON.parse(json);
      Object.keys(attributes).forEach(function (name) {
        var attrib = attributes[name];
        if (attrib.primitiveType == 'object' && typeof attrib.type.fromJSON == 'function') {
          // Create a new submodel instance
          hash[name] = attrib.type.fromJSON(hash[name]);
        } else if (!NewClass.isValidFor(name, hash[name])) {
          throw new TypeError('Invalid value ' + value + ' for property ' + name);
        }
      });
      return new (this)(hash);
    };

    // Define a list of attributes this model has
    var attributeNames;
    if (baseClass && (baseClass instanceof Model)) {
      attributeNames = baseClass.attributeNames.concat(Object.keys(attributes));
    } else {
      attributeNames = Object.keys(attributes);
    }
    Object.defineProperty(NewClass, 'attributeNames', {
      value: attributeNames,
      writable: false,
      enumerable: true,
      configurable: false
    });

    /**
    * Returns whether a named attribute is defined on this model class
    * @param {string} propname - Name of the attribute to check
    * @returns {boolean} - True if the attribute exists
    */
    NewClass.hasAttribute = function hasAttribute (propname) {
      return hasOwn(attributes, propname);
    };

    /**
    * Returns whether or not an attribute is readonly
    * @param {string} propname - Name of the attribute to check
    * @returns {boolean} - True if the attribute is readonly
    */
    NewClass.isReadonly = function isReadonly (propname) {
      if (!hasOwn(attributes, propname)) return false;
      return !!properties[propname].readonly;
    };

    /**
    * Validates a value for a model attribute
    * @param {string} propname - Name of the attribute to validate for
    * @param {*} value - Value to validate
    * @returns {boolean} - true if valid, false if invalid
    */
    NewClass.isValidFor = function isValidFor (propname, value) {
      if (!hasOwn(attributes, propname)) return false;
      if (!attributes[propname].validators) return true;
      var isValid = true;
      attributes[propname].validators.forEach(function (validator) {
        if (!validator(value)) return (isValid = false);
      });
      return isValid;
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
      return function redirectingSetter (value) {
        this._[name] = property.set.call(this, value);
      };
    }

    if (property.readonly) {
      return null;
    }

    // Define a setter based on the property hash which validates the input value
    var validators = property.validators;
    if (!validators) {
      return function slackedSetter (value) {
        this._[name] = value;
      };
    }

    return function validatingSetter (value) {
      for (var i = 0; i < validators.length; i++) {
        if (!validators[i](value)) {
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
  function buildValidators (name, property) {
    var primitiveType = property.primitiveType;
    var validations = [];
    if (property.type == RegExp) {
      validations.push(function validateRegExpType (value) {
        return typeof value == 'string' || (typeof value == 'object' && value instanceof RegExp);
      });
    } else if (primitiveType != 'object') {
      validations.push(function validatePrimitiveType (value) {
        return typeof value === primitiveType;
      });
    } else if (property.nullable) {
      validations.push(function validateNullableObjectType (value) {
        return value === null || (typeof value == 'object' && value instanceof property.type);
      });
    } else {
      validations.push(function validateObjectType (value) {
        return typeof value == 'object' && value instanceof property.type;
      });
    }

    if (primitiveType == 'number') {
      if (property.min) {
        validations.push(function validateMin (value) {
          return value >= property.min;
        });
      }
      if (property.max) {
        validations.push(function validateMax (value) {
          return value <= property.max;
        });
      }
    } else if (primitiveType == 'string') {
      if (typeof property.minLength == 'number') {
        validations.push(function validateMinLength (value) {
          return value.length >= property.minLength;
        });
      }
      if (typeof property.maxLength == 'number') {
        validations.push(function validateMaxLength (value) {
          return value.length <= property.maxLength;
        });
      }
      if (property.format !== undefined) {
        if (!hasOwn(knownFormats, property.format)) {
          throw new Error('Unknown format "' + format + '"');
        }
        var format = knownFormats[property.format];
        validations.push(function validateFormat (value) {
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

        validations.push(function validateMatch (value) {
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

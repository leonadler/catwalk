/**
* Catwalk.js v0.1.0
* Typed models for AngularJS & Vanilla JavaScript
*
* Copyright 2015 Leon Adler
* Released under the MIT license
* http://opensource.org/licenses/MIT
**/

'use strict';

(function (factory, global) {
  if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = factory();
  } else {
    global.Catwalk = factory();
  }
}(function factory () {

  var Catwalk = function () { };
  return Catwalk;

}, this));

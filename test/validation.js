var expect = require('chai').expect;
var Catwalk = require('../catwalk');

describe('Catwalk.Model', function () {
  describe('value validation', function () {

    it('limits numeric values with "min" and "max"', function () {
      var TaxPayer = new Catwalk.Model('TaxPayer', {
        age: { type: Number, min: 18, max: 85 }
      });

      var adult = new TaxPayer();
      expect(function () { adult.age = 5; }).to.throw();
      expect(function () { adult.age = 120; }).to.throw();
    });

    it('limits string values with "minLength" and "maxLength"', function () {
      var Person = new Catwalk.Model('Person', {
        name: { type: String, minLength: 3, maxLength: 12 }
      });

      var human = new Person({ name: 'John Doe' });

      expect(function () {
        human.name = '-';
      }).to.throw();

      expect(function () {
        human.name = '-';
      }).to.throw();

      expect(new Person()).to.be.instanceOf(Model);
    });


  });
});

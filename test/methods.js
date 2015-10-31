var expect = require('chai').expect;
var Catwalk = require('../catwalk');

describe('Catwalk.Model methods', function () {

  it('must be defined on the prototype', function () {
    var Human = new Catwalk.Model('Human', {
      age: Number,
      birthday: function () { this.age = this.age + 1; }
    });

    expect(Human.prototype).to.have.ownProperty('birthday');
  });

  it('must be defined exactly like in the property description', function () {
    var birthdayMethod = function () { this.age = this.age + 1; };
    var Human = new Catwalk.Model('Human', {
      age: Number,
      birthday: birthdayMethod
    });

    expect(Human.prototype.birthday)
      .to.be.a('function')
      .and.be.equal(birthdayMethod);

    var daughter = new Human({ age: 7 });
    expect(daughter.age).to.be.equal(7);
    expect(function () { daughter.birthday(); }).not.to.throw();
    expect(daughter.age).to.be.equal(8);
  });

});

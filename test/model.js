var expect = require('chai').expect;
var Catwalk = require('../catwalk');

describe('Catwalk.Model', function () {

  it('Catwalk.Model exists', function () {
    expect(Catwalk).itself.to.respondTo('Model');
  });

  it('should create properties on the prototype', function () {
    var Human = new Catwalk.Model('Human', {
      name: { type: String },
      alive: { type: Boolean }
    });

    expect(Human).to.have.property('prototype');
    expect(Human.prototype)
      .to.have.ownProperty('name')
      .and.to.have.ownProperty('alive');
  });

  it('created classes should be a Catwalk.Model', function () {
    var Person = new Catwalk.Model('Person', {
      firstName: { type: String },
      lastName: { type: String }
    });

    expect(Person).to.be.an.instanceOf(Catwalk.Model);
  });

  it('should set up a proper prototype chain', function () {
    var Model = new Catwalk.Model('Model2', {
      name: { type: String }
    });

    expect(new Model()).to.be.an.instanceOf(Model);
  });

});

var expect = require('chai').expect;
var Catwalk = require('../catwalk');

describe('Catwalk.Model self-description', function () {

  var PersonModel;

  before(function () {
    PersonModel = new Catwalk.Model('Person', {
      id: { type: Number, readonly: true },
      firstName: String,
      lastName: String,
      age: Number,
      male: Boolean
    });
  });

  it('describes its own properties via ModelClass.propertyNames', function () {
    expect(PersonModel.attributeNames)
    .to.be.an('array')
    .and.to.deep.equal(['id', 'firstName', 'lastName', 'age', 'male']);
  });

  it('defines a hasProperty method that tells whether or not a property exists', function () {
    expect(PersonModel).itself.to.respondTo('hasAttribute');
    expect(PersonModel.hasAttribute('id')).to.be.true;
    expect(PersonModel.hasAttribute('firstName')).to.be.true;
    expect(PersonModel.hasAttribute('lastName')).to.be.true;
    expect(PersonModel.hasAttribute('age')).to.be.true;
    expect(PersonModel.hasAttribute('male')).to.be.true;
    expect(PersonModel.hasAttribute('Age')).to.be.false;
    expect(PersonModel.hasAttribute('email')).to.be.false;
    expect(PersonModel.hasAttribute('toString')).to.be.false;
    expect(PersonModel.hasAttribute('toJSON')).to.be.false;
  });

  it('defines an isReadonly method that tells if a property is readonly', function () {
    expect(PersonModel).itself.to.respondTo('isReadonly');
    expect(PersonModel.isReadonly('id')).to.be.true;
    expect(PersonModel.isReadonly('age')).to.be.false;
    expect(PersonModel.isReadonly('notexisting')).to.be.false;
  });

  it('defines an isValidFor method that validates a value', function () {
    expect(PersonModel).itself.to.respondTo('isValidFor');
    expect(PersonModel.isValidFor('id', 55)).to.be.true;
    expect(PersonModel.isValidFor('invalidProp', 1)).to.be.false;
    expect(PersonModel.isValidFor('firstName', 'John')).to.be.true;
    expect(PersonModel.isValidFor('firstName', true)).to.be.false;
    expect(PersonModel.isValidFor('lastName', 'Doe')).to.be.true;
    expect(PersonModel.isValidFor('lastName', null)).to.be.false;
    expect(PersonModel.isValidFor('male', true)).to.be.true;
    expect(PersonModel.isValidFor('male', false)).to.be.true;
    expect(PersonModel.isValidFor('male', 'female')).to.be.false;
    expect(PersonModel.isValidFor('', 0)).to.be.false;
    expect(PersonModel.isValidFor.bind(PersonModel, 5)).to.throw;
  });

});

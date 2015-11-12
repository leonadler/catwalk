var expect = require('chai').expect;
var Catwalk = require('../catwalk');

describe('Catwalk.Model json serialization', function () {

  it('serializes to JSON with JSON.stringify', function () {
    var Dog = new Catwalk.Model('Dog', {
      name: String
    });
    var lassie = new Dog({ name: 'Lassie' });

    expect(JSON.stringify(lassie)).to.be.equal('{"name":"Lassie"}');
  });

  it('defines a fromJSON method on the model class', function () {
    var Mountain = Catwalk.Model('Mountain', {
      height: Number
    });
    expect(Mountain).to.have.ownProperty('fromJSON');
    expect(Mountain.fromJSON).to.be.a('function');
  });

  it('serializes from JSON correctly with ModelClass.fromJSON', function () {
    var Car = new Catwalk.Model('Car', {
      brand: String,
      yearOfManufacture: { type: Number, min: 1920, max: 2050 }
    });

    var impala;
    expect(function () {
      impala = Car.fromJSON('{"brand":"Chevrolet","yearOfManufacture":1964}');
    }).not.to.throw();

    expect(impala.brand).to.be.equal('Chevrolet');
    expect(impala.yearOfManufacture).to.be.equal(1964);
  });

  it('throws when serializing from invalid JSON', function () {
    var Pet = new Catwalk.Model('Pet', {
      name: String
    });

    expect(function () {
      var myPet = Pet.fromJSON('invalid json');
    }).to.throw();

    expect(function () {
      var myPet = Pet.fromJSON('{name:"invalid json"}');
    }).to.throw();

    expect(function () {
      var myPet = Pet.fromJSON('{"name":false}');
    }).to.throw();
  });

  it('copies the toJSON method if one is provided', function () {
    var myToJSONMethod = function () { return this.departureDate.toISOString(); };
    var PlaneTicket = new Catwalk.Model('PlaneTicket', {
      departureDate: Date,
      toJSON: myToJSONMethod
    });

    expect(PlaneTicket.prototype).to.have.ownProperty('toJSON');
    expect(PlaneTicket.prototype.toJSON).to.be.equal(myToJSONMethod);
    var ticket = new PlaneTicket({ departureDate: new Date() });
    expect(ticket.toJSON).to.be.equal(myToJSONMethod);
  });

});

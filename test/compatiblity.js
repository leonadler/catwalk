var expect = require('chai').expect;
var Catwalk = require('../catwalk');

describe('Catwalk.Model compatibility', function () {

  it('provides `Model.define` for environments that can\'t use `new Model`', function () {
    expect(Catwalk.Model).itself.to.respondTo('define');
    var Model1 = new Catwalk.Model('Toy', { brand: String });
    var Model2 = Catwalk.Model.define('Toy', { brand: String });
    var toy1 = new Model1({ brand: 'ToyBrand' });
    var toy2 = new Model2({ brand: 'ToyBrand' });

    expect(JSON.stringify(toy1)).to.be.equal(JSON.stringify(toy2));
  });

  it('provides `ModelClass.create` that equals `new ModelClass()`', function () {
    var CarModel1 = new Catwalk.Model('Car', {
      brand: String,
      wheels: { type: Number, default: 2 }
    });
    var CarModel2 = new Catwalk.Model('Car', {
      brand: String,
      wheels: { type: Number, default: 2 }
    });

    expect(CarModel1).itself.to.respondTo('create');
    expect(CarModel2).itself.to.respondTo('create');

    var carA = new CarModel1({ type: 'Roadster MonsterTruck', wheels: 8 });
    var carB = CarModel2.create({ type: 'Roadster MonsterTruck', wheels: 8 });

    expect(JSON.stringify(carA)).to.be.equal(JSON.stringify(carB));
  });

});

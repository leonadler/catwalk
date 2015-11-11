var expect = require('chai').expect;
var Catwalk = require('../catwalk');

describe('Catwalk.Model value validation', function () {

  it('limits numeric values with "min" and "max"', function () {
    var TaxPayer = new Catwalk.Model('TaxPayer', {
      age: { type: Number, min: 18, max: 85 }
    });

    var adult;
    expect(function () { adult = new TaxPayer({ age: 14 }); }).to.throw();
    expect(function () { adult = new TaxPayer({ age: 20 }); }).not.to.throw();
    expect(function () { adult.age = 5; }).to.throw();
    expect(function () { adult.age = 120; }).to.throw();
    expect(function () { adult.age = 85; }).not.to.throw();
  });

  it('limits string values with "minLength" and "maxLength"', function () {
    var Person = new Catwalk.Model('Person', {
      name: { type: String, minLength: 3, maxLength: 12 }
    });

    var human;
    expect(function () { human = new Person({ name: '-' }); }).to.throw();
    expect(function () { human = new Person({ name: 'John Doe' }); }).not.to.throw();

    expect(function () { human.name = '-'; }).to.throw();
    expect(function () { human.name = 'Name with 23 characters'; }).to.throw();
    expect(function () { human.name = 'Valid name'; }).not.to.throw();
  });

  it('matches string values against a RegExp with "match"', function () {
    var Book = new Catwalk.Model('Book', {
      isbn: {
        type: String,
        match: '/^(97[89])?\\d{9}-?\\d$/'
      }
    });

    var gatsby;
    expect(function () { gatsby = new Book({ isbn: 'invalid' }); }).to.throw();
    expect(function () { gatsby = new Book({ isbn: '9781597226769' }); }).not.to.throw();

    expect(function () { gatsby.isbn = '-'; }).to.throw();
    expect(function () { gatsby.isbn = '97815972267-69'; }).to.throw();
    expect(function () { gatsby.isbn = '978X597226769'; }).to.throw();
    expect(function () { gatsby.isbn = '9481597226769'; }).to.throw();
    expect(function () { gatsby.isbn = '5555555555555'; }).to.throw();

    expect(function () { gatsby.isbn = '5555555555'; }).not.to.throw();
    expect(function () { gatsby.isbn = '978159722676-9'; }).not.to.throw();
    expect(function () { gatsby.isbn = '9781935548201'; }).not.to.throw();
    expect(function () { gatsby.isbn = '9787543628588'; }).not.to.throw();
    expect(function () { gatsby.isbn = '0749318529'; }).not.to.throw();
    expect(function () { gatsby.isbn = '142707031-9'; }).not.to.throw();
  });

  it('matches string values against known formats', function () {
    it('alphanumeric', function () {
      var Model = new Catwalk.Model('Model', {
        name: { type: String, format: 'alphanumeric' }
      });
      expect(function () { new Model({ name: 'Abc123' }); }).not.to.throw();
      expect(function () { new Model({ name: '0123' }); }).not.to.throw();
      expect(function () { new Model({ name: 'Ab Cd' }); }).to.throw();
      expect(function () { new Model({ name: 'Wx_Yz' }); }).to.throw();
    });

    it('email', function () {
      var User = new Catwalk.Model('User', {
        email: { type: String, format: 'email' }
      });
      expect(function () { new User({ email: 'user@mail.com' }); }).not.to.throw();
      expect(function () { new User({ email: 'user@mail' }); }).to.throw();
      expect(function () { new User({ email: '@mail.com' }); }).to.throw();
      expect(function () { new User({ email: 'gibberish' }); }).to.throw();
      expect(function () { new User({ email: '151231@2415152.151' }); }).to.throw();
      expect(function () { new User({ email: 'too many special cases' }); }).to.throw();
    });

    it('numeric', function () {
      var Model = new Catwalk.Model('Model', {
        id: { type: String, format: 'numeric' }
      });
      expect(function () { new Model({ id: '51247' }); }).not.to.throw();
      expect(function () { new Model({ id: '01234' }); }).not.to.throw();
      expect(function () { new Model({ id: 'ABC' }); }).to.throw();
    });
  });

});

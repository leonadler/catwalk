var expect = require('chai').expect;
var Catwalk = require('../catwalk');

describe('Catwalk.Model value validation', function () {

  it('limits numeric values with "min" and "max"', function () {
    var TaxPayer = new Catwalk.Model('TaxPayer', {
      age: { type: Number, min: 18, max: 85 }
    });

    var adult;
    expect(function () { adult = new TaxPayer({ age: 20 }); }).not.to.throw();
    expect(function () { adult.age = 5; }).to.throw();
    expect(function () { adult.age = 120; }).to.throw();
    expect(function () { adult.age = 85; }).not.to.throw();
  });

  it('limits string values with "minLength" and "maxLength"', function () {
    var Person = new Catwalk.Model('Person', {
      name: { type: String, minLength: 3, maxLength: 12 }
    });

    var human = new Person({ name: 'John Doe' });

    expect(function () { human.name = '-'; }).to.throw();
    expect(function () { human.name = 'Name with 23 characters'; }).to.throw();
    expect(function () { human.name = 'Valid name'; }).not.to.throw();
  });

  it('tests pattern matching of string values with "matches"', function () {
    var Book = new Catwalk.Model('Book', {
      isbn: {
        type: String,
        matches: '/^(97[89])?\\d{9}-?\\d$/'
      }
    });

    var gatsby = new Book({ isbn: '9781597226769' });

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

});

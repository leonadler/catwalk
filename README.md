# Catwalk

## Typed models for AngularJS & Vanilla JavaScript

Create model classes with type-checking and value validation for AngularJS,
vanilla JavaScript or any other MVx framework you like.

## Catwalk by example

### Creating a model - `Catwalk.Model(name, attributes[, settings])`

```javascript
var Customer = new Catwalk.Model("Customer", {
  id: {
    type: String,
    readonly: true,
    default: createUniqueID
  },
  companyName: {
    type: String
    minLenght: 3,
    maxLength: 255
  },
  contactName: {
    type: String,
    minLenght: 3
  },
  contactTitle: { type: String },
  city: { type: String }
});
```

### Creating instances

```javascript
var customer1 = new Customer({
  companyName: "Google Inc.",
  contactName: "Larry Page",
  contactTitle: "MSc",
  city: "Mountain View, CA"
});
```
```javascript
var customer2 = Customer.create({
  companyName: "Microsoft Corporation",
  contactName: "Bill Gates",
  city: "Redmond, WA"
});
```

### Automatic validation

```javascript
customer1.companyName = 7;
=> TypeError

customer1.city = null;
=> TypeError

customer1.contactName = "X";
=> ValidationError

customer1.id = "Invalid";
=> TypeError (no setter)
```

### Serializes correctly

```javascript
JSON.stringify(customer2)
=> {"companyName":"Microsoft","contactName":"Bill Gates","city":"Redmond, WA"}
```

```javascript
var LogEvent = new Catwalk.Model("LogEvent", {
  eventDate: { type: Date },
  matched: { type: RegExp },
  message: { type: String }
});

var json = '{"eventDate":"2015-10-22T15:41:14.281Z","matched":"/(stopped|started)/i","message":"Service started"}';
LogEvent.fromJSON(json);
=> LogEvent {
  eventDate: Date(/* the date represented */),
  matched: /(stopped|started)/i,
  message: "Service started."
}
```

## Testing

```sh
$ npm install
$ npm test
```

## License

MIT License

const nonUSFormatTests = [
  { test: '1', expectedInt: '1', expectedDec: undefined },
  { test: '12', expectedInt: '12', expectedDec: undefined },
  { test: '123', expectedInt: '123', expectedDec: undefined },
  { test: '123.', expectedInt: '123.', expectedDec: undefined },
  { test: '123.4', expectedInt: '123.4', expectedDec: undefined },
  { test: '123.45', expectedInt: '123.45', expectedDec: undefined },
  { test: '123.456', expectedInt: '123.456', expectedDec: undefined },
  { test: '123.456.', expectedInt: '123.456.', expectedDec: undefined },
  { test: '123.456.7', expectedInt: '123.456.7', expectedDec: undefined },
  { test: '123.456.78', expectedInt: '123.456.78', expectedDec: undefined },
  { test: '123.456.789', expectedInt: '123.456.789', expectedDec: undefined },
  { test: '123.456.789,', expectedInt: '123.456.789', expectedDec: ',' },
  { test: '123.456.789,9', expectedInt: '123.456.789', expectedDec: ',9' },
  { test: '123.456.789,98', expectedInt: '123.456.789', expectedDec: ',98' },
  { test: '123.456.789,987', expectedInt: '123.456.789', expectedDec: ',98' },
  { test: '1,', expectedInt: '1', expectedDec: ',' },
  { test: '1,1', expectedInt: '1', expectedDec: ',1' },
  { test: '1,12', expectedInt: '1', expectedDec: ',12' },
  { test: '1,123', expectedInt: '1', expectedDec: ',12' },
  { test: '12,1', expectedInt: '12', expectedDec: ',1' },
  { test: '12,12', expectedInt: '12', expectedDec: ',12' },
  { test: '12,123', expectedInt: '12', expectedDec: ',12' },
  { test: '123,1', expectedInt: '123', expectedDec: ',1' },
  { test: '123,12', expectedInt: '123', expectedDec: ',12' },
  { test: '123,123', expectedInt: '123', expectedDec: ',12' },
  { test: '1234,1', expectedInt: '1234', expectedDec: ',1' },
  { test: '1234,12', expectedInt: '1234', expectedDec: ',12' },
  { test: '1234,123', expectedInt: '1234', expectedDec: ',12' },
  { test: '12345,1', expectedInt: '12345', expectedDec: ',1' },
  { test: '12345,12', expectedInt: '12345', expectedDec: ',12' },
  { test: '12345,123', expectedInt: '12345', expectedDec: ',12' },
  { test: '123456,1', expectedInt: '123456', expectedDec: ',1' },
  { test: '123456,12', expectedInt: '123456', expectedDec: ',12' },
  { test: '123456,123', expectedInt: '123456', expectedDec: ',12' },
  { test: '1234567,1', expectedInt: '1234567', expectedDec: ',1' },
  { test: '1234567,12', expectedInt: '1234567', expectedDec: ',12' },
  { test: '1234567,123', expectedInt: '1234567', expectedDec: ',12' },
  { test: '12345678,1', expectedInt: '12345678', expectedDec: ',1' },
  { test: '12345678,12', expectedInt: '12345678', expectedDec: ',12' },
  { test: '12345678,123', expectedInt: '12345678', expectedDec: ',12' },
  { test: '123456789,1', expectedInt: '123456789', expectedDec: ',1' },
  { test: '123456789,12', expectedInt: '123456789', expectedDec: ',12' },
  { test: '123456789,123', expectedInt: '123456789', expectedDec: ',12' },
  { test: '1234567890,1', expectedInt: '1234567890', expectedDec: ',1' },
  { test: '1234567890,12', expectedInt: '1234567890', expectedDec: ',12' },
  { test: '1234567890,123', expectedInt: '1234567890', expectedDec: ',12' },
  { test: '1.,1', expectedInt: '1.', expectedDec: ',1' },
  { test: '1.,12', expectedInt: '1.', expectedDec: ',12' },
  { test: '1.,123', expectedInt: '1.', expectedDec: ',12' },
  { test: '1.2,1', expectedInt: '1.2', expectedDec: ',1' },
  { test: '1.2,12', expectedInt: '1.2', expectedDec: ',12' },
  { test: '1.2,123', expectedInt: '1.2', expectedDec: ',12' },
  { test: '12.3,1', expectedInt: '12.3', expectedDec: ',1' },
  { test: '12.3,12', expectedInt: '12.3', expectedDec: ',12' },
  { test: '12.3,123', expectedInt: '12.3', expectedDec: ',12' },
  { test: '123.4,1', expectedInt: '123.4', expectedDec: ',1' },
  { test: '123.4,12', expectedInt: '123.4', expectedDec: ',12' },
  { test: '123.4,123', expectedInt: '123.4', expectedDec: ',12' },
  { test: '1.2345,1', expectedInt: '1.2345', expectedDec: ',1' },
  { test: '1.2345,12', expectedInt: '1.2345', expectedDec: ',12' },
  { test: '1.2345,123', expectedInt: '1.2345', expectedDec: ',12' },
  { test: '12345.6,1', expectedInt: '12345.6', expectedDec: ',1' },
  { test: '1.23.456,12', expectedInt: '1.23.456', expectedDec: ',12' },
  { test: '12.3.456,123', expectedInt: '12.3.456', expectedDec: ',12' },
  {
    test: '1.......12..212.,1',
    expectedInt: '1.......12..212.',
    expectedDec: ',1',
  },
  {
    test: '1.......12..212.,,21',
    expectedInt: '1.......12..212.',
    expectedDec: ',,21',
  },
]
const USFormatTests = [
  { test: '1', expectedInt: '1', expectedDec: undefined },
  { test: '12', expectedInt: '12', expectedDec: undefined },
  { test: '123', expectedInt: '123', expectedDec: undefined },
  { test: '123,', expectedInt: '123,', expectedDec: undefined },
  { test: '123,4', expectedInt: '123,4', expectedDec: undefined },
  { test: '123,45', expectedInt: '123,45', expectedDec: undefined },
  { test: '123,456', expectedInt: '123,456', expectedDec: undefined },
  { test: '123,456,', expectedInt: '123,456,', expectedDec: undefined },
  { test: '123,456,7', expectedInt: '123,456,7', expectedDec: undefined },
  { test: '123,456,78', expectedInt: '123,456,78', expectedDec: undefined },
  { test: '123,456,789', expectedInt: '123,456,789', expectedDec: undefined },
  { test: '123,456,789.', expectedInt: '123,456,789', expectedDec: '.' },
  { test: '123,456,789.9', expectedInt: '123,456,789', expectedDec: '.9' },
  { test: '123,456,789.98', expectedInt: '123,456,789', expectedDec: '.98' },
  { test: '123,456,789.987', expectedInt: '123,456,789', expectedDec: '.98' },
  { test: '1.', expectedInt: '1', expectedDec: '.' },
  { test: '1.1', expectedInt: '1', expectedDec: '.1' },
  { test: '1.12', expectedInt: '1', expectedDec: '.12' },
  { test: '1.123', expectedInt: '1', expectedDec: '.12' },
  { test: '12.1', expectedInt: '12', expectedDec: '.1' },
  { test: '12.12', expectedInt: '12', expectedDec: '.12' },
  { test: '12.123', expectedInt: '12', expectedDec: '.12' },
  { test: '123.1', expectedInt: '123', expectedDec: '.1' },
  { test: '123.12', expectedInt: '123', expectedDec: '.12' },
  { test: '123.123', expectedInt: '123', expectedDec: '.12' },
  { test: '1234.1', expectedInt: '1234', expectedDec: '.1' },
  { test: '1234.12', expectedInt: '1234', expectedDec: '.12' },
  { test: '1234.123', expectedInt: '1234', expectedDec: '.12' },
  { test: '12345.1', expectedInt: '12345', expectedDec: '.1' },
  { test: '12345.12', expectedInt: '12345', expectedDec: '.12' },
  { test: '12345.123', expectedInt: '12345', expectedDec: '.12' },
  { test: '123456.1', expectedInt: '123456', expectedDec: '.1' },
  { test: '123456.12', expectedInt: '123456', expectedDec: '.12' },
  { test: '123456.123', expectedInt: '123456', expectedDec: '.12' },
  { test: '1234567.1', expectedInt: '1234567', expectedDec: '.1' },
  { test: '1234567.12', expectedInt: '1234567', expectedDec: '.12' },
  { test: '1234567.123', expectedInt: '1234567', expectedDec: '.12' },
  { test: '12345678.1', expectedInt: '12345678', expectedDec: '.1' },
  { test: '12345678.12', expectedInt: '12345678', expectedDec: '.12' },
  { test: '12345678.123', expectedInt: '12345678', expectedDec: '.12' },
  { test: '123456789.1', expectedInt: '123456789', expectedDec: '.1' },
  { test: '123456789.12', expectedInt: '123456789', expectedDec: '.12' },
  { test: '123456789.123', expectedInt: '123456789', expectedDec: '.12' },
  { test: '1234567890.1', expectedInt: '1234567890', expectedDec: '.1' },
  { test: '1234567890.12', expectedInt: '1234567890', expectedDec: '.12' },
  { test: '1234567890.123', expectedInt: '1234567890', expectedDec: '.12' },
  { test: '1,.1', expectedInt: '1,', expectedDec: '.1' },
  { test: '1,.12', expectedInt: '1,', expectedDec: '.12' },
  { test: '1,.123', expectedInt: '1,', expectedDec: '.12' },
  { test: '1,2.1', expectedInt: '1,2', expectedDec: '.1' },
  { test: '1,2.12', expectedInt: '1,2', expectedDec: '.12' },
  { test: '1,2.123', expectedInt: '1,2', expectedDec: '.12' },
  { test: '12,3.1', expectedInt: '12,3', expectedDec: '.1' },
  { test: '12,3.12', expectedInt: '12,3', expectedDec: '.12' },
  { test: '12,3.123', expectedInt: '12,3', expectedDec: '.12' },
  { test: '123,4.1', expectedInt: '123,4', expectedDec: '.1' },
  { test: '123,4.12', expectedInt: '123,4', expectedDec: '.12' },
  { test: '123,4.123', expectedInt: '123,4', expectedDec: '.12' },
  { test: '1,2345.1', expectedInt: '1,2345', expectedDec: '.1' },
  { test: '1,2345.12', expectedInt: '1,2345', expectedDec: '.12' },
  { test: '1,2345.123', expectedInt: '1,2345', expectedDec: '.12' },
  { test: '12345,6.1', expectedInt: '12345,6', expectedDec: '.1' },
  { test: '1,23,456.12', expectedInt: '1,23,456', expectedDec: '.12' },
  { test: '12,3,456.123', expectedInt: '12,3,456', expectedDec: '.12' },
  {
    test: '1,,,,,,,12,,212,.1',
    expectedInt: '1,,,,,,,12,,212,',
    expectedDec: '.1',
  },
  {
    test: '1,,,,,,,12,,212,..21',
    expectedInt: '1,,,,,,,12,,212,',
    expectedDec: '..21',
  },
]

export { USFormatTests, nonUSFormatTests }

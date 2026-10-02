import { AppInfo } from '@Constants'

// Match-group indices shared by the FIELDS.FLOAT and FIELDS.BTC patterns:
// 1 = integer part, 5 = decimal separator + fractional digits.
export const INTEGER_PART = 1
export const DECIMAL_PART = 5

const rawFieldExpression = {
  float:
    '(([0-9]{1,})$|([0-9]{1,3}\\:tsep:{0,})*|([0-9]{1,3}))(\\:dsep:{0,}[0-9]{0,2})?(.{0,})',
  btc: '(([0-9]{1,})$|([0-9]{1,3}\\:tsep:{0,})*|([0-9]{1,3}))(\\:dsep:{0,}[0-9]{0,:decimals:})?(.{0,})',
}

const Expressions = {
  PASSWORD: /^(?=.*[A-Z])(?=.*[\W_])(?=.*[0-9])(?=.*[a-z]).{8,128}$/,
  FIELDS: {
    INTEGER: /([0-9]+)/,
    FLOAT: {
      getExpression: (
        dSep = AppInfo.decimalSeparator,
        tSep = AppInfo.thousandsSeparator,
      ) =>
        new RegExp(
          rawFieldExpression.float.replaceAll(/:tsep:|:dsep:/g, (char) =>
            char === ':tsep:' ? tSep : dSep,
          ),
        ),
    },
    BTC: {
      getExpression: (
        dSep = AppInfo.decimalSeparator,
        tSep = AppInfo.thousandsSeparator,
        decimals = AppInfo.BTC_DECIMALS,
      ) =>
        new RegExp(
          rawFieldExpression.btc
            .replace(':decimals:', decimals)
            .replaceAll(/:tsep:|:dsep:/g, (char) =>
              char === ':tsep:' ? tSep : dSep,
            ),
        ),
    },
  },
}

export default Expressions

import { AppInfo } from '@Constants'

const rawFieldExpression = {
  float:
    '(([0-9]{1,})$|([0-9]{1,3}\\:tsep:{0,})*|([0-9]{1,3}))(\\:dsep:{0,}[0-9]{0,2})?(.{0,})',
  btc: '(([0-9]{1,})$|([0-9]{1,3}\\:tsep:{0,})*|([0-9]{1,3}))(\\:dsep:{0,}[0-9]{0,8})?(.{0,})',
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
      ) =>
        new RegExp(
          rawFieldExpression.btc.replaceAll(/:tsep:|:dsep:/g, (char) =>
            char === ':tsep:' ? tSep : dSep,
          ),
        ),
    },
  },
}

export default Expressions

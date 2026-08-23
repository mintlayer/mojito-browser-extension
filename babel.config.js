const stubImportMeta = () => ({
  visitor: {
    MetaProperty(path) {
      if (path.node.meta?.name !== 'import') return

      path.replaceWithSourceString('({ url: "file:///" })')
    },
  },
})

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  env: {
    test: {
      plugins: [stubImportMeta],
    },
  },
}

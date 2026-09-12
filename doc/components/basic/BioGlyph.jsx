// BioGlyph — face or fingerprint glyph. Composes: FaceIcon, Icon.
function BioGlyph({ bio, size = 24, color, stroke = 1.4 }) {
  return bio === 'face' ? (
    <FaceIcon
      size={size}
      color={color}
      stroke={stroke}
    ></FaceIcon>
  ) : (
    <Icon
      name="fingerprint"
      size={size}
      color={color}
      stroke={stroke}
    ></Icon>
  )
}

Object.assign(window, { BioGlyph })

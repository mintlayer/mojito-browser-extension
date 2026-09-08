// Mojito BE design components — barrel.
// Load order documents the composition hierarchy: basics first, composed on top.
// Each file registers its components globally (Object.assign(window, ...)) to stay
// drop-in compatible with the demo shell (doc/Mojito BE.html).

// ─── Basic: brand & data display ─────────────────────────────
import './basic/Icon.jsx'
import './basic/MojitoLogo.jsx'
import './basic/Counter.jsx'
import './basic/LivePill.jsx'
import './basic/TokenIcon.jsx'
import './basic/ChainBadge.jsx'
import './basic/Sparkline.jsx'
import './basic/Avatar.jsx'
import './basic/Favicon.jsx'
import './basic/StatusBar.jsx'

// ─── Basic: layout & structure ───────────────────────────────
import './basic/Card.jsx'
import './basic/Row.jsx'
import './basic/Eyebrow.jsx'
import './basic/Hdr.jsx'
import './basic/Sheet.jsx'
import './basic/BeSheet.jsx'
import './basic/KV.jsx'
import './basic/IconTile.jsx'
import './basic/AmountBlock.jsx'
import './basic/QrPlaceholder.jsx'
import './basic/Empty.jsx'
import './basic/Success.jsx'
import './basic/Spinner.jsx'

// ─── Basic: controls & forms ─────────────────────────────────
import './basic/Switch.jsx'
import './basic/Checkbox.jsx'
import './basic/Seg.jsx'
import './basic/Tag.jsx'
import './basic/Field.jsx'
import './basic/Input.jsx'
import './basic/PwField.jsx'
import './basic/pwScore.js'
import './basic/Strength.jsx'
import './basic/HoldButton.jsx'
import './basic/useToast.js'
import './basic/Progress.jsx'
import './basic/PinDots.jsx'
import './basic/Keypad.jsx'

// ─── Basic: biometrics ───────────────────────────────────────
import './basic/FaceIcon.jsx'
import './basic/BioGlyph.jsx'
import './basic/BioCircle.jsx'
import './basic/useBioScan.js'

// ─── Basic: seed phrase ──────────────────────────────────────
import './basic/SeedGrid.jsx'

// ─── Composed: built recursively from the basics ─────────────
import './composed/TxRow.jsx'
import './composed/AssetRow.jsx'
import './composed/AccountRow.jsx'
import './composed/OriginCard.jsx'
import './composed/FeeSelector.jsx'
import './composed/NftCard.jsx'
import './composed/SeedReveal.jsx'
import './composed/PasswordConfirm.jsx'
import './composed/OnbTop.jsx'
import './composed/Broadcasting.jsx'

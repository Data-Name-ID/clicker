import { SPRITES } from '../assets/sprites'
import { useGame } from '../store/context'
import { AdButton } from './AdButton'

export function CatOverlay() {
  const catVisible = useGame((s) => s.catVisible)
  const catBoxOpen = useGame((s) => s.catBoxOpen)
  const clickCat = useGame((s) => s.clickCat)
  const chooseCatBox = useGame((s) => s.chooseCatBox)

  return (
    <>
      {catVisible && (
        <button type="button" className="flyby flyby--cat" onClick={clickCat} aria-label="Погладить кота">
          <img className="pixel" src={SPRITES.cat} alt="" width={64} height={64} />
        </button>
      )}
      {catBoxOpen && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="cat-title">
          <div className="modal frame">
            <h2 id="cat-title">Кот-курьер</h2>
            <p className="muted">Кот притащил три ящика. Бери один — остальные он оставит себе.</p>
            <div className="cat-boxes">
              {[1, 2, 3].map((i) => (
                <button type="button" key={i} className="btn cat-box" onClick={chooseCatBox} aria-label={`Ящик ${i}`}>
                  📦
                </button>
              ))}
            </div>
            <div className="actions cat-actions">
              <AdButton placement="catDouble" label="Открыть два ящика" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

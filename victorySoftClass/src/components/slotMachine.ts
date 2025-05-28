import { Application, Container, Sprite, Texture, Text, Graphics } from 'pixi.js';
import { SYMBOL_NAMES, type SymbolName } from '../assets/symbols';

export class SlotMachine extends Container {
  private reels: Reel[] = []
  private spinButton: Graphics
  private app: Application
  private isSpinning = false
  private symbolSize = 100
  private reelCount = 5
  private visibleSymbols = 3

  constructor(app: Application) {
    super()
    this.app = app
    this.position.set(app.screen.width / 2, app.screen.height / 2)
    this.pivot.set(this.width / 2, this.height / 2)
  }

  private createReels() {
    for (let i = 0; i < this.reelCount; i += 1) {
      const reel = new Reel(
        i,
        this.symbolSize,
        this.visibleSymbols,
        this.reelCount,
        this.onReelStop
      )
    }
  }

  private onReelStop() {
    const allStoped = this.reels.every((reel) => !reel.isSpinning)

    if(allStoped) {
      this.isSpinning = false
      // показать результат
    }
  }
}

class Reel extends Container {
  private symbols: Sprite[] = []
  private symbolSize: number
  private visibleSymbols: number
  private reelIndex: number
  // public isSpinning = false
  private speenSpeed = 0
  private spinTime = 0
  private spinDuration = 0
  private onStopCallback: () => void
  private currentPosition = 0
  private targetPosition = 0

  constructor(
    index: number,
    symbolSize: number,
    visibleSymbols: number,
    reelCount: number,
    onStop: () => void
  ) {
    super()
    this.reelIndex = index
    this.symbolSize = symbolSize
    this.visibleSymbols = visibleSymbols
    this.onStopCallback = onStop
    this.createSymbols()
  }

  private createSymbols() {
    const totalSymbols = this.visibleSymbols + 2

    for (let i = 0; i < totalSymbols; i += 1) {
      const symbol = this.createRandomSymbol()
      symbol.y = i * this.symbolSize
      this.symbols.push(symbol)
      this.addChild(symbol)
    }
  }

  private createRandomSymbol() {
    const randomIndex = Math.floor(Math.random() * SYMBOL_NAMES.length)
    const symbolLable = SYMBOL_NAMES[randomIndex]
    const texture = Texture.from(`png/${symbolLable}.png`)
    const sprite = new Sprite(texture)

    sprite.width = this.symbolSize
    sprite.height = this.symbolSize
    sprite.anchor.set(0.5)
    sprite.x = this.symbolSize / 2

    return sprite
  }

  public get isSpinning(): boolean {
    return this.isSpinning
  }
}
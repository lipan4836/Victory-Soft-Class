import { Application, Container, Sprite, Texture, Text, Graphics } from 'pixi.js';
import { SYMBOL_NAMES, SymbolName } from '../assets/symbols';

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
}
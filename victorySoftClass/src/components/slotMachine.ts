import {
  Application,
  Container,
  Sprite,
  Texture,
  Assets,
  Text,
  Graphics,
  Ticker,
} from 'pixi.js';
import { SYMBOL_NAMES, type SymbolName } from '../assets/symbols';

interface SymbolSprite extends Sprite {
  label: SymbolName;
}

export class SlotMachine extends Container {
  private reels: Reel[] = [];
  private spinButton!: Graphics;
  private app: Application;
  private isSpinning = false;
  private symbolSize = 100;
  private reelCount = 5;
  private visibleSymbols = 3;

  constructor(app: Application) {
    super();
    this.app = app;
    this.createReels();
    this.createSpinButton();
    this.position.set(app.screen.width / 2, app.screen.height / 2);
    this.pivot.set(
      (this.reelCount * (this.symbolSize + 10)) / 2,
      (this.visibleSymbols * this.symbolSize) / 2
    );
  }

  private async createReels() {
    await this.preloadTextures();

    for (let i = 0; i < this.reelCount; i++) {
      const reel = new Reel(
        i,
        this.symbolSize,
        this.visibleSymbols,
        this.reelCount,
        this.onReelStop.bind(this),
        this.app
      );
      reel.x = i * (this.symbolSize + 10);
      this.addChild(reel);
      this.reels.push(reel);
    }
  }

  private async preloadTextures() {
    try {
      const texturePaths = SYMBOL_NAMES.reduce((acc, name) => {
        acc[name] = `/png/${name}.png`;
        return acc;
      }, {} as Record<SymbolName, string>);

      Assets.addBundle('slotSymbols', texturePaths);

      await Assets.loadBundle('slotSymbols');
    } catch (error) {
      console.error('Failed to load textures:', error);
      throw error;
    }
  }

  private createSpinButton() {
    const buttonContainer = new Container();

    this.spinButton = new Graphics()
      .roundRect(0, 0, 150, 60, 15)
      .fill(0x3a7bd5);

    const buttonText = new Text({
      text: 'SPIN',
      style: {
        fill: 0xffffff,
        fontSize: 24,
        fontWeight: 'bold',
      },
    });
    buttonText.anchor.set(0.5);
    buttonText.position.set(75, 30);

    buttonContainer.addChild(this.spinButton);
    buttonContainer.addChild(buttonText);

    buttonContainer.position.set(
      (this.reelCount * (this.symbolSize + 10) - 150) / 2,
      this.visibleSymbols * this.symbolSize + 30
    );
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    buttonContainer.on('pointerdown', () => this.startSpin());

    this.addChild(buttonContainer);
  }

  private startSpin() {
    if (this.isSpinning) return;
    this.isSpinning = true;

    this.reels.forEach((reel, index) => {
      setTimeout(() => {
        reel.spin();
      }, index * 100);
    });
  }

  private onReelStop() {
    const allStopped = this.reels.every((reel) => !reel.isSpinning);
    if (allStopped) {
      this.isSpinning = false;
      this.showResult();
    }
  }

  private showResult() {
    const result = this.reels.map((reel) => reel.getCenterSymbol());
    console.log('Result:', result);
  }
}

class Reel extends Container {
  private symbols: SymbolSprite[] = [];
  private symbolSize: number;
  private visibleSymbols: number;
  private reelIndex: number;
  private _isSpinning = false;
  private spinSpeed = 0;
  private spinTime = 0;
  private spinDuration = 0;
  private onStopCallback: () => void;
  private currentPosition = 0;
  private app: Application;
  private updateBound: (ticker: Ticker) => void;

  constructor(
    index: number,
    symbolSize: number,
    visibleSymbols: number,
    reelCount: number,
    onStop: () => void,
    app: Application
  ) {
    super();
    this.reelIndex = index;
    this.symbolSize = symbolSize;
    this.visibleSymbols = visibleSymbols;
    this.onStopCallback = onStop;
    this.app = app;
    this.updateBound = this.update.bind(this);
    this.createSymbols();
  }

  private createSymbols() {
    const totalSymbols = this.visibleSymbols + 2;

    for (let i = 0; i < totalSymbols; i++) {
      const symbol = this.createRandomSymbol();
      symbol.y = i * this.symbolSize;
      this.symbols.push(symbol);
      this.addChild(symbol);
    }
  }

  private createRandomSymbol(): SymbolSprite {
    const randomIndex = Math.floor(Math.random() * SYMBOL_NAMES.length);
    const symbolLabel = SYMBOL_NAMES[randomIndex];
    const texture = Texture.from(`/png/${symbolLabel}.png`);

    const sprite = new Sprite(texture) as SymbolSprite;
    sprite.width = this.symbolSize;
    sprite.height = this.symbolSize;
    sprite.anchor.set(0.5);
    sprite.x = this.symbolSize / 2;
    sprite.label = symbolLabel;

    return sprite;
  }

  private update(ticker: Ticker) {
    if (!this._isSpinning) return;

    this.spinTime += ticker.deltaMS;

    const progress = Math.min(this.spinTime / this.spinDuration, 1);
    const currentSpeed = this.spinSpeed * (1 - progress * 0.9);

    this.currentPosition += currentSpeed;

    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      symbol.y =
        ((i * this.symbolSize + this.currentPosition) %
          (this.symbols.length * this.symbolSize)) -
        this.symbolSize;
    }

    if (this.spinTime >= this.spinDuration) {
      this.stop();
    }
  }

  private stop() {
    this._isSpinning = false;
    this.app.ticker.remove(this.updateBound);

    const targetY =
      Math.round(this.currentPosition / this.symbolSize) * this.symbolSize;
    this.currentPosition = targetY;

    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      symbol.y =
        ((i * this.symbolSize + this.currentPosition) %
          (this.symbols.length * this.symbolSize)) -
        this.symbolSize;
    }

    this.updateHiddenSymbols();
    this.onStopCallback();
  }

  private updateHiddenSymbols() {
    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      if (
        symbol.y < -this.symbolSize ||
        symbol.y > this.visibleSymbols * this.symbolSize
      ) {
        const newSymbol = this.getRandomSymbolName();
        symbol.texture = Texture.from(`/png/${newSymbol}.png`);
        symbol.label = newSymbol;
      }
    }
  }

  private getRandomSymbolName(): SymbolName {
    const randomIndex = Math.floor(Math.random() * SYMBOL_NAMES.length);
    return SYMBOL_NAMES[randomIndex];
  }

  public spin() {
    if (this._isSpinning) return;

    this._isSpinning = true;
    this.spinTime = 0;
    this.spinSpeed = 5 + Math.random() * 5;
    this.spinDuration = 2000 + Math.random() * 3000;

    this.app.ticker.add(this.updateBound);
  }

  public getCenterSymbol(): SymbolName {
    const centerY = (this.visibleSymbols * this.symbolSize) / 2;

    for (const symbol of this.symbols) {
      if (Math.abs(symbol.y - centerY) < this.symbolSize / 2) {
        return symbol.label;
      }
    }

    return SYMBOL_NAMES[0];
  }

  public get isSpinning(): boolean {
    return this._isSpinning;
  }
}

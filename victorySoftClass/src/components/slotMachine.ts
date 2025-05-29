import {
  Application,
  Container,
  Sprite,
  Texture,
  Assets,
  Text,
  Graphics,
} from 'pixi.js';
import { SYMBOL_NAMES, type SymbolName } from '../assets/symbols';
import { gsap } from 'gsap';

interface SymbolSprite extends Sprite {
  label: SymbolName;
}

interface ReelConfig {
  spinDuration: number;
  spinSpeed: number;
  overshoot: number;
  bounceStrength: number;
  debug: boolean;
}

interface SlotMachineConfig {
  symbolSize: number;
  reelCount: number;
  visibleSymbols: number;
  reelConfig: ReelConfig;
}

const DEFAULT_REEL_CONFIG: ReelConfig = {
  spinDuration: 2.5,
  spinSpeed: 15,
  overshoot: 0.3,
  bounceStrength: 0.8,
  debug: false,
};

const DEFAULT_SLOT_CONFIG: SlotMachineConfig = {
  symbolSize: 100,
  reelCount: 5,
  visibleSymbols: 3,
  reelConfig: DEFAULT_REEL_CONFIG,
};

export class SlotMachine extends Container {
  private reels: Reel[] = [];
  private spinButton!: Graphics;
  private app: Application;
  private isSpinning = false;
  private config: Required<SlotMachineConfig>;

  constructor(app: Application, config?: SlotMachineConfig) {
    super();
    this.app = app;
    this.config = {
      ...DEFAULT_SLOT_CONFIG,
      ...config,
      reelConfig: {
        ...DEFAULT_REEL_CONFIG,
        ...config?.reelConfig,
      },
    };

    this.createReels();
    this.createSpinButton();
    this.position.set(app.screen.width / 2, app.screen.height / 2);
    this.pivot.set(
      (this.config.reelCount * (this.config.symbolSize + 10)) / 2,
      (this.config.visibleSymbols * this.config.symbolSize) / 2
    );
  }

  private async createReels() {
    await this.preloadTextures();

    for (let i = 0; i < this.config.reelCount; i++) {
      const reel = new Reel({
        index: i,
        symbolSize: this.config.symbolSize,
        visibleSymbols: this.config.visibleSymbols,
        onStop: this.onReelStop.bind(this),
        app: this.app,
        config: this.config.reelConfig,
      });
      reel.x = i * (this.config.symbolSize + 10);
      reel.y = 0;
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
    const buttonWidth = 150;
    const buttonHeight = 60;

    this.spinButton = new Graphics()
      .roundRect(0, 0, buttonWidth, buttonHeight, 15)
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
    buttonText.position.set(buttonWidth / 2, buttonHeight / 2);

    buttonContainer.addChild(this.spinButton, buttonText);
    buttonContainer.position.set(
      (this.config.reelCount * (this.config.symbolSize + 10) - buttonWidth) / 2,
      this.config.visibleSymbols * this.config.symbolSize + 30
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
      setTimeout(() => reel.spin(), index * 150);
    });
  }

  private onReelStop() {
    if (this.reels.every((reel) => !reel.isSpinning)) {
      this.isSpinning = false;
      this.showResult();
    }
  }

  private showResult() {
    const result = this.reels.map((reel) => reel.getCenterSymbol());
    console.log('Slot Result:', result);
  }
}

class Reel extends Container {
  private symbols: SymbolSprite[] = [];
  private _isSpinning = false;
  private currentPosition = 0;
  private config: Required<ReelConfig>;
  private debugGraphics?: Graphics;

  constructor(
    private params: {
      index: number;
      symbolSize: number;
      visibleSymbols: number;
      onStop: () => void;
      app: Application;
      config?: Partial<ReelConfig>;
    }
  ) {
    super();
    this.config = {
      ...DEFAULT_REEL_CONFIG,
      ...params.config,
    };
    this.createSymbols();
    this.alignSymbols();
    if (this.config.debug) this.setupDebugVisualization();
  }

  private createSymbols() {
    const totalSymbols = this.params.visibleSymbols + 4;
    const initialOffset = -this.params.symbolSize / 2;

    const randomStartOffset = Math.floor(
      Math.random() * this.params.symbolSize
    );

    for (let i = -2; i < totalSymbols - 2; i++) {
      const symbol = this.createRandomSymbol();
      symbol.y = i * this.params.symbolSize + initialOffset + randomStartOffset;
      this.symbols.push(symbol);
      this.addChild(symbol);
    }

    this.currentPosition = initialOffset;
  }

  private alignSymbols() {
    const maxPos = this.symbols.length * this.params.symbolSize;
    const targetY =
      Math.round(this.currentPosition / this.params.symbolSize) *
      this.params.symbolSize;

    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      symbol.y =
        ((i * this.params.symbolSize + targetY) % maxPos) -
        this.params.symbolSize;
    }

    this.currentPosition = targetY;
  }

  private createRandomSymbol(): SymbolSprite {
    const randomIndex = Math.floor(Math.random() * SYMBOL_NAMES.length);
    const symbolLabel = SYMBOL_NAMES[randomIndex];
    const texture = Texture.from(`/png/${symbolLabel}.png`);

    const sprite = new Sprite(texture) as SymbolSprite;
    sprite.width = this.params.symbolSize;
    sprite.height = this.params.symbolSize;
    sprite.anchor.set(0.5);
    sprite.x = this.params.symbolSize / 2;
    sprite.label = symbolLabel;

    return sprite;
  }

  private setupDebugVisualization() {
    this.debugGraphics = new Graphics();
    this.addChild(this.debugGraphics);

    // Центральная линия
    this.debugGraphics
      .setStrokeStyle({
        width: 2,
        color: 0xff0000,
      })
      .moveTo(0, (this.params.visibleSymbols * this.params.symbolSize) / 2)
      .lineTo(
        this.params.symbolSize,
        (this.params.visibleSymbols * this.params.symbolSize) / 2
      )
      .stroke();

    // Границы видимой области
    this.debugGraphics
      .setStrokeStyle({
        width: 1,
        color: 0x00ff00,
      })
      .moveTo(0, 0)
      .lineTo(this.params.symbolSize, 0)
      .stroke()
      .moveTo(0, this.params.visibleSymbols * this.params.symbolSize)
      .lineTo(
        this.params.symbolSize,
        this.params.visibleSymbols * this.params.symbolSize
      )
      .stroke();
  }

  public spin() {
    if (this._isSpinning) return;
    this._isSpinning = true;
    gsap.killTweensOf(this);

    // Более вариативное количество символов для прокрутки
    const baseSpinSymbols = 30 + this.params.index * 8;
    const randomSpinSymbols = Math.floor(Math.random() * 30);
    const totalSpinSymbols = baseSpinSymbols + randomSpinSymbols;

    // Разная скорость для каждого барабана с большей вариативностью
    const speedFactor = 0.8 + Math.random() * 0.5;
    const duration = this.config.spinDuration * speedFactor;

    // Случайное смещение финальной позиции
    const positionOffset = Math.floor(Math.random() * this.params.symbolSize);
    const finalPosition =
      positionOffset +
      Math.floor(Math.random() * SYMBOL_NAMES.length) * this.params.symbolSize;

    const overshootPosition =
      finalPosition + this.config.overshoot * this.params.symbolSize;

    // Первая фаза - быстрое вращение
    gsap.to(this, {
      currentPosition: `+=${totalSpinSymbols * this.params.symbolSize}`,
      duration: duration * 0.7,
      ease: 'power3.in',
      modifiers: {
        currentPosition: (value) => {
          const maxPos = this.symbols.length * this.params.symbolSize;
          return ((value % maxPos) + maxPos) % maxPos;
        },
      },
      onUpdate: () => this.updateSymbols(),
      onComplete: () => {
        // Вторая фаза - замедление
        gsap.to(this, {
          currentPosition: `+=${15 * this.params.symbolSize}`,
          duration: duration * 0.2,
          ease: 'sine.inOut',
          onUpdate: () => this.updateSymbols(),
          onComplete: () => {
            // Третья фаза - доводка до overshoot позиции
            gsap.to(this, {
              currentPosition: overshootPosition,
              duration: duration * 0.1,
              ease: 'power1.out',
              onUpdate: () => this.updateSymbols(),
              onComplete: () => {
                this.finalizeStop(finalPosition);
              },
            });
          },
        });
      },
    });
  }

  private finalizeStop(finalPosition: number) {
    gsap.to(this, {
      currentPosition: finalPosition,
      duration: 0.4,
      ease: `back.out(${this.config.bounceStrength})`,
      onUpdate: () => this.updateSymbols(),
      onComplete: () => {
        this._isSpinning = false;
        this.currentPosition = finalPosition;
        this.alignSymbols();
        this.updateSymbols();
        this.updateHiddenSymbols();
        this.params.onStop();
      },
    });
  }

  private updateSymbols() {
    const maxPos = this.symbols.length * this.params.symbolSize;
    const normalizedPos = ((this.currentPosition % maxPos) + maxPos) % maxPos;

    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      symbol.y =
        ((i * this.params.symbolSize + normalizedPos) % maxPos) -
        this.params.symbolSize;

      // для дебага
      if (this.config.debug && this.debugGraphics) {
        symbol.alpha =
          symbol.y >= 0 &&
          symbol.y < this.params.visibleSymbols * this.params.symbolSize
            ? 1
            : 0.5;
      }
    }
  }

  private updateHiddenSymbols() {
    const visibleRange = this.params.visibleSymbols * this.params.symbolSize;

    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      const symbolBottom = symbol.y + this.params.symbolSize;

      if (symbolBottom < 0 || symbol.y > visibleRange) {
        const newSymbol =
          SYMBOL_NAMES[Math.floor(Math.random() * SYMBOL_NAMES.length)];
        symbol.texture = Texture.from(`/png/${newSymbol}.png`);
        symbol.label = newSymbol;

        if (symbolBottom < 0) {
          symbol.y += this.symbols.length * this.params.symbolSize;
        } else if (symbol.y > visibleRange) {
          symbol.y -= this.symbols.length * this.params.symbolSize;
        }
      }
    }
  }

  public getCenterSymbol(): SymbolName {
    const centerY = (this.params.visibleSymbols * this.params.symbolSize) / 2;
    const visibleSymbols = this.symbols.filter(
      (s) =>
        s.y >= 0 && s.y < this.params.visibleSymbols * this.params.symbolSize
    );

    visibleSymbols.sort(
      (a, b) =>
        Math.abs(a.y + this.params.symbolSize / 2 - centerY) -
        Math.abs(b.y + this.params.symbolSize / 2 - centerY)
    );

    return visibleSymbols[0]?.label ?? SYMBOL_NAMES[0];
  }

  public get isSpinning(): boolean {
    return this._isSpinning;
  }
}

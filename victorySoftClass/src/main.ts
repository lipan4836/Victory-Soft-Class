import { Application, Container, Graphics } from 'pixi.js';
import './style.css';
import { SlotMachine } from './components/slotMachine';

async function initApp() {
  const app = new Application();
  await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
  });

  document.body.appendChild(app.canvas);

  const reelsLayer = new Container();
  const frameLayer = new Container();
  const uiLayer = new Container();

  app.stage.addChild(reelsLayer, frameLayer, uiLayer);

  const slotMachine = new SlotMachine(app, {
    symbolSize: 120,
    reelCount: 5,
    visibleSymbols: 3,
    reelConfig: {
      spinDuration: 3,
      overshoot: 0.3,
      bounceStrength: 0.5,
      debug: false,
      spinSpeed: 15,
    },
  });

  reelsLayer.addChild(slotMachine);

  createFrame(frameLayer);

  uiLayer.addChild(slotMachine.getSpinButton());

  // убарл пока slotMachine: SlotMachine из параметров
  function createFrame(layer: Container) {
    const frame = new Graphics();

    // рамка
    frame.roundRect(0, 0, 800, 600, 15).fill({ color: 0x1a237e, alpha: 1 });

    // вырез для барабанов
    frame.beginPath();
    frame.rect(75, 58, 640, 365);
    frame.cut();

    // декоративные элементы
    frame.roundRect(10, 10, 780, 580, 10).stroke({ width: 4, color: 0xffd700 });

    layer.addChild(frame);
  }
}

initApp().catch(console.error);

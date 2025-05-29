import { Application } from 'pixi.js';
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

  const slotMachine = new SlotMachine(app, {
    symbolSize: 120,
    reelCount: 5,
    visibleSymbols: 3,
    reelConfig: {
      spinDuration: 3,
      overshoot: 1.2,
      bounceStrength: 0.5,
      debug: true,
      spinSpeed: 20,
    },
  });
  app.stage.addChild(slotMachine);
}

initApp().catch(console.error);

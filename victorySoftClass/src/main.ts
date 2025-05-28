import { Application, Container, Sprite, Texture } from 'pixi.js';
import '.style.css'

const app = new Application({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
})

document.body.appendChild(app.view as HTMLCanvasElement)
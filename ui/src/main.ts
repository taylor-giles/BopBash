import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app') as HTMLElement,
})

// Register PWA service worker
if('serviceWorker' in navigator) {
  console.log("yes");
  navigator.serviceWorker.register('./sw.js').then((registration) => {
    console.log(`Service Worker registered with scope:`, registration);
  }).catch((error) => {
    console.error('Service Worker registration failed', error);
  });
}

export default app
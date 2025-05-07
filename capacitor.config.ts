import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'myApp',
  webDir: 'dist',
  plugins: {
    "StatusBar": {
      "backgroundColor": "#000000",  // Dunkel, z.B. Schwarz
      "style": "DARK"  // Stellt die Symbole auf dunkel (schwarz)
    }
  }
};

export default config;

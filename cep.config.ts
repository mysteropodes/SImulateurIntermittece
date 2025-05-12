import { CEP_Config } from "vite-cep-plugin";
import { version } from "./package.json";


const config: CEP_Config = {
  version,
  id: "com.LayerManager.cep",
  displayName: "LayerManager",
  symlink: "local",
  port: 3000,
  servePort: 5000,
  startingDebugPort: 8860,
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 9.0,
  hosts: [
    { name: "AEFT", version: "[15.0,99.9]" }
  ],
  type: "Panel",
  iconDarkNormal: "./src/assets/light-icon.png",
  iconNormal: "./src/assets/dark-icon.png",
  iconDarkNormalRollOver: "./src/assets/light-icon.png",
  iconNormalRollOver: "./src/assets/dark-icon.png",
  parameters: ["--v=0", "--enable-nodejs", "--mixed-context"],
  width: 500,
  height: 550,

  panels: [
    {
      mainPath: "./main/index.html",
      name: "main",
      panelDisplayName: "LayerManager",
      autoVisible: true,
      width: 600,
      height: 650,
    },

  ],
  build: {
    jsxBin: "off",
    sourceMap: true,
  },
  zxp: {
    country: "FR", // Pays : France
    province: "Île-de-France", // Région
    org: "Mysteropodes", // Organisation
    password: "ShaPPer166431", // Pas de mot de passe pour le certificat (test)
    //tsa: "https://timestamp.digicert.com", // Serveur d'horodatage
    sourceMap: false, // Pas besoin de fichiers source map dans le ZXP
    jsxBin: "off", // Fichiers JSX en clair
  },
  installModules: [
      "@rive-app/react-canvas",
  ],
  copyAssets: [],
  copyZipAssets: [],
};
export default config;

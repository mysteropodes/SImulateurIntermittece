// On utilise window.require pour accéder aux modules Node dans l'environnement CEP
const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

if (!fs || !path) {
  console.error("Les modules 'fs' et 'path' ne sont pas disponibles. Assurez-vous d'avoir activé l'intégration Node dans votre manifeste CEP.");
}

// Déclaration du type pour window.__adobe_cep__
declare global {
  interface Window {
    __adobe_cep__: {
      getSystemPath(pathType: string): string;
    };
  }
}

function cleanPath(filePath: string): string {
  return filePath
    .replace('file:///', '')
    .replace('file:/', '')
    .replace('file:', '')
    .replace(/^\\+/, '')
    .replace(/^\/+/, '');
}

/**
 * Sauvegarde le contenu JSON dans un fichier "selections.json"
 * situé dans le dossier "assets" de l'extension.
 */
export function saveJSONToFile(jsonData: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const extensionPath = cleanPath(window.__adobe_cep__.getSystemPath('extension'));
      const assetsDir = path.join(extensionPath, 'assets');
      console.log("assetsDir", assetsDir);
      
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      const filePath = path.join(assetsDir, 'selections2.json');

      fs.writeFile(filePath, jsonData, 'utf8', (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Lit le cache d'ancre depuis le fichier anchorCache.json.
 * Si le fichier n'existe pas, retourne un objet vide.
 */
export function readAnchorCache(): Promise<{
  [compId: string]: { [key: string]: { x: number; y: number } };
}> {
  return new Promise((resolve, reject) => {
    try {
      const extensionPath = cleanPath(window.__adobe_cep__.getSystemPath('extension'));
      const assetsDir = path.join(extensionPath, 'assets');
      const filePath = path.join(assetsDir, 'anchorCache.json');
      console.log("filePath", filePath);
      
      if (!fs.existsSync(filePath)) {
        resolve({});
        return;
      }
      
      fs.readFile(filePath, 'utf8', (err: any, data: string) => {
        if (err) {
          reject(err);
        } else {
          try {
            const cache = JSON.parse(data);
            resolve(
              cache as { [compId: string]: { [key: string]: { x: number; y: number } } }
            );
          } catch (e) {
            resolve({});
          }
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Sauvegarde l'objet cache dans le fichier anchorCache.json
 * dans le dossier assets de l'extension.
 */
export function saveAnchorCache(
  cache: { [compId: string]: { [key: string]: { x: number; y: number } } }
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const extensionPath = cleanPath(window.__adobe_cep__.getSystemPath('extension'));
      const assetsDir = path.join(extensionPath, 'assets');
      const filePath = path.join(assetsDir, 'anchorCache.json');
      console.log("Chemin du fichier JSON:", filePath);
      
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      const jsonData = JSON.stringify(cache, null, 2);
      console.log("Données à sauvegarder:", jsonData);

      fs.writeFileSync(filePath, jsonData, 'utf8');
      console.log("Fichier sauvegardé avec succès");
      resolve();
    } catch (e) {
      console.error("Erreur générale:", e);
      reject(e);
    }
  });
}

// Ajout d'une fonction de test
export function testFileSystem(): void {
  console.log("Test du système de fichiers...");
  const extensionPath = cleanPath(window.__adobe_cep__.getSystemPath('extension'));
  console.log("Extension path exists:", fs.existsSync(extensionPath));
  console.log("Extension path is writable:", fs.accessSync(extensionPath, fs.constants.W_OK));
}

export function getAssetsDirectory() {
  const extensionPath = cleanPath(window.__adobe_cep__.getSystemPath('extension'));
  const assetsDirectory = path.join(extensionPath, 'assets');
  console.log("Assets directory:", assetsDirectory);
  return assetsDirectory;
}
import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { decryptFile } from "./decrypt";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = async (signal?: AbortSignal): Promise<GLTF | null> => {
    try {
      const encryptedBlob = await decryptFile(
        "/models/character.enc",
        "Character3D#@",
        signal
      );
      const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

      return await new Promise<GLTF | null>((resolve, reject) => {
        loader.load(
          blobUrl,
          async (gltf) => {
            try {
              const character = gltf.scene;
              if (!signal?.aborted) {
                await renderer.compileAsync(character, camera, scene);
              }
              character.traverse((child) => {
                const mesh = child as THREE.Mesh;
                if (mesh.isMesh) {
                  mesh.castShadow = false;
                  mesh.receiveShadow = false;
                  mesh.frustumCulled = true;
                  if (mesh.material && !Array.isArray(mesh.material)) {
                    (mesh.material as THREE.ShaderMaterial).precision =
                      "mediump";
                  }
                }
              });
              character.getObjectByName("footR")!.position.y = 3.36;
              character.getObjectByName("footL")!.position.y = 3.36;
              resolve(gltf);
            } catch (error) {
              reject(error);
            } finally {
              URL.revokeObjectURL(blobUrl);
              dracoLoader.dispose();
            }
          },
          undefined,
          (error) => {
            URL.revokeObjectURL(blobUrl);
            dracoLoader.dispose();
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error(err);
      }
      throw err;
    }
  };

  return { loadCharacter };
};

export default setCharacter;

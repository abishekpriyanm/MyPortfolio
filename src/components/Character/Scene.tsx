import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setAllTimeline, setCharTimeline } from "../utils/GsapScroll";

const disposeCharacter = (character: THREE.Object3D) => {
  character.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry?.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
};

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const { completeLoading } = useLoading();

  useEffect(() => {
    const mountNode = canvasDiv.current;
    if (!mountNode) return;

    let isActive = true;
    const rect = mountNode.getBoundingClientRect();
    const container = { width: rect.width, height: rect.height };
    const aspect = container.width / container.height;
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    mountNode.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.z = 10;
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let headBone: THREE.Object3D | null = null;
    let screenLight: THREE.Mesh | null = null;
    let mixer: THREE.AnimationMixer | undefined;
    let character: THREE.Object3D | null = null;
    let stopHover: (() => void) | undefined;
    let animationContext: gsap.Context | undefined;
    let introTimeout: ReturnType<typeof setTimeout> | undefined;
    let resizeHandler: (() => void) | undefined;

    const clock = new THREE.Clock();
    const loadController = new AbortController();

    const light = setLighting(scene);
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    loadCharacter(loadController.signal)
      .then((gltf) => {
        if (!gltf) return;

        if (!isActive) {
          disposeCharacter(gltf.scene);
          return;
        }

        const animations = setAnimations(gltf);
        if (hoverDivRef.current) {
          stopHover = animations.hover(gltf, hoverDivRef.current);
        }
        mixer = animations.mixer;
        character = gltf.scene;
        scene.add(character);
        headBone = character.getObjectByName("spine006") || null;
        screenLight =
          (character.getObjectByName("screenlight") as THREE.Mesh | undefined) ||
          null;

        animationContext = gsap.context(() => {
          setCharTimeline(character, camera);
          setAllTimeline();
        });

        completeLoading().then(() => {
          if (!isActive) return;
          introTimeout = setTimeout(() => {
            if (!isActive) return;
            light.turnOnLights();
            animations.startIntro();
          }, 2500);
        });

        resizeHandler = () => {
          if (isActive && character) {
            handleResize(renderer, camera, canvasDiv, character);
          }
        };
        window.addEventListener("resize", resizeHandler);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error("Failed to load character model:", err);
        completeLoading();
      });

    let mouse = { x: 0, y: 0 },
      interpolation = { x: 0.1, y: 0.2 };

    const onMouseMove = (event: MouseEvent) => {
      handleMouseMove(event, (x, y) => (mouse = { x, y }));
    };
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let touchTarget: HTMLElement | null = null;
    const onTouchMove = (event: TouchEvent) => {
      handleTouchMove(event, (x, y) => (mouse = { x, y }));
    };
    const onTouchStart = (event: TouchEvent) => {
      touchTarget = event.target as HTMLElement;
      debounce = setTimeout(() => {
        touchTarget?.addEventListener("touchmove", onTouchMove);
      }, 200);
    };

    const onTouchEnd = () => {
      touchTarget?.removeEventListener("touchmove", onTouchMove);
      touchTarget = null;
      handleTouchEnd((x, y, interpolationX, interpolationY) => {
        mouse = { x, y };
        interpolation = { x: interpolationX, y: interpolationY };
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    const landingDiv = document.getElementById("landingDiv");
    if (landingDiv) {
      landingDiv.addEventListener("touchstart", onTouchStart);
      landingDiv.addEventListener("touchend", onTouchEnd);
    }

    const animate = () => {
      if (headBone) {
        handleHeadRotation(
          headBone,
          mouse.x,
          mouse.y,
          interpolation.x,
          interpolation.y,
          THREE.MathUtils.lerp
        );
        light.setPointLight(screenLight);
      }
      const delta = clock.getDelta();
      mixer?.update(delta);
      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);

    return () => {
      isActive = false;
      loadController.abort();
      clearTimeout(debounce);
      clearTimeout(introTimeout);
      renderer.setAnimationLoop(null);
      stopHover?.();
      animationContext?.revert();
      mixer?.stopAllAction();
      document.removeEventListener("mousemove", onMouseMove);
      touchTarget?.removeEventListener("touchmove", onTouchMove);
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (landingDiv) {
        landingDiv.removeEventListener("touchstart", onTouchStart);
        landingDiv.removeEventListener("touchend", onTouchEnd);
      }
      if (character) {
        scene.remove(character);
        disposeCharacter(character);
      }
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, [completeLoading]);

  return (
    <>
      <div className="character-container">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;

import { Composition } from "remotion";
import { Reel } from "./Composition";
import { reels, SCENE_SECONDS } from "./scenes";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {reels.map((reel) => (
        <Composition
          key={reel.id}
          id={reel.id}
          component={Reel}
          durationInFrames={reel.scenes.length * SCENE_SECONDS * FPS}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ scenes: reel.scenes }}
        />
      ))}
    </>
  );
};

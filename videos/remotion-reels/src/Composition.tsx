import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene, SCENE_SECONDS } from "./scenes";

const COLORS = {
  ground: "#0f1a14",
  ink: "#f4f1ea",
  accent: "#c9a24a",
};
const FONT = '"Helvetica Neue", Arial, sans-serif';
const FADE_OUT_FRAMES = 12;

// Einzelne Szene: Kicker, Headline und Body erscheinen nacheinander.
const SceneView: React.FC<{ scene: Scene; isLast: boolean; durationFrames: number }> = ({ scene, isLast, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = (delaySec: number) => {
    const f = frame - Math.round(delaySec * fps);
    const p = spring({ frame: f, fps, config: { damping: 200 } });
    return { opacity: p, transform: `translateY(${(1 - p) * 40}px)` };
  };

  const fadeOut = isLast
    ? 1
    : interpolate(frame, [durationFrames - FADE_OUT_FRAMES, durationFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 96px", opacity: fadeOut }}>
      <div
        style={{
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: COLORS.accent,
          marginBottom: 40,
          ...enter(0.1),
        }}
      >
        {scene.kicker}
      </div>
      <div
        style={{
          fontSize: 120,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: "-0.03em",
          maxWidth: 888,
          ...enter(0.3),
        }}
      >
        {scene.headline}
      </div>
      {scene.body ? (
        <div style={{ marginTop: 48, fontSize: 56, lineHeight: 1.3, fontWeight: 400, maxWidth: 888, ...enter(0.9) }}>
          {scene.body}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Ganzer Reel: Szenen hintereinander, Musik und Fortschrittsbalken darüber.
export const Reel: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const sceneFrames = SCENE_SECONDS * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ground, color: COLORS.ink, fontFamily: FONT }}>
      {scenes.map((scene, i) => (
        <Sequence key={i} from={i * sceneFrames} durationInFrames={sceneFrames}>
          <SceneView scene={scene} isLast={i === scenes.length - 1} durationFrames={sceneFrames} />
        </Sequence>
      ))}

      <Audio src={staticFile("music.wav")} volume={0.35} />

      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 160,
          height: 6,
          width: 888,
          background: "rgba(244, 241, 234, 0.15)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(frame / durationInFrames) * 100}%`,
            background: COLORS.accent,
          }}
        />
      </div>

      <div style={{ position: "absolute", left: 96, bottom: 96, fontSize: 36, fontWeight: 600, opacity: 0.8 }}>
        Finanzielle Ordnung
      </div>
    </AbsoluteFill>
  );
};

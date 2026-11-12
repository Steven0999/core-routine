export const exercises = [
  {
    title: "Glute bridges",
    dose: "2 sets of 10 · 3-second hold",
    setup: "Lie on your back with knees bent and feet hip-width apart. Gently squeeze a small pillow or rolled towel between your knees.",
    movement: "Press through your heels and lift your hips a few inches. Squeeze your glutes for 3 seconds, then lower slowly.",
    phases: ["Lift hips", "Squeeze glutes", "Lower slowly"],
    timing: [1.4, 3, 1.8],
    video: {
      provider: "Physiotherapy2fit",
      embed: "https://www.youtube-nocookie.com/embed/2zlbuClXMOQ?rel=0",
      source: "https://physiotherapy2fit.com/exercises/bridge-pillow-squeeze/",
    },
  },
  {
    title: "Clamshells",
    dose: "2 sets of 10 per side",
    setup: "Lie on your side with hips and knees bent about 45°, feet stacked and hips one above the other.",
    movement: "Keep your feet touching and your pelvis still. Lift the top knee a few inches, pause, then lower slowly. Turn over to work the other side.",
    phases: ["Open top knee", "Pause", "Close slowly"],
    timing: [1.35, 0.6, 1.55],
    video: {
      provider: "Peak Physio",
      embed: "https://www.youtube-nocookie.com/embed/oMu0NCNU514?rel=0",
      source: "https://www.peak-physio.com.au/exercise/clams-level-1/",
    },
  },
  {
    title: "Dead bug heel taps",
    dose: "8–10 taps per leg · Alternate sides",
    setup: "Lie on your back with both arms pointing up. Raise your legs so your hips and knees are bent to 90°.",
    movement: "Brace and keep your lower back against the floor. Slowly lower one leg for a light heel tap, return to the start, then switch sides.",
    phases: ["Lower one heel", "Tap heel", "Return to tabletop"],
    timing: [1.75, 0.18, 1.75],
    alternating: true,
    video: {
      provider: "Stretch Affect",
      embed: "https://player.vimeo.com/video/558304783?dnt=1",
      source: "https://vimeo.com/558304783",
    },
  },
  {
    title: "Bird-dog leg slides",
    dose: "8 reps per side · 3-second hold",
    setup: "Start on your hands and knees with a neutral spine. Gently brace your stomach muscles.",
    movement: "Keep both hands planted and slide one leg straight back along the floor. Keep your hips level, hold for 3 seconds, then slide back in. Switch sides.",
    phases: ["Slide leg back", "Hold", "Slide leg in"],
    timing: [1.55, 3, 1.65],
    alternating: true,
    video: {
      provider: "Body Works Sports Physiotherapy",
      embed: "https://www.youtube-nocookie.com/embed/hm2LwJb6yPw?rel=0",
      source: "https://body-works.ca/physio-video/core-strength-four-point-kneeling-with-heel-slides/",
    },
  },
];

export const steps = [
  { exercise: 0, set: 1, repetitions: 10 },
  { exercise: 0, set: 2, repetitions: 10 },
  { exercise: 1, set: 1, side: 1, repetitions: 10 },
  { exercise: 1, set: 1, side: 2, repetitions: 10 },
  { exercise: 1, set: 2, side: 1, repetitions: 10 },
  { exercise: 1, set: 2, side: 2, repetitions: 10 },
  { exercise: 2 },
  { exercise: 3, repetitions: 8 },
];

const betweenReps = 0.7;
const smooth = n => n * n * (3 - 2 * n);

export function sampleMovement(exercise, elapsed, repetitions, preparation = 0, fixedSide = 1) {
  const [out, hold, back] = exercise.timing;
  const duration = out + hold + back + betweenReps;
  const total = repetitions * (exercise.alternating ? 2 : 1);
  const position = elapsed - preparation;
  const index = Math.floor(Math.max(0, position) / duration);
  if (position < 0) {
    return { amount: 0, side: fixedSide, phase: "Get ready · " + Math.ceil(-position), rep: 0, progress: 0 };
  }
  if (index >= total) {
    return { amount: 0, side: fixedSide, phase: "Complete", rep: repetitions, progress: 1, done: true };
  }

  const time = position - index * duration - betweenReps;
  const side = exercise.alternating && index % 2 === 1 ? -1 : fixedSide;
  const rep = exercise.alternating ? Math.floor(index / 2) + 1 : index + 1;
  let amount = 0;
  let phase = exercise.alternating && index > 0 ? "Switch sides" : "Start position";
  if (time >= 0 && time < out) {
    amount = smooth(time / out);
    phase = exercise.phases[0];
  } else if (time >= out && time < out + hold) {
    amount = 1;
    phase = exercise.phases[1];
    if (hold === 3) phase += " · " + Math.ceil(out + hold - time) + " s";
  } else if (time >= out + hold) {
    amount = 1 - smooth(Math.min(1, (time - out - hold) / back));
    phase = exercise.phases[2];
  }
  return { amount, side, phase, rep, progress: position / (duration * total) };
}

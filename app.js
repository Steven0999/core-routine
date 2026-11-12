import { exercises, sampleMovement, steps } from "./routine.js";
import { createMovementScene } from "./movement.js";

const byId = id => document.getElementById(id);
const scene = createMovementScene(byId("movement"));
const pageTitle = byId("page-title");
const pageDescription = byId("page-description");
const modeAction = byId("mode-action");
const modeLabel = byId("mode-label");
const startOver = byId("start-over");
const lesson = byId("lesson");
const lessonTitle = byId("exercise-title");
const complete = byId("complete");
const completeTitle = byId("complete-title");
const dose = byId("dose");
const setup = byId("setup");
const cue = byId("movement-cue");
const mediaSwitcher = byId("media-switcher");
const animationPanel = byId("animation-panel");
const videoPanel = byId("video-panel");
const videoPlayer = byId("video-player");
const videoSource = byId("video-source");
const videoProvider = byId("video-provider");
const phase = byId("phase");
const runAction = byId("run-action");
const runLabel = byId("run-label");
const setTracker = byId("set-tracker");
const repLabel = byId("rep-label");
const setProgress = byId("set-progress");
const tapSetting = byId("tap-setting");
const tapCount = byId("tap-count");
const transition = byId("transition");
const planProgress = byId("plan-progress");
const exerciseButtons = Array.from(document.querySelectorAll("[data-exercise]"));
const mediaButtons = Array.from(document.querySelectorAll("[data-media]"));
const storageKey = "core-routine-session-v1";

let session = readSession();
let mode = "browse";
let selection = 0;
let media = "animation";
let sessionElapsed = 0;
let demoElapsed = 0;
let demoComplete = false;
let resting = Boolean(session && session.index > 0);
let frameId = null;
let startTime = 0;

function readSession() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    if (Number.isInteger(value?.index) && value.index >= 0 && value.index <= steps.length
        && [8, 9, 10].includes(value.taps)) return value;
  } catch {
    // The routine also works when storage is blocked.
  }
  return null;
}

function saveSession() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(session));
  } catch {
    // Current-session progress remains available in memory.
  }
}

function isGuided() {
  return mode === "guided";
}

function currentIndex() {
  return isGuided() ? steps[session.index]?.exercise : selection;
}

function repetitions(step) {
  return step.repetitions ?? session.taps;
}

function updatePlan(index) {
  const remaining = steps.slice(session?.index ?? 0);
  let completeCount = 0;
  exerciseButtons.forEach((button, exercise) => {
    const done = !remaining.some(step => step.exercise === exercise);
    if (done) completeCount += 1;
    button.dataset.complete = String(done);
    button.querySelector(".exercise-number").textContent = done ? "✓" : String(exercise + 1);
    if (index === exercise) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
    const summary = button.querySelector(".exercise-dose").textContent;
    button.setAttribute("aria-label", exercises[exercise].title + ", " + summary + (done ? ", complete" : ""));
  });
  planProgress.hidden = !session;
  planProgress.textContent = completeCount + " of " + exercises.length + " complete";
}

function guidedDose(step, exercise) {
  if (step.exercise === 2) return repetitions(step) + " taps per leg · Alternate sides";
  if (!step.set) return exercise.dose;
  const prefix = "Set " + step.set + " of 2 · ";
  if (step.side) return prefix + "Side " + step.side + " · " + repetitions(step) + " reps";
  return prefix + repetitions(step) + " reps · 3-second hold";
}

function showVideo(exercise) {
  const player = document.createElement("iframe");
  player.src = exercise.video.embed;
  player.title = exercise.title + " video demonstration";
  player.allow = "encrypted-media; picture-in-picture; fullscreen";
  player.allowFullscreen = true;
  player.referrerPolicy = "strict-origin-when-cross-origin";
  videoPlayer.replaceChildren(player);
  videoProvider.textContent = exercise.video.provider;
  videoSource.href = exercise.video.source;
}

function setLabel(element, label) {
  if (element.textContent !== label) element.textContent = label;
}

function renderPlayback() {
  const guided = isGuided();
  const playing = frameId !== null;
  const elapsed = guided ? sessionElapsed : demoElapsed;
  runAction.dataset.playing = String(playing);
  if (guided) setLabel(runLabel, playing ? "Pause set" : elapsed > 0 ? "Resume set" : "Start set");
  else setLabel(runLabel, playing ? "Pause animation" : demoComplete ? "Replay animation" : elapsed > 0 ? "Resume animation" : "Play animation");
  tapSetting.hidden = !(guided && currentIndex() === 2 && !playing && elapsed === 0);
}

function paintSample(index, sample) {
  scene.render(index, sample.amount, sample.side);
  setLabel(phase, sample.phase);
  if (!isGuided()) return;

  const exercise = exercises[index];
  const target = repetitions(steps[session.index]);
  const word = index === 2 ? "Tap" : "Rep";
  const side = exercise.alternating && sample.rep > 0 ? (sample.side > 0 ? "Side 1 · " : "Side 2 · ") : "";
  const counter = sample.rep > 0
    ? side + word + " " + sample.rep + " of " + target
    : "0 of " + target + (index === 2 ? " taps" : " reps") + (exercise.alternating ? " per side" : "");
  setLabel(repLabel, counter);
  setProgress.value = sample.progress;
}

function renderPosition() {
  const index = currentIndex();
  const guided = isGuided();
  const step = guided ? steps[session.index] : null;
  const elapsed = guided ? sessionElapsed : demoElapsed;
  const side = step?.side === 2 ? -1 : 1;
  const sample = sampleMovement(exercises[index], elapsed, step ? repetitions(step) : 1, guided ? 3 : 0, side);
  if (demoComplete && !guided) sample.phase = "Demo complete";
  else if (elapsed === 0) sample.phase = "Start position";
  else sample.phase = "Paused";
  paintSample(index, sample);
}

function restMessage(step) {
  if (!resting || session.index === 0) return "";
  const last = steps[session.index - 1];
  if (step.exercise === 1 && last.exercise === 1 && step.side !== last.side) {
    return "Side complete. Turn over when you’re ready.";
  }
  if (step.exercise !== last.exercise) return "Exercise complete. Start the next one when you’re ready.";
  return "Set complete. Rest before starting the next set.";
}

function render() {
  const guided = isGuided();
  const step = guided ? steps[session.index] : null;
  const index = currentIndex();
  const finished = guided && !step;
  const canResume = Boolean(session && session.index < steps.length);
  pageTitle.textContent = guided ? "Guided session" : "Beginner core session";
  pageDescription.textContent = guided
    ? "Follow the animation and rest between sets as needed."
    : "Have a small pillow or rolled towel handy for the bridges.";
  modeLabel.textContent = guided ? "Browse exercises" : canResume ? "Resume session" : "Start session";
  startOver.hidden = guided || !canResume || (session.index === 0 && sessionElapsed === 0);
  lesson.hidden = finished;
  complete.hidden = !finished;
  updatePlan(index);

  videoPlayer.replaceChildren();
  if (finished) return;
  const exercise = exercises[index];
  lessonTitle.textContent = exercise.title;
  dose.textContent = step ? guidedDose(step, exercise) : exercise.dose;
  setup.textContent = exercise.setup;
  cue.textContent = exercise.movement;
  mediaSwitcher.hidden = guided;
  mediaButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.media === media)));
  animationPanel.hidden = media !== "animation";
  videoPanel.hidden = media !== "video";
  if (media === "video") {
    showVideo(exercise);
    return;
  }

  setTracker.hidden = !guided;
  tapCount.value = String(session?.taps ?? 8);
  const message = step ? restMessage(step) : "";
  transition.hidden = !message;
  transition.textContent = message;
  renderPosition();
  renderPlayback();
}

function stopPlayback() {
  if (frameId === null) return;
  cancelAnimationFrame(frameId);
  frameId = null;
}

function finishSet() {
  session.index += 1;
  sessionElapsed = 0;
  resting = true;
  saveSession();
  render();
  if (session.index === steps.length) completeTitle.focus();
}

function tick(now) {
  const elapsed = Math.max(0, (now - startTime) / 1000);
  const index = currentIndex();
  const guided = isGuided();
  const step = guided ? steps[session.index] : null;
  const side = step?.side === 2 ? -1 : 1;
  if (guided) sessionElapsed = elapsed;
  else demoElapsed = elapsed;
  const sample = sampleMovement(exercises[index], elapsed, step ? repetitions(step) : 1, guided ? 3 : 0, side);
  if (sample.done) {
    frameId = null;
    if (guided) finishSet();
    else {
      demoComplete = true;
      renderPosition();
      renderPlayback();
    }
    return;
  }
  paintSample(index, sample);
  frameId = requestAnimationFrame(tick);
}

function run() {
  if (frameId !== null) {
    stopPlayback();
    renderPosition();
    renderPlayback();
    return;
  }
  if (demoComplete && !isGuided()) {
    demoComplete = false;
    demoElapsed = 0;
  }
  if (isGuided()) resting = false;
  transition.hidden = true;
  startTime = performance.now() - (isGuided() ? sessionElapsed : demoElapsed) * 1000;
  frameId = requestAnimationFrame(tick);
  renderPlayback();
}

function browse(index = 0) {
  stopPlayback();
  mode = "browse";
  selection = index;
  media = "animation";
  demoElapsed = 0;
  demoComplete = false;
  render();
}

function guide(fresh = false) {
  stopPlayback();
  if (fresh || !session || session.index === steps.length) {
    session = { index: 0, taps: session?.taps ?? 8 };
    sessionElapsed = 0;
    resting = false;
    saveSession();
  }
  mode = "guided";
  media = "animation";
  render();
  lessonTitle.focus();
}

byId("brand").addEventListener("click", () => browse());
modeAction.addEventListener("click", () => {
  if (isGuided()) browse(currentIndex() ?? 0);
  else guide();
});
startOver.addEventListener("click", () => guide(true));
byId("start-again").addEventListener("click", () => guide(true));
runAction.addEventListener("click", run);

exerciseButtons.forEach((button, index) => button.addEventListener("click", () => {
  if (isGuided() && currentIndex() === index) return;
  browse(index);
  if (matchMedia("(max-width: 650px)").matches) lessonTitle.focus();
}));

mediaButtons.forEach(button => button.addEventListener("click", () => {
  if (media === button.dataset.media) return;
  stopPlayback();
  media = button.dataset.media;
  render();
}));

tapCount.addEventListener("change", () => {
  const value = Number(tapCount.value);
  if (![8, 9, 10].includes(value)) return;
  session.taps = value;
  saveSession();
  render();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden || frameId === null) return;
  stopPlayback();
  renderPosition();
  renderPlayback();
});

render();

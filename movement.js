const colours = {
  mat: "#c3d8c2",
  matEdge: "#a5c2aa",
  matSeam: "#afc9b1",
  shadow: "rgb(29 48 38 / 10%)",
  pants: "#263b35",
  farPants: "#718077",
  movePants: "#3e614e",
  shirt: "#46896a",
  shirtDetail: "#2d674d",
  skin: "#f0ba9e",
  farSkin: "#dda98d",
  hair: "#292724",
  cushion: "#f2e2a3",
  cushionEdge: "#a99a57",
};

const cameras = [
  [28, 19, 0.68, 91],
  [15, 40, 0.63, 102],
  [24, 15, 0.83, 104],
  [24, 17, 0.76, 93],
];

export function createMovementScene(canvas) {
  const brush = canvas.getContext("2d");
  let exercise = 0;
  let pose = { amount: 0, side: 1 };
  let width = 0;
  let height = 0;
  let scale = 1;
  let screen;

  const lerp = (a, b, t) => a + (b - a) * t;
  const radians = degrees => degrees * Math.PI / 180;
  const at = ([x, y], z) => [x, y, z];

  function polygon(points, colour) {
    brush.fillStyle = colour;
    brush.beginPath();
    brush.moveTo(...points[0]);
    points.slice(1).forEach(point => brush.lineTo(...point));
    brush.closePath();
    brush.fill();
  }

  function oval(x, y, rx, ry, colour, angle = 0) {
    brush.fillStyle = colour;
    brush.beginPath();
    brush.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
    brush.fill();
  }

  function trace(points, thickness, colour) {
    brush.strokeStyle = colour;
    brush.lineWidth = thickness;
    brush.lineCap = "round";
    brush.lineJoin = "round";
    brush.beginPath();
    brush.moveTo(...points[0]);
    points.slice(1).forEach(point => brush.lineTo(...point));
    brush.stroke();
  }

  function mat() {
    const deck = [[-94, 0, -29], [103, 0, -29], [103, 0, 29], [-94, 0, 29]];
    const lip = deck.map(([x, y, z]) => [x, y - 1.7, z]);
    polygon(lip.map(screen), colours.matEdge);
    polygon(deck.map(screen), colours.mat);
    trace(deck.map(screen).concat([screen(deck[0])]), Math.max(0.7, scale * 0.36), colours.matSeam);
  }

  function shadow(x, z, length, depth) {
    const [left, top] = screen([x, 0, z]);
    oval(left, top, length * scale, depth * scale, colours.shadow, -0.09);
  }

  function limb(joints, radii, colour) {
    const points = joints.map(screen);
    const widths = radii.map(radius => radius * scale);
    points.slice(1).forEach(([x, y], i) => {
      const [lastX, lastY] = points[i];
      const span = Math.hypot(x - lastX, y - lastY) || 1;
      const normalX = (lastY - y) / span;
      const normalY = (x - lastX) / span;
      const first = widths[i];
      const second = widths[i + 1];
      polygon([
        [lastX + normalX * first, lastY + normalY * first],
        [x + normalX * second, y + normalY * second],
        [x - normalX * second, y - normalY * second],
        [lastX - normalX * first, lastY - normalY * first],
      ], colour);
    });
    points.forEach(([x, y], i) => oval(x, y, widths[i], widths[i], colour));
  }

  function torso(shoulder, hip) {
    const [x, y] = screen(shoulder);
    const [endX, endY] = screen(hip);
    const length = Math.hypot(endX - x, endY - y) / scale;
    brush.save();
    brush.translate(x, y);
    brush.rotate(Math.atan2(endY - y, endX - x));
    brush.scale(scale, scale);
    oval(length - 1, 0, 12, 9.7, colours.pants);
    brush.fillStyle = colours.shirt;
    brush.beginPath();
    brush.moveTo(-5, 5);
    brush.bezierCurveTo(-8, 2, -7, -5, -2, -8);
    brush.bezierCurveTo(6, -12, 14, -11, 22, -9);
    brush.quadraticCurveTo(length - 21, -7.6, length - 7, -8.5);
    brush.quadraticCurveTo(length - 4, 0, length - 8, 8.5);
    brush.bezierCurveTo(length - 22, 8.8, 17, 10.4, 7, 9.3);
    brush.quadraticCurveTo(-3, 9, -5, 5);
    brush.fill();
    trace([[length - 8, -7.7], [length - 6.3, 0], [length - 8.4, 7.8]], 0.9, colours.shirtDetail);
    brush.restore();
  }

  function head(center, neck, angle) {
    limb([neck, center], [4.8, 4.4], colours.skin);
    brush.save();
    brush.translate(...screen(center));
    brush.rotate(angle);
    brush.scale(scale, scale);
    brush.fillStyle = colours.skin;
    brush.beginPath();
    brush.moveTo(-7.8, 5);
    brush.bezierCurveTo(-12, -2, -7.5, -9.3, -1, -9.7);
    brush.bezierCurveTo(4.4, -10.5, 7.6, -6, 8, -2.4);
    brush.lineTo(10, 0.8);
    brush.quadraticCurveTo(10.5, 2, 7.9, 2.6);
    brush.lineTo(7.6, 5.6);
    brush.quadraticCurveTo(6.2, 9.9, 0.3, 8.7);
    brush.quadraticCurveTo(-6.3, 8.6, -7.8, 5);
    brush.fill();
    brush.fillStyle = colours.hair;
    brush.beginPath();
    brush.moveTo(-7.8, 5);
    brush.bezierCurveTo(-12.8, -1.1, -8.6, -10.8, -1.6, -10.7);
    brush.bezierCurveTo(3.2, -11.2, 7, -8.5, 7.8, -5.1);
    brush.quadraticCurveTo(2.5, -6.2, 0.4, -2.8);
    brush.quadraticCurveTo(-4.8, -3, -3.6, 3);
    brush.lineTo(-5.3, 6.5);
    brush.fill();
    oval(-3.5, 1.0, 1.7, 2.2, colours.farSkin, -0.3);
    oval(5.4, -1.2, 0.63, 0.72, colours.hair);
    brush.restore();
  }

  function arm(shoulder, elbow, wrist, fingers, near) {
    const skin = near ? colours.skin : colours.farSkin;
    limb([shoulder, elbow, wrist], [4.1, 3.5, 2.55], skin);
    limb([wrist, fingers], [2.65, 2.0], skin);
    limb([shoulder, shoulder.map((coord, i) => lerp(coord, elbow[i], 0.25))],
      [4.75, 4.2], near ? colours.shirt : colours.shirtDetail);
  }

  function leg(hip, knee, ankle, heel, toes, cloth, near) {
    limb([hip, knee, ankle], [7.3, 5.2, 3.15], cloth);
    const skin = near ? colours.skin : colours.farSkin;
    limb([ankle, heel, toes], [2.6, 2.5, 2.1], skin);
  }

  // Find the knee for a fixed hip and ankle while preserving both bone lengths.
  function bentJoint([x, y], [footX, footY], thigh, shin, bend) {
    const distance = Math.hypot(footX - x, footY - y);
    const unitX = (footX - x) / distance;
    const unitY = (footY - y) / distance;
    const along = (thigh * thigh - shin * shin + distance * distance) / (2 * distance);
    const offset = bend * Math.sqrt(Math.max(0, thigh * thigh - along * along));
    return [x + unitX * along - unitY * offset, y + unitY * along + unitX * offset];
  }

  function pillow(x, y) {
    const top = [[x - 6, y + 3, -9], [x + 6, y + 3, -9],
      [x + 6, y + 3, 9], [x - 6, y + 3, 9]];
    const base = top.map(([a, b, c]) => [a, b - 6, c]);
    polygon([top[1], base[1], base[2], top[2]].map(screen), colours.cushionEdge);
    polygon(top.map(screen), colours.cushion);
    trace([screen(top[0]), screen(top[3])], scale * 0.65, colours.cushionEdge);
  }

  function bridge({ amount }) {
    const shoulder = [-53, 11, 0];
    const hip = [-2 - 1.5 * amount, 10 + 13.5 * amount, 0];
    const ankle = [57, 5.7];
    const knee = bentJoint(hip, ankle, 40, 38, 1);
    const drawLeg = side => {
      const z = 11.8 * side;
      leg([hip[0], hip[1], z], at(knee, z), at(ankle, z), [54, 2.6, z],
        [69, 2.2, z], side > 0 ? colours.pants : colours.farPants, side > 0);
    };
    const drawArm = side => {
      const z = 14 * side;
      arm([-52, 10, z], [-32, 5.1, z + side * 1.5], [-13, 3.2, z + side * 3],
        [-6, 2.6, z + side * 3], side > 0);
    };
    shadow(-39, 0, 43, 5);
    shadow(60, 0, 12, 4);
    drawArm(-1);
    drawLeg(-1);
    torso(shoulder, hip);
    head([-72, 10.8, 0], [-55, 10.6, 0], -Math.PI / 2);
    pillow(knee[0] - 1.6, knee[1] - 1.4);
    drawLeg(1);
    drawArm(1);
  }

  // Rotate the top knee about the fixed line through the top hip and ankle.
  function rotateAbout(point, origin, end, angle) {
    const offset = point.map((value, i) => value - origin[i]);
    const axis = end.map((value, i) => value - origin[i]);
    const length = Math.hypot(...axis);
    const [x, y, z] = axis.map(value => value / length);
    const [a, b, c] = offset;
    const dot = x * a + y * b + z * c;
    const cross = [y * c - z * b, z * a - x * c, x * b - y * a];
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    return origin.map((value, i) => value + offset[i] * cosine + cross[i] * sine
      + [x, y, z][i] * dot * (1 - cosine));
  }

  function clam({ amount }) {
    const shoulder = [-52, 12.6, 0];
    const hip = [-9, 12.2, 0];
    const topHip = [-9, 18.5, 0];
    const topAnkle = [56, 8.2, 20];
    const topKnee = rotateAbout([22, 12.0, 27], topHip, topAnkle, -0.67 * amount);
    shadow(-37, 4, 43, 5);
    shadow(35, 20, 32, 3.6);
    arm([-52, 7, 0], [-66, 3.7, 7], [-83, 3.2, 8], [-89, 2.1, 8], false);
    leg([-9, 6.3, 0], [22, 5.5, 27], [56, 3.5, 20], [54, 2.7, 20], [66, 2.3, 20],
      colours.farPants, false);
    torso(shoulder, hip);
    head([-73.5, 11.8, 1], [-55, 10, 0], -1.25);
    leg(topHip, topKnee, topAnkle, [54, 7.3, 20], [66, 6.9, 20], colours.movePants, true);
    arm([-50, 17, 6], [-33, 12.5, 17], [-24, 3.0, 28], [-17, 2.1, 29], true);
  }

  function deadBug({ amount, side }) {
    const shoulder = [-53, 11, 0];
    const hip = [-3, 10.4, 0];
    const drawLeg = which => {
      const z = which * 12;
      const active = which === side;
      const angle = active ? amount * 0.932 : 0;
      const knee = [hip[0] + 40 * Math.sin(angle), hip[1] + 40 * Math.cos(angle), z];
      const ankle = [knee[0] + 36 * Math.cos(angle), knee[1] - 36 * Math.sin(angle), z];
      const heel = [ankle[0] + 1.1, ankle[1] - 3.3, z];
      const toes = [ankle[0] + 3.7 + 3.9 * Math.sin(angle), ankle[1] + 7.8, z];
      const cloth = active ? colours.movePants : which > 0 ? colours.pants : colours.farPants;
      leg([hip[0], hip[1], z], knee, ankle, heel, toes, cloth, which > 0);
    };
    const drawArm = which => {
      const z = which * 13;
      arm([-53, 11.6, z], [-53, 35.2, z], [-53, 56, z], [-53, 63, z], which > 0);
    };
    shadow(-37, 0, 45, 4.8);
    drawArm(-1);
    drawLeg(-1);
    torso(shoulder, hip);
    head([-72, 10.8, 0], [-55, 10.6, 0], -Math.PI / 2);
    drawLeg(1);
    drawArm(1);
  }

  function birdDog({ amount, side }) {
    const shoulder = [-41, 50, 0];
    const hip = [13, 48.3, 0];
    const drawLeg = which => {
      const z = which * 12;
      const slide = which === side ? amount : 0;
      const ankle = [lerp(51.8, 84.15, slide), lerp(4.5, 7.6, slide)];
      const knee = bentJoint(hip, ankle, 43, 39, -1);
      const toes = [ankle[0] + lerp(8.5, 5.2, slide), 2.15, z];
      const heel = [ankle[0] + 0.9, ankle[1] + 0.4, z];
      const cloth = which === side ? colours.movePants : which > 0 ? colours.pants : colours.farPants;
      leg([hip[0], hip[1], z], at(knee, z), at(ankle, z), heel, toes, cloth, which > 0);
    };
    const drawArm = which => {
      const z = which * 13;
      arm([-41, 49, z], [-41, 26.5, z], [-41.5, 4.0, z], [-48, 2.1, z], which > 0);
    };
    shadow(-44, 0, 12, 3.5);
    shadow(29, 0, 27, 4);
    drawLeg(-1);
    drawArm(-1);
    torso(shoulder, hip);
    head([-58.8, 42.6, 0], [-45.5, 47, 0], 1.94);
    drawLeg(1);
    drawArm(1);
  }


  const movements = [bridge, clam, deadBug, birdDog];

  function draw() {
    if (!width || !height) return;
    const [yaw, tilt, floor, verticalSpace] = cameras[exercise];
    const cosYaw = Math.cos(radians(yaw));
    const sinYaw = Math.sin(radians(yaw));
    const cosTilt = Math.cos(radians(tilt));
    const sinTilt = Math.sin(radians(tilt));
    scale = Math.min(width / 218, height / verticalSpace);
    screen = ([x, y, z]) => [
      width / 2 + scale * (cosYaw * x + sinYaw * z),
      height * floor + scale * (sinTilt * (-sinYaw * x + cosYaw * z) - cosTilt * y),
    ];
    brush.clearRect(0, 0, width, height);
    brush.save();
    if (exercise === 1 && pose.side < 0) {
      brush.translate(width, 0);
      brush.scale(-1, 1);
    }
    mat();
    movements[exercise](pose);
    brush.restore();
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    brush.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  new ResizeObserver(resize).observe(canvas);
  resize();

  return {
    render(index, amount = 0, side = 1) {
      exercise = index;
      pose = { amount, side };
      draw();
    },
  };
}

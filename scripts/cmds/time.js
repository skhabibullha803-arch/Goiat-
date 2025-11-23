const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "time",
  version: "11.0",
  author: "MOHAMMAD AKASH",
  countDown: 5,
  role: 0,
  shortDescription: "Calendar up time card",
  category: "utility",
  guide: { en: "{p}time" }
};

module.exports.onStart = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    // === India Time (GMT+5:30) ===
    const now = new Date();
    const indiaOffset = 5.5 * 60 * 60 * 1000; // 5.5 ঘণ্টা
    const indiaTime = new Date(now.getTime() + indiaOffset);

    const year = indiaTime.getFullYear();
    const month = indiaTime.getMonth();
    const date = indiaTime.getDate();
    const day = indiaTime.getDay();
    let hours = indiaTime.getHours();
    const minutes = indiaTime.getMinutes();
    const seconds = indiaTime.getSeconds();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = days[day];
    const monthName = months[month];

    // === Generate Card ===
    const filePath = await generateUpCard({
      year, month, date, dayName, monthName, timeStr
    });

    await api.sendMessage({
      body: `${dayName}, ${date} ${monthName} ${year}\n${timeStr}\nIST (GMT+5:30)`,
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);

    setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 10000);

  } catch (error) {
    console.error(error);
    api.sendMessage("Error!", threadID, messageID);
  }
};

// === Calendar Up Card ===
async function generateUpCard(data) {
  const width = 850;
  const height = 950;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Black BG
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Glossy
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  roundRect(ctx, 0, 0, width, height, 50, true);

  // Neon Border
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 8;
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 40;
  roundRect(ctx, 40, 40, width - 80, height - 80, 50, false, true);
  ctx.shadowColor = 'transparent';

  // Clock
  ctx.font = 'bold 100px "Courier New"';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 60;
  ctx.fillText(data.timeStr, width / 2, 170);
  ctx.shadowColor = 'transparent';

  // Day Name
  ctx.font = 'bold 70px "Segoe UI"';
  ctx.fillStyle = '#ff00ff';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 40;
  ctx.fillText(data.dayName.toUpperCase(), width / 2, 270);
  ctx.shadowColor = 'transparent';

  // Full Date
  ctx.font = 'italic 50px "Segoe UI"';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`${data.date} ${data.monthName} ${data.year}`, width / 2, 340);

  // Header (Up)
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const headerY = 410; // Up
  const cellWidth = 100;
  const startX = (width - 7 * cellWidth) / 2 + 50;
  weekDays.forEach((d, i) => {
    const x = startX + i * cellWidth;
    ctx.fillStyle = i === 0 || i === 6 ? '#ff6b6b' : '#00ffcc';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 25;
    ctx.fillText(d, x, headerY);
    ctx.shadowColor = 'transparent';
  });

  // Grid (Up)
  const firstDay = new Date(data.year, data.month, 1).getDay();
  const daysInMonth = new Date(data.year, data.month + 1, 0).getDate();

  const gridStartY = 480; // Up from 500
  const rowHeight = 75; // Compact
  let dayCount = 1;

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const cellIndex = row * 7 + col;
      if (cellIndex < firstDay) continue;
      if (dayCount > daysInMonth) break;

      const x = startX + col * cellWidth;
      const y = gridStartY + row * rowHeight;

      if (dayCount === data.date) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(x, y, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 50px Arial';
        ctx.fillText(dayCount, x, y);
      } else {
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 45px Arial';
        ctx.fillText(dayCount, x, y);
      }
      dayCount++;
    }
    if (dayCount > daysInMonth) break;
  }

  // Footer (Optional)
  ctx.font = 'italic 35px "Segoe UI"';
  // Footer content can be added here

  const filePath = path.join(__dirname, `time_card_${Date.now()}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// === Helper: Rounded Rectangle ===
function roundRect(ctx, x, y, width, height, radius, fill = false, stroke = false) {
  if (typeof radius === 'number') radius = { tl: radius, tr: radius, br: radius, bl: radius };
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs; // Roboto с кирилица

// символ за списъците (можеш да смениш на "–" или "▪")
const ITEM_SYMBOL = "•";

// --- helpers ---
const splitList = (val) => {
  if (Array.isArray(val)) return val.map(String).map(s => s.trim()).filter(Boolean);
  return String(val ?? "")
    .split(/[&\n]/g)                // делим по & и нов ред
    .map(s => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const parseNutrition = (val) => {
  if (!val) return [];
  if (typeof val === "object" && !Array.isArray(val)) {
    const { kcal, proteins, fats, carbs } = val;
    return [
      kcal != null && `${kcal} килокалории`,
      proteins != null && `${proteins} гр. протеини`,
      fats != null && `${fats} гр. мазнини`,
      carbs != null && `${carbs} гр. въглехидрати`,
    ].filter(Boolean);
  }
  // текст -> редове; махаме „Ключ:“ ако има
  return splitList(val).map(line => line.replace(/^([^:|-]+)[:|-]\s*/i, "").trim());
};

// конвертиране на изображение към dataURL (за pdfmake)
// конвертира изображение (вкл. WebP) -> dataURL (PNG), подходящо за pdfmake
// Конвертира (вкл. WebP) -> ДАУНСКЕЙЛНАТ JPEG dataURL за pdfmake
async function toPdfDataURL(url, maxSide = 900, jpegQuality = 0.82) {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();

    // Зареждаме в bitmap или <img>
    let w, h, draw;
    if ("createImageBitmap" in window) {
      const bmp = await createImageBitmap(blob);
      w = bmp.width; h = bmp.height;
      draw = (ctx) => ctx.drawImage(bmp, 0, 0, w, h);
    } else {
      const img = await new Promise((resolve, reject) => {
        const tag = new Image();
        tag.onload = () => resolve(tag);
        tag.onerror = reject;
        tag.src = URL.createObjectURL(blob);
      });
      w = img.naturalWidth || img.width;
      h = img.naturalHeight || img.height;
      draw = (ctx) => ctx.drawImage(img, 0, 0, w, h);
    }

    // Даунскейл към maxSide (запазва пропорции)
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    draw(ctx);

    // JPEG е по-икономичен за снимки от PNG
    return canvas.toDataURL("image/jpeg", jpegQuality);
  } catch (e) {
    console.warn("toPdfDataURL() failed:", e);
    return null;
  }
}




// --- main ---
export async function downloadRecipePdf(recipe) {
  if (!recipe) return;

  const {
    name,
    purpose,
    category,
    meal_time,
    prep_time,
    level,
    ingredients,
    instructions,
    nutrition,
    image_url,
    slug,
  } = recipe;

  const ing = splitList(ingredients);
  const steps = splitList(instructions);
  const nutr = parseNutrition(nutrition);

  const detailsRows = [
    ["Предназначение", purpose],
    ["Категория", category],
    ["Част от деня", meal_time],
    ["Време за приготвяне", prep_time],
    ["Ниво на трудност", level],
  ]
    .map(([k, v]) => [`${k}:`, String(v ?? "—")]) // <- добавяме двоеточие
    .filter((r) => r[1] && r[1] !== "—");

  const imgData = image_url ? await toPdfDataURL(image_url, 900, 0.82) : null;

  const doc = {
    info: {
      title: name ? `Рецепта – ${name}` : "Рецепта",
      author: "VitaFreshGo",
      subject: "Рецепта PDF",
    },
    pageSize: "A4",
    pageMargins: [36, 48, 36, 48],
    defaultStyle: { font: "Roboto", fontSize: 11, color: "#111111" },

    header: () => ({
      text: "VitaFreshGo — Рецепта",
      alignment: "center",
      margin: [0, 12, 0, 0],
      fontSize: 10,
      color: "#475569",
    }),
    footer: (current, total) => ({
      columns: [
        { text: "", width: "*" },
        { text: `${current} / ${total}`, alignment: "right", margin: [0, 0, 24, 0], color: "#64748b" },
      ],
    }),

    content: [
      { text: name || "Рецепта", style: "title", margin: [0, 0, 0, 10] },
      imgData && { image: imgData, width: 220, alignment: "left", margin: [0, 0, 0, 14] },

      // --- Детайли ---
      detailsRows.length && {
        table: {
          widths: ["auto", "*"],
          body: [
            [{ text: "Детайли", style: "thead", colSpan: 2, fillColor: "#f1f5f9" }, {}],
            ...detailsRows.map(([k, v]) => [{ text: k, bold: true }, { text: v }]),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 14],
      },

      // --- Съставки (без номерация; с символ в отделна колона) ---
      ing.length && {
        table: {
          widths: [12, "*"],
          body: [
            [{ text: "Съставки", style: "thead", colSpan: 2, fillColor: "#f1f5f9" }, {}],
            ...ing.map((t) => [{ text: ITEM_SYMBOL, alignment: "center" }, { text: t }]),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 14],
      },

      // --- Инструкции (с номерация остава) ---
      steps.length && {
        table: {
          widths: [20, "*"],
          body: [
            [
              { text: "№", style: "thead", alignment: "center", fillColor: "#f1f5f9" },
              { text: "Инструкции", style: "thead", fillColor: "#f1f5f9" },
            ],
            ...steps.map((t, i) => [{ text: String(i + 1), alignment: "center" }, { text: t }]),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 14],
      },

      // --- Хранителни стойности (същия символ като при съставките) ---
      nutr.length && {
        table: {
          widths: [12, "*"],
          body: [
            [{ text: "Хранителни стойности", style: "thead", colSpan: 2, fillColor: "#f1f5f9" }, {}],
            ...nutr.map((t) => [{ text: ITEM_SYMBOL, alignment: "center" }, { text: t }]),
          ],
        },
        layout: "lightHorizontalLines",
      },
    ].filter(Boolean),

    styles: {
      title: { fontSize: 18, bold: true },
      thead: { fontSize: 12, bold: true },
    },
  };

  pdfMake.createPdf(doc).download(`${slug || name || "recipe"}.pdf`);
}

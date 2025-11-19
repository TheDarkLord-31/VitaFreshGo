// src/Components/PlanPDF.jsx
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs; // Roboto (има кирилица)

const BULLET = "•";

// ------------ helpers ------------
const splitList = (val) => {
  if (Array.isArray(val)) return val.map(String).map(s => s.trim()).filter(Boolean);
  return String(val ?? "")
    .split(/[&\n]/g) // делим по & и нов ред
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
  return splitList(val).map(line => line.replace(/^([^:|-]+)[:|-]\s*/i, "").trim());
};

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // безопасно за canvas
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function toPdfDataURL(
  url,
  { maxSide = 900, format = "png", quality = 0.9, smoothing = true } = {}
) {
  // 1) Първи опит: директно чрез <img> (без fetch)
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = smoothing;
    ctx.imageSmoothingQuality = smoothing ? "high" : "low";
    ctx.drawImage(img, 0, 0, tw, th);

    return canvas.toDataURL(`image/${format}`, format === "jpeg" ? quality : undefined);
  } catch (e) {
    console.warn("toPdfDataURL via <img> failed:", e);
  }

  // 2) Резервен опит: fetch + bitmap
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();

    let w, h, draw;
    if ("createImageBitmap" in window) {
      const bmp = await createImageBitmap(blob);
      w = bmp.width; h = bmp.height;
      draw = (ctx) => {
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close?.();
      };
    } else {
      const img = await loadImage(URL.createObjectURL(blob));
      w = img.naturalWidth || img.width;
      h = img.naturalHeight || img.height;
      draw = (ctx) => ctx.drawImage(img, 0, 0, w, h);
    }

    const scale = Math.min(1, maxSide / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = smoothing;
    ctx.imageSmoothingQuality = smoothing ? "high" : "low";
    draw(ctx);

    return canvas.toDataURL(`image/${format}`, format === "jpeg" ? quality : undefined);
  } catch (e2) {
    console.warn("toPdfDataURL fetch fallback failed:", e2);
    return null;
  }
}





function getRecipe(recipes, id) {
  if (!id || !recipes) return null;
  if (Array.isArray(recipes)) return recipes.find(r => r?.id === id) || null;
  return recipes[id] || null;
}

function detailsRowsForRecipe(r, ingCount) {
  return [
    ["Предназначение:", r.purpose],
    ["Категория:", r.category],
    ["Част от деня:", r.meal_time],
    ["Време за приготвяне:", r.prep_time],
    ["Ниво на трудност:", r.level],
    ["Брой съставки:", String(ingCount)],
  ].map(([k, v]) => [k, String(v ?? "—")]);
}

function tableLight(body, widths, margin = [0,0,0,10]) {
  return { table: { widths, body }, layout: "lightHorizontalLines", margin };
}

/* пунктиран разделител (между блоковете) */
function divider() {
  return {
    canvas: [{
      type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1,
      lineColor: "#d1d5db",
      dash: { length: 4 } // ако viewer-ът не поддържа dash -> ще стане плътна линия
    }],
    margin: [0, 10, 0, 10]
  };
}

// блокове за 1 рецепта
function blocksForRecipe(label, r) {
  if (!r) return [];
  const ing   = splitList(r.ingredients);
  const steps = splitList(r.instructions);
  const nutr  = parseNutrition(r.nutrition);

  return [
    { text: `${label} — ${r.name}`, style: "sectionTitle", margin: [0, 6, 0, 6] },

    r._imgData && { image: r._imgData, width: 180, margin: [0, 0, 0, 8] },

    tableLight(
      [
        [{ text: "Детайли", style: "thead", colSpan: 2, fillColor: "#f1f5f9" }, {}],
        ...detailsRowsForRecipe(r, ing.length)
      ],
      ["auto", "*"]
    ),

    ing.length && tableLight(
      [
        [{ text: "Съставки", style: "thead", colSpan: 2, fillColor: "#f1f5f9" }, {}],
        ...ing.map(t => [{ text: BULLET, alignment: "center" }, { text: t }]),
      ],
      [12, "*"]
    ),

    steps.length && tableLight(
      [
        [
          { text: "№", style: "thead", alignment: "center", fillColor: "#f1f5f9" },
          { text: "Инструкции", style: "thead", fillColor: "#f1f5f9" },
        ],
        ...steps.map((t, i)=> [{ text: String(i + 1), alignment: "center" }, { text: t }]),
      ],
      [20, "*"]
    ),

    nutr.length && tableLight(
      [
        [{ text: "Хранителни стойности", style: "thead", colSpan: 2, fillColor: "#f1f5f9" }, {}],
        ...nutr.map(t => [{ text: BULLET, alignment: "center" }, { text: t }]),
      ],
      [12, "*"],
      [0,0,0,6]
    ),
  ].filter(Boolean);
}

// ------------ MAIN ------------
export async function downloadPlanPdf(plan, recipes) {
  if (!plan) return;

  const sections = [
    { key: "breakfast", label: "Закуска", id: plan.breakfast_id },
    { key: "lunch",     label: "Обяд",    id: plan.lunch_id },
    { key: "dinner",    label: "Вечеря",  id: plan.dinner_id },
    { key: "anytime1",  label: "По всяко време (1)", id: plan.anytime_1_id },
    { key: "anytime2",  label: "По всяко време (2)", id: plan.anytime_2_id },
  ];

  // preload images
  const recipeList = sections.map(s => getRecipe(recipes, s.id)).filter(Boolean);
  await Promise.allSettled(
    recipeList.map(async (r) => {
      if (r?.image_url) r._imgData = await toPdfDataURL(r.image_url);
    })
  );


  const logoSrc =
    document.querySelector('link[rel="icon"]')?.href
    ?? new URL('/favicon_v2.png', window.location.origin).href;

  const logoData = await toPdfDataURL(logoSrc, {
    maxSide: 96,       // малко и рязко
    format: 'png',     // прозрачност, остри ръбове
    smoothing: false,  // без замазване
  });


  if (!logoData) console.warn('⚠️ Logo not embedded. Source:', logoSrc);

  
  const doc = {
    info: {
      title: plan.name ? `План – ${plan.name}` : "План",
      author: "VitaFreshGo",
      subject: "План за хранене",
    },
    pageSize: "A4",
    pageMargins: [36, 48, 36, 48],
    defaultStyle: { font: "Roboto", fontSize: 11, color: "#111111" },

    header: () => ({
      text: "VitaFreshGo — План за хранене",
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
      logoData && { image: logoData, width: 64, alignment: "center", margin: [0, 0, 0, 8] },
      { text: plan.name || "План", style: "title", margin: [0, 0, 0, 10] },

      tableLight(
        [
          [{ text: "Детайли на плана", style: "thead", colSpan: 2, fillColor: "#f1f5f9" }, {}],
          ["Категория:", plan.category || "—"],
          ["Действие:",  plan.action   || "—"],
        ],
        ["auto", "*"],
        [0,0,0,10]
      ),

      plan.notes && { text: "Бележки", style: "thead", margin: [0,4,0,4] },
      plan.notes && { text: String(plan.notes), margin: [2,0,0,0] },

      // разделител преди първата секция
      divider(),

      // секции с рецепти, разделени с линия
      // всяка рецепта започва на нова страница
      ...sections.flatMap((s) => {
        const r = getRecipe(recipes, s.id);
        if (!r) return [];

        const blocks = blocksForRecipe(s.label, r);

        // слагаме page break пред заглавието на секцията
        if (blocks.length > 0) {
          blocks[0] = { ...blocks[0], pageBreak: 'before' };
        }
        return blocks;
      }),

    ].filter(Boolean),

    styles: {
      title: { fontSize: 18, bold: true },
      thead: { fontSize: 12, bold: true },
      sectionTitle: { fontSize: 14, bold: true },
    },
  };

  pdfMake.createPdf(doc).download(`${plan.slug || plan.name || "plan"}.pdf`);
}

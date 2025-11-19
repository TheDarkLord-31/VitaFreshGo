// src/Components/Seo.jsx
import { useEffect } from "react";

const BASE_URL = "https://vitafreshgo.com"; // смени ако е друг домейн
const DEFAULT_TITLE = "VitaFreshGo";
const DEFAULT_DESC =
  "Здравословни рецепти и хранителни планове за заети хора – бързо, лесно и вкусно.";

// helper: прави абсолютен URL
function toAbsoluteUrl(url) {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return BASE_URL + url;
  return `${BASE_URL}/${url}`;
}

export default function Seo({
  title,
  description,
  canonical,
  image,
  type = "website", // за рецепта/статия може да подадеш "article"
  jsonLd,
}) {
  useEffect(() => {
    const created = [];

    const upsertMeta = (attr, key, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
        created.push(tag);
      }
      tag.setAttribute("content", content);
    };

    const upsertLink = (rel, href, track = true) => {
      if (!href) return;
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
        if (track) created.push(link);
      }
      link.setAttribute("href", href);
    };

    const injectJsonLd = (data) => {
      if (!data) return;
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
      created.push(script);
    };

    const finalTitle = title || DEFAULT_TITLE;
    const finalDesc = description || DEFAULT_DESC;
    const absCanonical = canonical ? toAbsoluteUrl(canonical) : undefined;
    const absImage = image ? toAbsoluteUrl(image) : undefined;

    // title
    document.title = finalTitle;

    // basic meta
    upsertMeta("name", "description", finalDesc);

    // canonical
    if (absCanonical) {
      upsertLink("canonical", absCanonical);
    }

    // preconnect / dns-prefetch към Supabase (добавяме веднъж, не ги трием)
    upsertLink("preconnect", "https://nzohxudmjqxrvkhgmnpt.supabase.co", false);
    upsertLink("dns-prefetch", "https://nzohxudmjqxrvkhgmnpt.supabase.co", false);

    // Open Graph
    upsertMeta("property", "og:title", finalTitle);
    upsertMeta("property", "og:description", finalDesc);
    upsertMeta("property", "og:type", type);
    if (absCanonical) upsertMeta("property", "og:url", absCanonical);
    if (absImage) upsertMeta("property", "og:image", absImage);
    upsertMeta("property", "og:site_name", "VitaFreshGo");

    // Twitter
    upsertMeta("name", "twitter:card", absImage ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", finalTitle);
    upsertMeta("name", "twitter:description", finalDesc);
    if (absImage) upsertMeta("name", "twitter:image", absImage);

    // JSON-LD (structured data)
    injectJsonLd(jsonLd);

    // чистим само това, което този компонент е създал
    return () => {
      created.forEach((el) => el.remove());
    };
  }, [title, description, canonical, image, type, jsonLd]);

  return null;
}

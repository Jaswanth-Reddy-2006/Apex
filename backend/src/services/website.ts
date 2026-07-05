import * as cheerio from "cheerio";

export function chunkText(text: string, size = 800, overlap = 150): string[] {
  if (text.length <= size) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let endIndex = currentIndex + size;
    
    // Adjust endIndex to end at a space if possible, so we don't cut words
    if (endIndex < text.length) {
      const nextSpace = text.indexOf(" ", endIndex);
      if (nextSpace !== -1 && nextSpace - endIndex < 50) {
        endIndex = nextSpace;
      }
    } else {
      endIndex = text.length;
    }

    chunks.push(text.slice(currentIndex, endIndex).trim());
    
    if (endIndex >= text.length) {
      break;
    }

    // Move forward by size minus the overlap
    const step = size - overlap;
    currentIndex = currentIndex + (step > 0 ? step : size);
  }

  return chunks.filter(c => c.length > 20); // filter out tiny chunks
}

export async function scrapeAndChunk(url: string): Promise<{ title: string; chunks: string[] }> {
  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    
    console.log(`[Scraper] Fetching HTML from: ${formattedUrl}`);
    const response = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage (status ${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Strip out useless elements to avoid noisy embeddings
    $("script, style, nav, header, footer, iframe, noscript, svg, form").remove();

    const title = $("title").text().trim() || "Untitled Page";
    
    // Get text and clean up whitespace
    const bodyText = $("body").text();
    const cleanedText = bodyText
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ")
      .trim();

    console.log(`[Scraper] Parsed text length: ${cleanedText.length} characters`);
    const chunks = chunkText(cleanedText, 800, 150);
    console.log(`[Scraper] Generated ${chunks.length} chunks`);

    const formattedChunks = chunks.map((chunk, index) => {
      return `Website URL: ${formattedUrl}\nTitle: ${title}\nChunk ${index + 1}/${chunks.length}\n\nContent:\n${chunk}`;
    });

    return {
      title,
      chunks: formattedChunks,
    };
  } catch (error: any) {
    console.error("[Scraper] Error during scraping:", error);
    throw new Error(`Web Scraper failed: ${error.message}`);
  }
}

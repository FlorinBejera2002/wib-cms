/**
 * Transform content_sections (Directus HTML) → content_blocks (clean structured blocks)
 *
 * Block types:
 *   { type: "heading", level: 2, id: "anchor-id", text: "..." }
 *   { type: "paragraph", text: "..." }
 *   { type: "image", src: "https://...", alt: "..." }
 *   { type: "list", style: "ordered"|"unordered", items: [{ label: "...", text: "..." }] }
 *
 * - HTML tags are stripped from text
 * - Links in text are preserved as [text](url) markdown notation
 * - <strong>Label</strong>: text  →  { label: "Label", text: "text" }
 * - content field split by "|" into separate paragraphs
 */

// Run inside mongosh: load("scripts/transform-content-blocks.js")

function stripHtml(str) {
  if (!str) return "";
  // Convert <a href="url"><strong>text</strong></a> → [text](url)
  str = str.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, function(_, url, inner) {
    var linkText = inner.replace(/<[^>]+>/g, "").trim();
    return "[" + linkText + "](" + url + ")";
  });
  // Strip remaining HTML tags
  str = str.replace(/<[^>]+>/g, "");
  // Clean up whitespace
  str = str.replace(/\s+/g, " ").trim();
  return str;
}

function parseListItem(raw) {
  var cleaned = stripHtml(raw);
  // Pattern: "Label: rest of text" (from <strong>Label</strong>: text)
  var match = cleaned.match(/^([^:]+?):\s+(.+)$/s);
  if (match && match[1].length < 80) {
    return { label: match[1].trim(), text: match[2].trim() };
  }
  return { text: cleaned };
}

function transformSection(section) {
  var blocks = [];

  // Heading
  if (section.heading) {
    var block = { type: "heading", level: 2, text: stripHtml(section.heading) };
    if (section.id) block.id = section.id;
    blocks.push(block);
  }

  // Image (if present, put after heading)
  if (section.image && section.image.src) {
    blocks.push({
      type: "image",
      src: section.image.src,
      alt: section.image.alt || ""
    });
  }

  // Content paragraphs (split by "|")
  if (section.content) {
    var paragraphs = section.content.split("|");
    for (var p = 0; p < paragraphs.length; p++) {
      var text = stripHtml(paragraphs[p]);
      if (text) {
        blocks.push({ type: "paragraph", text: text });
      }
    }
  }

  // Lists
  if (section.lists && section.lists.length > 0) {
    for (var l = 0; l < section.lists.length; l++) {
      var list = section.lists[l];
      if (!list.items || list.items.length === 0) continue;
      var items = [];
      for (var i = 0; i < list.items.length; i++) {
        items.push(parseListItem(list.items[i]));
      }
      var listBlock = {
        type: "list",
        style: list.ordered ? "ordered" : "unordered",
        items: items
      };
      if (list.title) listBlock.title = stripHtml(list.title);
      blocks.push(listBlock);
    }
  }

  // Subsections (recursive)
  if (section.subsections && section.subsections.length > 0) {
    for (var s = 0; s < section.subsections.length; s++) {
      var subBlocks = transformSection(section.subsections[s]);
      // Bump heading level to 3 for subsections
      for (var b = 0; b < subBlocks.length; b++) {
        if (subBlocks[b].type === "heading") subBlocks[b].level = 3;
        blocks.push(subBlocks[b]);
      }
    }
  }

  // Additional content
  if (section.additional_content) {
    var addText = stripHtml(section.additional_content);
    if (addText) {
      blocks.push({ type: "paragraph", text: addText });
    }
  }

  return blocks;
}

// --- Main ---
db = db.getSiblingDB("wib_test");
var col = db.getCollection("blog-posts");
var docs = col.find({}).toArray();
var updated = 0;
var errors = 0;

for (var d = 0; d < docs.length; d++) {
  var doc = docs[d];
  var allBlocks = [];

  // intro_text → first paragraph block
  if (doc.intro_text) {
    allBlocks.push({ type: "paragraph", text: stripHtml(doc.intro_text) });
  }

  // Transform content_sections
  if (doc.content_sections && doc.content_sections.length > 0) {
    for (var s = 0; s < doc.content_sections.length; s++) {
      var sectionBlocks = transformSection(doc.content_sections[s]);
      for (var b = 0; b < sectionBlocks.length; b++) {
        allBlocks.push(sectionBlocks[b]);
      }
    }
  }

  // conclusion → last paragraph block
  if (doc.conclusion) {
    allBlocks.push({ type: "paragraph", text: stripHtml(doc.conclusion) });
  }

  // Generate toc from heading blocks
  var toc = [];
  for (var b = 0; b < allBlocks.length; b++) {
    if (allBlocks[b].type === "heading") {
      toc.push({
        id: allBlocks[b].id || "",
        text: allBlocks[b].text,
        level: allBlocks[b].level
      });
    }
  }

  try {
    col.updateOne(
      { _id: doc._id },
      { $set: { content_blocks: allBlocks, toc_items: toc } }
    );
    updated++;
  } catch(e) {
    print("ERROR on " + doc.slug + ": " + e.message);
    errors++;
  }
}

print("Done: " + updated + " updated, " + errors + " errors, " + docs.length + " total");

import { describe, expect, it } from "vitest";
import {
  fromEditorHtml,
  isBlank,
  isRichText,
  plainText,
  previewText,
  textToHtml,
  toEditorHtml,
} from "./rich-text";

describe("isRichText", () => {
  it("tells editor HTML from older plain text", () => {
    expect(isRichText("<p>Minum air</p>")).toBe(true);
    expect(isRichText("<ul><li>Satu</li></ul>")).toBe(true);
    expect(isRichText("Tekanan darah < 120/80 mmHg")).toBe(false);
    expect(isRichText("Baris satu\nBaris dua")).toBe(false);
    expect(isRichText("")).toBe(false);
    expect(isRichText(null)).toBe(false);
  });
});

describe("textToHtml / toEditorHtml", () => {
  it("turns each line into a paragraph and escapes it", () => {
    expect(textToHtml("Satu\n\nDua <b>")).toBe(
      "<p>Satu</p><p><br></p><p>Dua &lt;b&gt;</p>",
    );
    expect(textToHtml("a\r\nb")).toBe("<p>a</p><p>b</p>");
    expect(textToHtml("   ")).toBe("");
  });

  it("leaves HTML as it is", () => {
    expect(toEditorHtml("<p>Ya</p>")).toBe("<p>Ya</p>");
    expect(toEditorHtml("Ya")).toBe("<p>Ya</p>");
    expect(toEditorHtml(undefined)).toBe("");
  });
});

describe("fromEditorHtml", () => {
  it("saves an empty editor as an empty string", () => {
    expect(fromEditorHtml("<p><br></p>")).toBe("");
    expect(fromEditorHtml("<p></p>")).toBe("");
    expect(fromEditorHtml("<p>&nbsp;</p>")).toBe("");
  });

  it("turns Quill's non-breaking spaces back into normal spaces", () => {
    expect(fromEditorHtml("<p>Ambil&nbsp;ubat&nbsp;pagi</p>")).toBe(
      "<p>Ambil ubat pagi</p>",
    );
    expect(fromEditorHtml(`<p>a${String.fromCharCode(160)}b</p>`)).toBe(
      "<p>a b</p>",
    );
  });
});

describe("plainText / isBlank", () => {
  it("puts each block on its own line and decodes entities", () => {
    expect(
      plainText(
        "<h2>Tajuk</h2><p>Satu &amp; dua</p><ol><li>Pertama</li><li><strong>Kedua</strong></li></ol>",
      ),
    ).toBe("Tajuk\nSatu & dua\nPertama\nKedua");
    expect(plainText("<p>a<br>b</p>")).toBe("a\nb");
    expect(plainText("<p>&#65;&#x42; &lt;c&gt;</p>")).toBe("AB <c>");
  });

  it("leaves headings out of a preview", () => {
    expect(
      previewText("<h3>Arahan am</h3><ol><li>Minta pesakit</li></ol>"),
    ).toBe("Minta pesakit");
    expect(previewText("Teks biasa")).toBe("Teks biasa");
  });

  it("keeps plain text and treats empty markup as blank", () => {
    expect(plainText("  Teks biasa  ")).toBe("Teks biasa");
    expect(isBlank("<p><br></p><p> </p>")).toBe(true);
    expect(isBlank("<p>x</p>")).toBe(false);
    expect(isBlank(undefined)).toBe(true);
  });
});

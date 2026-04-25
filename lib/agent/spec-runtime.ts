import { validateGeneratedJavaScript } from "@/lib/html-sanitizer";

export function validateSpecRuntime(spec: Record<string, unknown>): void {
  const render = asRecord(spec.render);
  if (!render) {
    return;
  }

  validateSpecCode(render.draw);
  validateSpecCode(render.resultArea);
  validateSpecCode(render.setup);
  validateSpecCode(render.update);

  const tabs = render.tabs;
  if (Array.isArray(tabs)) {
    for (const tab of tabs) {
      const tabRecord = asRecord(tab);
      if (!tabRecord) {
        continue;
      }
      validateSpecCode(tabRecord.draw);
    }
  }

  validateSpecCode(spec.onReset);
}

function validateSpecCode(value: unknown): void {
  if (typeof value !== "string") {
    return;
  }

  validateGeneratedJavaScript(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

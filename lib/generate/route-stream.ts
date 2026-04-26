import {
  generateAndPublishTool,
  GenerateToolError,
} from "@/lib/generate/service";
import { createSseHeaders, formatSseEvent } from "@/lib/http/sse";
import { logger } from "@/lib/logger";

const HEARTBEAT_INTERVAL_MS = 15_000;
const SERVER_TIMEOUT_MS = 3 * 60 * 1000;

interface CreateGenerateStreamResponseInput {
  startTime: number;
  gradeId: string;
  subjectId: string;
  userIntent: string;
  gradeLabel: string;
  subjectLabel: string;
  releaseConnection: () => void;
}

export function createGenerateStreamResponse(
  input: CreateGenerateStreamResponseInput,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const safeSend = (event: string, data: unknown) => {
        if (closed) {
          return;
        }

        try {
          controller.enqueue(encoder.encode(formatSseEvent(event, data)));
        } catch {
          closeStream();
        }
      };

      const closeStream = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(heartbeat);
        clearTimeout(serverTimeout);
        input.releaseConnection();

        try {
          controller.close();
        } catch {}
      };

      const heartbeat = setInterval(() => {
        if (closed) {
          return;
        }

        try {
          controller.enqueue(encoder.encode(":\n\n"));
        } catch {
          closeStream();
        }
      }, HEARTBEAT_INTERVAL_MS);

      const serverTimeout = setTimeout(() => {
        safeSend("error", { error: "生成超时，请稍后重试" });
        closeStream();
      }, SERVER_TIMEOUT_MS);

      try {
        const result = await generateAndPublishTool(
          {
            gradeId: input.gradeId,
            subjectId: input.subjectId,
            userIntent: input.userIntent,
          },
          {
            onStage(event) {
              safeSend("stage", event);
            },
            onRefined(event) {
              safeSend("refined", event);
            },
          },
        );

        if (closed) {
          return;
        }

        safeSend("done", result);
        logger.info("生成成功", {
          id: result.tool.id,
          name: result.refinedName,
          gradeLabel: input.gradeLabel,
          subjectLabel: input.subjectLabel,
          durationMs: Date.now() - input.startTime,
        });
        closeStream();
      } catch (error) {
        if (closed) {
          return;
        }

        logger.error("生成失败", {
          message: error instanceof Error ? error.message : "未知错误",
          gradeLabel: input.gradeLabel,
          subjectLabel: input.subjectLabel,
          durationMs: Date.now() - input.startTime,
        });
        safeSend("error", {
          error:
            error instanceof GenerateToolError
              ? error.userMessage
              : "生成失败，请稍后重试",
        });
        closeStream();
      }
    },
  });

  return new Response(stream, { headers: createSseHeaders() });
}

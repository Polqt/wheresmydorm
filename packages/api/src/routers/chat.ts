import Anthropic from "@anthropic-ai/sdk";
import { TRPCError } from "@trpc/server";
import { db, searchEvents } from "@wheresmydorm/db";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { ensureFinder } from "../lib/guards";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});

const sendMessageSchema = z.object({
  /** Full conversation history so the server stays stateless. */
  messages: z.array(messageSchema).min(1).max(50),
});

const SYSTEM_PROMPT = `You are a helpful housing assistant for WherIsMyDorm, a student housing marketplace in the Philippines.
You help students (finders) find suitable dormitories, apartments, bedspaces, condos, boarding houses, and studio units near their schools.
Keep responses concise and practical. Focus on housing advice: location, budget, amenities, safety, and what to look for when viewing properties.
Do not help with topics unrelated to student housing.`;

export const chatRouter = router({
  send: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureFinder({
        message: "AI chat is available for finders only.",
        userId: ctx.userId,
      });

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI chat is unavailable right now.",
        });
      }

      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: input.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const textBlock = response.content.find((b) => b.type === "text");

      if (!textBlock || textBlock.type !== "text") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI chat returned an unexpected response.",
        });
      }

      // Record the interaction as a search event (quota + analytics)
      await db.insert(searchEvents).values({
        userId: ctx.userId,
        eventType: "ai_chat",
      });

      return {
        message: textBlock.text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    }),
});

import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "astro/zod";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      // Optional per-page JSON-LD hint consumed by src/components/seo/Head.astro.
      // Every content page emits TechArticle by default; setup/tutorial pages opt
      // into HowTo by setting `structuredData.type: howto` with ordered steps.
      // Pages with a visible FAQ section can declare `structuredData.faq` to emit
      // a FAQPage node alongside — answers must match the visible page text
      // (Google requirement), so keep them in sync when editing the page copy.
      extend: z.object({
        structuredData: z
          .object({
            type: z.enum(["techarticle", "howto"]).default("techarticle"),
            steps: z
              .array(
                z.object({
                  name: z.string(),
                  text: z.string(),
                  url: z.string().optional(),
                }),
              )
              .optional(),
            faq: z
              .array(
                z.object({
                  question: z.string(),
                  answer: z.string(),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    }),
  }),
};

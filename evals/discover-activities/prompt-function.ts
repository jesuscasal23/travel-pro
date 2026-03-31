import {
  SYSTEM_PROMPT_DISCOVER_ACTIVITIES,
  assembleDiscoverActivitiesPrompt,
} from "../../src/lib/ai/prompts/discover-activities";
import { fixtures } from "./fixtures";

interface PromptFunctionInput {
  vars: { fixtureId: string };
}

export default function generatePrompt({ vars }: PromptFunctionInput) {
  const fixture = fixtures[vars.fixtureId];
  if (!fixture) {
    throw new Error(
      `Unknown fixture "${vars.fixtureId}". Available: ${Object.keys(fixtures).join(", ")}`
    );
  }

  const userPrompt = assembleDiscoverActivitiesPrompt(
    fixture.profile,
    fixture.intent,
    fixture.city
  );

  return [
    { role: "system" as const, content: SYSTEM_PROMPT_DISCOVER_ACTIVITIES },
    { role: "user" as const, content: userPrompt },
  ];
}

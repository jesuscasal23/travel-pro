import type { Prisma } from "@prisma/client";

export const PROFILE_EXPORT_INCLUDE = {
  trips: {
    include: {
      itineraries: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.ProfileInclude;

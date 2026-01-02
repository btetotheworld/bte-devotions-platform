import { prisma } from "@bte-devotions/database";

const GHOST_URL = process.env.GHOST_URL || "";
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY || "";

export interface GhostAuthor {
  id: string;
  name: string;
  email: string;
  slug: string;
  [key: string]: unknown;
}

/**
 * Create a Ghost author via Admin API
 */
export async function createGhostAuthor(
  name: string,
  email: string,
  slug?: string
): Promise<GhostAuthor> {
  const authorData = {
    authors: [
      {
        name,
        email,
        ...(slug && { slug }),
      },
    ],
  };

  const response = await fetch(`${GHOST_URL}/ghost/api/admin/authors/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Ghost ${GHOST_ADMIN_API_KEY}`,
    },
    body: JSON.stringify(authorData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: "Failed to create Ghost author" 
    }));
    throw new Error(error.message || `Failed to create Ghost author: ${response.statusText}`);
  }

  const data = await response.json();
  return data.authors[0] as GhostAuthor;
}

/**
 * Get Ghost author by email
 */
export async function getGhostAuthorByEmail(email: string): Promise<GhostAuthor | null> {
  try {
    const response = await fetch(
      `${GHOST_URL}/ghost/api/admin/authors/?filter=email:${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Ghost ${GHOST_ADMIN_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return (data.authors && data.authors[0]) ? (data.authors[0] as GhostAuthor) : null;
  } catch (error) {
    console.error("Error fetching Ghost author:", error);
    return null;
  }
}

/**
 * Create or get Ghost author for a creator and store mapping
 */
export async function setupGhostAuthorForCreator(
  creatorId: string,
  userId: string,
  creatorName: string,
  creatorEmail: string,
  creatorSlug: string
): Promise<{ ghostAuthorId: string; mappingId: string }> {
  // Check if mapping already exists
  const existingMapping = await prisma.ghostAuthorMapping.findFirst({
    where: { creatorId },
  });

  if (existingMapping) {
    return {
      ghostAuthorId: existingMapping.ghostAuthorId,
      mappingId: existingMapping.id,
    };
  }

  // Try to get existing Ghost author by email
  let ghostAuthor = await getGhostAuthorByEmail(creatorEmail);

  // If author doesn't exist, create it
  if (!ghostAuthor) {
    try {
      ghostAuthor = await createGhostAuthor(creatorName, creatorEmail, creatorSlug);
    } catch (error) {
      console.error("Error creating Ghost author:", error);
      throw new Error(
        `Failed to create Ghost author: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Store the mapping
  const mapping = await prisma.ghostAuthorMapping.create({
    data: {
      ghostAuthorId: ghostAuthor.id,
      creatorId,
      userId,
    },
  });

  return {
    ghostAuthorId: ghostAuthor.id,
    mappingId: mapping.id,
  };
}

/**
 * Retry wrapper for Ghost API calls
 */
export async function retryGhostApiCall<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const waitTime = delay * attempt; // Exponential backoff
        console.warn(
          `Ghost API call failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}



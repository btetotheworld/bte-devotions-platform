import { NextResponse } from "next/server";
import { withAuth, retryGhostApiCall } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

const GHOST_URL = process.env.GHOST_URL || "";
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY || "";

// POST /api/ghost/posts - Create post in Ghost (with creator_id tag)
export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { title, html, excerpt, published_at, tags = [], contentType = "devotion", creatorId } = body;

    if (!title || !html) {
      return NextResponse.json({ error: "Title and HTML content are required" }, { status: 400 });
    }

    // Use creatorId from body or from session
    const targetCreatorId = creatorId || auth.session.creatorId;

    if (!targetCreatorId) {
      return NextResponse.json({ error: "Creator ID is required" }, { status: 400 });
    }

    // Verify user has access to this creator
    const { requireCreatorAccess } = await import("@bte-devotions/lib");
    await requireCreatorAccess(targetCreatorId);

    // Get creator slug for tagging
    const creator = await prisma.creator.findUnique({
      where: { id: targetCreatorId },
      select: { slug: true },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Prepare tags - always include creator_id and content type
    const creatorTag = `creator_id:${targetCreatorId}`;
    const contentTypeTag = `content_type:${contentType}`;
    const allTags = [...new Set([...tags, creatorTag, contentTypeTag])];

    // Get or create Ghost author mapping for this creator
    const ghostAuthorMapping = await prisma.ghostAuthorMapping.findFirst({
      where: { creatorId: targetCreatorId },
    });

    if (!ghostAuthorMapping) {
      // For now, we'll need to create the author in Ghost first
      // This is a placeholder - you'll need to implement Ghost author creation
      return NextResponse.json(
        { error: "Ghost author mapping not found. Please set up author first." },
        { status: 400 }
      );
    }

    // Create post in Ghost via Admin API with retry logic
    const ghostPost = {
      posts: [
        {
          title,
          html,
          excerpt,
          published_at,
          tags: allTags.map((tag) => ({ name: tag })),
          authors: [{ id: ghostAuthorMapping.ghostAuthorId }],
        },
      ],
    };

    const data = await retryGhostApiCall(async () => {
      const response = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Ghost ${GHOST_ADMIN_API_KEY}`,
        },
        body: JSON.stringify(ghostPost),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: `Failed to create post: ${response.statusText}` 
        }));
        throw new Error(error.message || `Failed to create post in Ghost: ${response.statusText}`);
      }

      return await response.json();
    });

    return NextResponse.json({ post: data.posts[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating Ghost post:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 }
    );
  }
});

// GET /api/ghost/posts - Get posts filtered by creator_id
export const GET = withAuth(async (req, auth) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const creatorId = url.searchParams.get("creatorId") || auth.session.creatorId;
    const contentType = url.searchParams.get("contentType"); // "devotion" | "article"

    if (!creatorId) {
      return NextResponse.json({ error: "Creator ID is required" }, { status: 400 });
    }

    // Verify user has access to this creator
    const { requireCreatorAccess } = await import("@bte-devotions/lib");
    await requireCreatorAccess(creatorId);

    const GHOST_CONTENT_API_KEY = process.env.GHOST_CONTENT_API_KEY || "";
    const creatorTag = `creator_id:${creatorId}`;
    const filter = contentType
      ? `tag:${creatorTag}+tag:content_type:${contentType}`
      : `tag:${creatorTag}`;

    const data = await retryGhostApiCall(async () => {
      const response = await fetch(
        `${GHOST_URL}/ghost/api/content/posts/?key=${GHOST_CONTENT_API_KEY}&filter=${encodeURIComponent(filter)}&limit=${limit}&page=${page}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch posts from Ghost: ${response.statusText}`);
      }

      return await response.json();
    });
    return NextResponse.json({
      posts: data.posts || [],
      meta: data.meta || {},
    });
  } catch (error) {
    console.error("Error fetching Ghost posts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
});

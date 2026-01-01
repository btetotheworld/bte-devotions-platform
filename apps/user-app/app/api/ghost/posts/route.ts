import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@bte-devotions/lib";
import { prisma } from "@bte-devotions/database";

const GHOST_URL = process.env.GHOST_URL || "";
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY || "";

// POST /api/ghost/posts - Create post in Ghost (with church_id tag)
export const POST = withAuth(async (req, auth) => {
  try {
    if (!auth.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, html, excerpt, published_at, tags = [] } = body;

    if (!title || !html) {
      return NextResponse.json(
        { error: "Title and HTML content are required" },
        { status: 400 }
      );
    }

    // Get church slug for tagging
    const church = await prisma.church.findUnique({
      where: { id: auth.session.churchId },
      select: { slug: true },
    });

    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // Prepare tags - always include church_id tag
    const churchTag = `church_id:${auth.session.churchId}`;
    const allTags = [...new Set([...tags, churchTag])];

    // Get or create Ghost author mapping for this user
    const ghostAuthorMapping = await prisma.ghostAuthorMapping.findUnique({
      where: { userId: auth.user.id },
    });

    if (!ghostAuthorMapping) {
      // For now, we'll need to create the author in Ghost first
      // This is a placeholder - you'll need to implement Ghost author creation
      return NextResponse.json(
        {
          error: "Ghost author mapping not found. Please set up author first.",
        },
        { status: 400 }
      );
    }

    // Create post in Ghost via Admin API
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

    const response = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Ghost ${GHOST_ADMIN_API_KEY}`,
      },
      body: JSON.stringify(ghostPost),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Failed to create post" }));
      throw new Error(error.message || "Failed to create post in Ghost");
    }

    const data = await response.json();
    return NextResponse.json({ post: data.posts[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating Ghost post:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create post",
      },
      { status: 500 }
    );
  }
});

// GET /api/ghost/posts - Get posts filtered by church_id
export const GET = withAuth(async (req, auth) => {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");

    // Get church tag
    const churchTag = `church_id:${auth.session.churchId}`;

    // Fetch posts from Ghost Content API filtered by tag
    const GHOST_CONTENT_API_KEY = process.env.GHOST_CONTENT_API_KEY || "";
    const response = await fetch(
      `${GHOST_URL}/ghost/api/content/posts/?key=${GHOST_CONTENT_API_KEY}&filter=tag:${encodeURIComponent(
        churchTag
      )}&limit=${limit}&page=${page}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch posts from Ghost");
    }

    const data = await response.json();
    return NextResponse.json({
      posts: data.posts || [],
      meta: data.meta || {},
    });
  } catch (error) {
    console.error("Error fetching Ghost posts:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch posts",
      },
      { status: 500 }
    );
  }
});

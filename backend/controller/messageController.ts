import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";

export interface Conversation {
  id: string;
  name: string;
  type: "internal" | "guest";
  participant_ids: string[];
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
}

// GET all conversations for a user
export const getConversations = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.type,
        c.participant_ids,
        c.created_at,
        c.updated_at,
        (
          SELECT m.message_text
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
          AND m.sender_id != $1
          AND m.is_read = false
        ) as unread_count
      FROM conversations c
      WHERE $1 = ANY(c.participant_ids)
      ORDER BY last_message_time DESC NULLS LAST
      `,
      [userId],
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: unknown) {
    console.error("Error fetching conversations:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to fetch conversations";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
};

// GET messages for a conversation
export const getMessages = async (
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
): Promise<NextResponse> => {
  try {
    const { conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.sender_name,
        m.message_text,
        m.created_at,
        m.is_read
      FROM messages m
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      `,
      [conversationId],
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: unknown) {
    console.error("Error fetching messages:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to fetch messages";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
};

// POST send a message
export const sendMessage = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { conversation_id, sender_id, sender_name, message_text } = body;

    if (!conversation_id || !sender_id || !sender_name || !message_text) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      INSERT INTO messages (
        conversation_id,
        sender_id,
        sender_name,
        message_text,
        is_read,
        created_at
      ) VALUES ($1, $2, $3, $4, false, timezone('Asia/Manila', NOW()))
      RETURNING *
      `,
      [conversation_id, sender_id, sender_name, message_text],
    );

    // Update conversation's updated_at timestamp
    await pool.query(
      `UPDATE conversations SET updated_at = timezone('Asia/Manila', NOW()) WHERE id = $1`,
      [conversation_id],
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error sending message:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to send message";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
};

// POST mark messages as read
export const markMessagesAsRead = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { conversation_id, user_id } = body;

    if (!conversation_id || !user_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    await pool.query(
      `
      UPDATE messages
      SET is_read = true
      WHERE conversation_id = $1
      AND sender_id != $2
      AND is_read = false
      `,
      [conversation_id, user_id],
    );

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error: unknown) {
    console.error("Error marking messages as read:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to mark messages as read";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
};

// POST create a new conversation
export const createConversation = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { name, type, participant_ids } = body;

    if (!name || !type || !participant_ids || participant_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      INSERT INTO conversations (
        name,
        type,
        participant_ids
      ) VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, type, participant_ids],
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error creating conversation:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to create conversation";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
};

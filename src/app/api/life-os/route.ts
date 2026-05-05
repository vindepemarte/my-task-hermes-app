import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedHeader } from "@/lib/lifeOsAuth";
import { createClient, createContentItem, createIdea, createInspiration, createLexaSuggestion, createTask, createTimeLog, getLifeOsState, updateTaskStatus, upsertDailyJournal } from "@/lib/lifeOsDb";

export const runtime = "nodejs";

async function isAuthorized(request: NextRequest) {
  return isAuthorizedHeader(request.headers.get("authorization"));
}

function unauthorized() {
  return NextResponse.json({ error: "Life OS login required" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) return unauthorized();
  try {
    return NextResponse.json(await getLifeOsState());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load Life OS" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) return unauthorized();
  try {
    const body = await request.json();
    if (body.type === "task") return NextResponse.json(await createTask(body.data));
    if (body.type === "timeLog") return NextResponse.json(await createTimeLog(body.data));
    if (body.type === "inspiration") return NextResponse.json(await createInspiration(body.data));
    if (body.type === "idea") return NextResponse.json(await createIdea(body.data));
    if (body.type === "client") return NextResponse.json(await createClient(body.data));
    if (body.type === "contentItem") return NextResponse.json(await createContentItem(body.data));
    if (body.type === "lexaSuggestion") return NextResponse.json(await createLexaSuggestion(body.data));
    if (body.type === "dailyJournal") return NextResponse.json(await upsertDailyJournal(body.data));
    return NextResponse.json({ error: "Unsupported Life OS entry type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save Life OS entry" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthorized(request))) return unauthorized();
  try {
    const body = await request.json();
    if (body.type === "taskStatus") return NextResponse.json(await updateTaskStatus(body.id, body.status));
    return NextResponse.json({ error: "Unsupported Life OS update type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update Life OS entry" }, { status: 500 });
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { setGlossary } from "@/lib/settings";

export async function saveGlossaryAction(terms: string[]): Promise<void> {
  setGlossary(terms);
  revalidatePath("/settings");
}

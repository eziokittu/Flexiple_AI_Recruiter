import rawProfiles from "@/data/profiles.json";
import { profileSchema, type Profile } from "@/lib/schemas";
import { z } from "zod";

export const profiles: Profile[] = z.array(profileSchema).parse(rawProfiles);

export function profilesByIds(ids: string[]): Profile[] {
  const wanted = new Set(ids);
  return profiles.filter((profile) => wanted.has(profile.id));
}

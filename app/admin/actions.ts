"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { emptyResults, type Results, type ActualKoMatch } from "@/lib/types";
import { fixtures, GROUP_LETTERS } from "@/lib/data";
import { getResults, saveResults } from "@/lib/store";

const KO_SLOTS: Record<string, number> = {
  r32: 16, r16: 8, qf: 4, sf: 2, third: 1, final: 1,
};

function num(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function str(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function saveResultsAction(formData: FormData) {
  const prev = await getResults();
  const data: Results = emptyResults();

  // Fase de grupos
  for (const L of GROUP_LETTERS) {
    for (const fm of fixtures.groups[L]) {
      const h = num(formData.get(`g_${fm.id}_h`));
      const a = num(formData.get(`g_${fm.id}_a`));
      if (h != null || a != null) data.groups[fm.id] = { hg: h, ag: a };
    }
  }

  // Equipos clasificados a dieciseisavos
  data.r32teams = formData.getAll("r32").map(String);

  // Llaves de eliminación
  for (const phase of Object.keys(KO_SLOTS) as (keyof Results["ko"])[]) {
    const matches: ActualKoMatch[] = [];
    for (let i = 0; i < KO_SLOTS[phase]; i++) {
      const home = str(formData.get(`ko_${phase}_${i}_home`));
      const away = str(formData.get(`ko_${phase}_${i}_away`));
      if (home && away) {
        matches.push({
          home,
          away,
          hg: num(formData.get(`ko_${phase}_${i}_hg`)),
          ag: num(formData.get(`ko_${phase}_${i}_ag`)),
        });
      }
    }
    data.ko[phase] = matches;
  }

  // Cuadro de honor
  data.honor = {
    scorerGold: str(formData.get("h_scorerGold")),
    scorerSilver: str(formData.get("h_scorerSilver")),
    scorerBronze: str(formData.get("h_scorerBronze")),
    ballonGold: str(formData.get("h_ballonGold")),
    ballonSilver: str(formData.get("h_ballonSilver")),
    ballonBronze: str(formData.get("h_ballonBronze")),
  };

  try {
    await saveResults(data);
  } catch (e) {
    // Mantener el comportamiento si el almacén no está configurado
    void prev;
    redirect("/admin?error=store");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?saved=1");
}

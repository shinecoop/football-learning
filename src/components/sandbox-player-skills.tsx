import type { SandboxScenario } from "@/domain/sandbox";
import { playerSkillSummary } from "@/domain/team-rosters";
import { baselineAttributes } from "@/domain/workspace-extras";

export function SandboxPlayerSkills({
  scenario,
  actorId,
}: {
  scenario: SandboxScenario;
  actorId: string;
}) {
  const player = scenario.lineup?.[actorId];
  if (!player) return null;
  const defender = scenario.defenders[actorId];
  const effective = defender?.ratings
    ? { ...player, ratings: defender.ratings, attributes: { ...baselineAttributes, ...player.attributes, awareness: defender.ratings.reaction } }
    : player;
  const skills = playerSkillSummary(effective, defender?.assignment.type).map((skill) =>
    skill.label === "Speed" && scenario.receivers[actorId]
      ? { ...skill, value: scenario.receivers[actorId].speed }
      : skill,
  );
  return (
    <section className="sandbox-player-skills" aria-label={`${actorId} player characteristics`}>
      <strong>{actorId} · {player.name}</strong>
      <span className="muted-copy">{player.positions} · ratings / 100</span>
      <dl>
        {skills.map((skill) => (
          <div key={skill.label}>
            <dt>{skill.label}</dt>
            <dd>{Number(skill.value.toFixed(1))}</dd>
          </div>
        ))}
      </dl>
      {(actorId === "QB" || actorId === "C") && (
        <p className="muted-copy">Informational only: passing and blocking are not simulated.</p>
      )}
    </section>
  );
}

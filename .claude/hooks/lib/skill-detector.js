/**
 * lib/skill-detector.js - Detecção de skills baseada em keywords
 *
 * Substitui: superpowers-activator.js
 */

function detectSkill(prompt, skillsConfig) {
  const promptLower = prompt.toLowerCase();

  // Ordenar skills por especificidade (triggers mais longos primeiro)
  const skillEntries = Object.entries(skillsConfig).sort((a, b) => {
    const maxLengthA = Math.max(...(a[1].triggers || []).map(t => t.length));
    const maxLengthB = Math.max(...(b[1].triggers || []).map(t => t.length));
    return maxLengthB - maxLengthA;
  });

  for (const [skillName, skillData] of skillEntries) {
    if (!skillData.triggers || skillData.triggers.length === 0) continue;

    for (const trigger of skillData.triggers) {
      if (promptLower.includes(trigger.toLowerCase())) {
        return {
          name: skillName,
          path: skillData.path,
          trigger: trigger
        };
      }
    }
  }

  return null; // Nenhuma skill detectada
}

module.exports = { detectSkill };

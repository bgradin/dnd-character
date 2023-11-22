import React from "react";
import "./CharacterSheet.scss";

import Box from "../../ui/Box";
import CharacterHeader from "../CharacterHeader";
import CharacterStats from "../CharacterStats";
import CharacterInspiration from "../CharacterInspiration";
import CharacterProficiency from "../CharacterProficiency";
import CharacterSavingThrows from "../CharacterSavingThrows";
import CharacterSkillScores from "../CharacterSkillScores";
import CharacterPassiveWisdom from "../CharacterPassiveWisdom";
import CharacterProficiencyOther from "../CharacterProficiencyOther";
import CharacterCombatStats from "../CharacterCombatStats";
import CharacterAttacksSpellcasting from "../CharacterAttacksSpellcasting";
import CharacterEquipment from "../CharacterEquipment";

export default function CharacterSheet() {
  return <Box className="vertical character-sheet">
    <CharacterHeader />
    <div className="body">
      <div className="right-column">
        <CharacterCombatStats />
      </div>
      <div className="left-column">
        <Box>
          <CharacterStats />
          <div className="character-stats-right-column">
            <div className="content">
              <CharacterInspiration />
              <CharacterProficiency />
              <CharacterSavingThrows />
              <CharacterSkillScores />
            </div>
          </div>
        </Box>
        <CharacterPassiveWisdom />
        <CharacterProficiencyOther />
      </div>
      <div className="right-column">
        <CharacterAttacksSpellcasting />
        <CharacterEquipment />
      </div>
    </div>
  </Box>;
}

import React from 'react';
import { register } from "../../../data";

import './CharacterProficiencyOther.scss';

export default function CharacterProficiencyOther() {
    return (
        <div className="character-proficiency-other">
            <div className="content">
                <textarea
                    className="character-proficiency-other__textarea"
                    name="characterProficiencyOther"
                    id="characterProficiencyOther"
                    cols="30"
                    rows="16"
                    ref={(input) => register(input)}
                ></textarea>
                <label
                    htmlFor="characterProficiencyOther"
                    className="character-proficiency-other__text"
                >
                    Other Proficiencies & Languages
                </label>
            </div>
        </div>
    )
}

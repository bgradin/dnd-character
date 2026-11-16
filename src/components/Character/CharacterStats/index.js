import React from 'react';
import { register } from "../../../data";

import './CharacterStats.scss';

export default function CharacterStats() {
    return (
        <div className="character-stats">
            <div className="character-stats__item">
                <label htmlFor="strength-score" className="character-stats__item-label">Strength</label>
                <input
                    name="strength-modifier"
                    id="strength-modifier"
                    aria-label="strength modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="strength-score"
                    id="strength-score"
                    aria-label="strength score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="dexterity-score" className="character-stats__item-label">Dexterity</label>
                <input
                    name="dexterity-modifier"
                    id="dexterity-modifier"
                    aria-label="dexterity modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="dexterity-score"
                    id="dexterity-score"
                    aria-label="dexterity score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="constitution-score" className="character-stats__item-label">Constitution</label>
                <input
                    name="constitution-modifier"
                    id="constitution-modifier"
                    aria-label="constitution modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="constitution-score"
                    id="constitution-score"
                    aria-label="constitution score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="intelligence-score" className="character-stats__item-label">Intelligence</label>
                <input
                    name="intelligence-modifier"
                    id="intelligence-modifier"
                    aria-label="intelligence modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="intelligence-score"
                    id="intelligence-score"
                    aria-label="intelligence score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="wisdom-score" className="character-stats__item-label">Wisdom</label>
                <input
                    name="wisdom-modifier"
                    id="wisdom-modifier"
                    aria-label="wisdom modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="wisdom-score"
                    id="wisdom-score"
                    aria-label="wisdom score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="charisma-score" className="character-stats__item-label">Charisma</label>
                <input
                    name="charisma-modifier"
                    id="charisma-modifier"
                    aria-label="charisma modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="charisma-score"
                    id="charisma-score"
                    aria-label="charisma score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
        </div>
    )
}

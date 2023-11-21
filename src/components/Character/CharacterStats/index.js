import React from 'react';
import { register } from "../../../data";

import './CharacterStats.scss';

export default function CharacterStats() {
    return (
        <div className="character-stats">
            <div className="character-stats__item">
                <label htmlFor="" className="character-stats__item-label">Strength</label>
                <input
                    name="strength-modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="strength-score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="" className="character-stats__item-label">Dexterity</label>
                <input
                    name="dexterity-modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="dexterity-score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="" className="character-stats__item-label">Constitution</label>
                <input
                    name="constitution-modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="constitution-score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="" className="character-stats__item-label">Intelligence</label>
                <input
                    name="intelligence-modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="intelligence-score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="" className="character-stats__item-label">Wisdom</label>
                <input
                    name="wisdom-modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="wisdom-score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
            <div className="character-stats__item">
                <label htmlFor="" className="character-stats__item-label">Charisma</label>
                <input
                    name="charisma-modifier"
                    type="text"
                    className="character-stats__item-input-ability-modifier"
                    ref={(input) => register(input)}
                />
                <input
                    name="charisma-score"
                    type="text"
                    className="character-stats__item-input-ability-score"
                    ref={(input) => register(input)}
                />
            </div>
        </div>
    )
}

import React from 'react';
import { register } from "../../../data";

import './CharacterCombatStats.scss';

export default function CharacterCombatStats() {
    return (
        <div className="character-combat-stats">
            <div className="character-combat-stats-row">
                <div className="character-combat-stats__armor">
                    <input
                        id="armorClass"
                        name="armorClass"
                        type="text"
                        className="character-combat-stats__input"
                        ref={(input) => register(input)}
                    />
                    <label htmlFor="armorClass">Armor <br /> Class</label>
                </div>
                <div className="character-combat-stats__initiative">
                    <input
                        id="initiative"
                        name="initiative"
                        type="text"
                        className="character-combat-stats__input"
                        ref={(input) => register(input)}
                    />
                    <label htmlFor="initiative">Initiative</label>
                </div>
                <div className="character-combat-stats__speed">
                    <input
                        id="speed"
                        name="speed"
                        type="text"
                        className="character-combat-stats__input"
                        ref={(input) => register(input)}
                    />
                    <label htmlFor="speed">Speed</label>
                </div>
            </div>
            <div className="character-combat-stats__hitpoints">
                <div className="character-combat-stats__hitpoints-current">
                    <div className="content">
                        <div className="character-combat-stats__hitpoints-current-wrap">
                            <label
                                className="character-combat-stats__hitpoints-current-text"
                                htmlFor="hitpointsMax"
                            >
                                Hit Point Maximum
                            </label>
                            <input
                                className="form-input-underline"
                                type="text"
                                name="hitpointsMax"
                                id="hitpointsMax"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <textarea
                            className="character-combat-stats__hitpoints-current-textarea"
                            name="hitpointsMaxText"
                            id="hitpointsMaxText"
                            cols="30"
                            rows="3"
                            ref={(input) => register(input)}
                        ></textarea>
                        <label
                            htmlFor="hitpointsMaxText"
                            className="character-combat-stats__text"
                        >
                            Current Hit Points
                        </label>
                    </div>
                </div>
                <div className="character-combat-stats__hitpoints-temp">
                    <div className="content">
                        <textarea
                            className="character-combat-stats__hitpoints-temp-textarea"
                            name="tempHitPoints"
                            id="tempHitPoints"
                            cols="30"
                            rows="4"
                            ref={(input) => register(input)}
                        ></textarea>
                        <label
                            className="character-combat-stats__text"
                            htmlFor="tempHitPoints"
                        >
                            Temporary Hit Points
                        </label>
                    </div>
                </div>
            </div>
            <div className="character-combat-stats-row">
                <div className="character-combat-stats__hit">
                    <div className="content">
                        <div className="flex">
                            <label className="form-input-underline-label" htmlFor="hitDiceTotal">Total</label>
                            <input
                                className="form-input-underline"
                                type="text"
                                name="hitDiceTotal"
                                id="hitDiceTotal"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <div className="flex character-combat-stats__hit-dice-used">
                            <label className="form-input-underline-label" htmlFor="hitDiceUsed">Used</label>
                            <input
                                className="form-input-underline"
                                type="text"
                                name="hitDiceUsed"
                                id="hitDiceUsed"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <label
                            className="character-combat-stats__text"
                        >
                            Hit Dice
                        </label>
                    </div>
                </div>
                <div className="character-combat-stats__death-saves">
                    <div className="content">
                        <textarea
                            className="character-combat-stats__death-saves-textarea"
                            name="deathSaves"
                            id="deathSaves"
                            cols="30"
                            rows="4"
                            ref={(input) => register(input)}
                        ></textarea>
                        <label
                            htmlFor="deathSaves"
                            className="character-combat-stats__text"
                        >
                            Death Saves
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}

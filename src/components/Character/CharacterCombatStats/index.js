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
            <div className="character-combat-stats-row">
                <div className="character-combat-stats__hitpoints">
                    <div className="content">
                        <div className="flex character-combat-stats__field">
                            <label className="form-input-underline-label" htmlFor="hitpointsMax">Maximum</label>
                            <input
                                className="form-input-underline"
                                type="text"
                                name="hitpointsMax"
                                id="hitpointsMax"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <div className="flex character-combat-stats__field">
                            <label className="form-input-underline-label" htmlFor="hitpointsMaxText">Current</label>
                            <input
                                className="form-input-underline"
                                type="text"
                                name="hitpointsMaxText"
                                id="hitpointsMaxText"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <div className="flex character-combat-stats__field">
                            <label className="form-input-underline-label" htmlFor="tempHitPoints">Temporary</label>
                            <input
                                className="form-input-underline"
                                type="text"
                                name="tempHitPoints"
                                id="tempHitPoints"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <span className="character-combat-stats__text">Hit Points</span>
                    </div>
                </div>
                <div className="character-combat-stats__hit">
                    <div className="content">
                        <div className="flex character-combat-stats__field">
                            <label className="form-input-underline-label" htmlFor="hitDiceTotal">Total</label>
                            <input
                                className="form-input-underline"
                                type="text"
                                name="hitDiceTotal"
                                id="hitDiceTotal"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <div className="flex character-combat-stats__field">
                            <label className="form-input-underline-label" htmlFor="hitDiceUsed">Used</label>
                            <input
                                className="form-input-underline"
                                type="text"
                                name="hitDiceUsed"
                                id="hitDiceUsed"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <span className="character-combat-stats__text">Hit Dice</span>
                        <div className="character-combat-stats__death-saves-fields">
                            <div className="flex character-combat-stats__field">
                                <label className="form-input-underline-label" htmlFor="deathSavesSuccess">Success</label>
                                <input
                                    className="form-input-underline"
                                    type="text"
                                    name="deathSavesSuccess"
                                    id="deathSavesSuccess"
                                    ref={(input) => register(input)}
                                />
                            </div>
                            <div className="flex character-combat-stats__field">
                                <label className="form-input-underline-label" htmlFor="deathSavesFailure">Failure</label>
                                <input
                                    className="form-input-underline"
                                    type="text"
                                    name="deathSavesFailure"
                                    id="deathSavesFailure"
                                    ref={(input) => register(input)}
                                />
                            </div>
                            <span className="character-combat-stats__text">Death Saves</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

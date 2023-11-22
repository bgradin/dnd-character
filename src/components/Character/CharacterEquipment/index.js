import React from 'react';
import { register } from "../../../data";

import './CharacterEquipment.scss';

export default function CharacterEquipment() {
    return (
        <div className="character-equipment">
            <div className="content">
                <div className="character-equipment-wrap">
                    <div className="character-equipment__stats">
                        <div className="character-equipment__stats-item">
                            <span className="character-equipment__stats-item-text">CP</span>
                            <input
                                name="cp"
                                type="text"
                                className="character-equipment__stats-item-input"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <div className="character-equipment__stats-item">
                            <span className="character-equipment__stats-item-text">SP</span>
                            <input
                                name="sp"
                                type="text"
                                className="character-equipment__stats-item-input"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <div className="character-equipment__stats-item">
                            <span className="character-equipment__stats-item-text">EP</span>
                            <input
                                name="ep"
                                type="text"
                                className="character-equipment__stats-item-input"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <div className="character-equipment__stats-item">
                            <span className="character-equipment__stats-item-text">GP</span>
                            <input
                                name="gp"
                                type="text"
                                className="character-equipment__stats-item-input"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <div className="character-equipment__stats-item">
                            <span className="character-equipment__stats-item-text">PP</span>
                            <input
                                name="pp"
                                type="text"
                                className="character-equipment__stats-item-input"
                                ref={(input) => register(input)}
                            />
                        </div>
                        <label
                            className="character-attack-spellcasting__text"
                        >
                            Gold
                        </label>
                    </div>
                    <div className="character-equipment__textarea">
                        <textarea
                            name="equipment"
                            id="equipment"
                            cols="30"
                            rows="19"
                            ref={(input) => register(input)}
                        ></textarea>
                        <label
                            htmlFor="equipment"
                            className="character-attack-spellcasting__text"
                        >
                            Equipment
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
